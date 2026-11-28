
import type {
  ApiErrorResponse,
  CheckinRequest,
  EndpointKey,
  Endpoints,
  SyncItem,
} from '../../shared/contract';
import { getAnonToken } from './anonToken';

// Set in frontend/.env.local (local) and in the Vercel project settings (hosted).
// Read inside a function so tests can change it; Next.js still inlines it at build time.
// || not ??: an empty NEXT_PUBLIC_API_URL= line must fall back too, or the app calls itself.
const baseUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/** The server answered with an error (4xx/5xx). `code` comes from the contract's ApiErrorCode. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: { index?: number },
  ) {
    super(message);
  }
}

/** The request never reached the server (offline, DNS, CORS). Check-ins go to the offline queue. */
export class NetworkError extends Error {}

/** Calm copy for a failed request (MM-603). `fallback` covers 4xx errors not listed here. */
export function describeError(err: unknown, fallback: string): string {
  if (err instanceof NetworkError) return 'We could not reach MindMeter. Check your connection and try again.';
  if (!(err instanceof ApiError)) return fallback;
  if (err.status === 429) return 'You are going a little fast. Please wait a minute and try again.';
  if (err.status === 401) return 'This browser could not be recognised. Please reload the page and try again.';
  if (err.status >= 500) return 'Something went wrong on our side. Please try again in a moment.';
  return fallback;
}

async function request<K extends EndpointKey>(
  key: K,
  body?: Endpoints[K]['request'],
): Promise<Endpoints[K]['response']> {
  const [method, path] = key.split(' ');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (key !== 'GET /api/resources') headers['X-Anon-Token'] = getAnonToken(); // resources needs no token

  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new NetworkError('Could not reach the MindMeter server.');
  }

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as ApiErrorResponse | null)?.error;
    throw new ApiError(res.status, err?.code ?? 'INTERNAL_ERROR', err?.message ?? `HTTP ${res.status}`, err?.details);
  }
  return data as Endpoints[K]['response'];
}

export const api = {
  submitCheckin: (body: CheckinRequest) => request('POST /api/checkins', body),
  syncCheckins: (items: SyncItem[]) => request('POST /api/checkins/sync', items),
  listCheckins: () => request('GET /api/checkins'),
  getInsights: () => request('GET /api/insights'),
  getResources: () => request('GET /api/resources'),
};
