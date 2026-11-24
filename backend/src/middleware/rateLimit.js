'use strict';

// NFR-03: at most `limit` requests per `windowMs` per IP, then 429 in the standard error shape.
// shortcut: in-memory fixed window, so it counts per server instance. Move to a shared store if we run more than one.
function rateLimit({ limit, windowMs, skip = () => false, clock = Date.now }) {
  const hits = new Map(); // ip -> { count, resetAt }

  return (req, res, next) => {
    if (skip(req)) return next();
    const now = clock();
    if (hits.size > 5000) for (const [ip, h] of hits) if (h.resetAt <= now) hits.delete(ip); // keep memory bounded

    let hit = hits.get(req.ip);
    if (!hit || hit.resetAt <= now) {
      hit = { count: 0, resetAt: now + windowMs };
      hits.set(req.ip, hit);
    }
    hit.count += 1;
    if (hit.count <= limit) return next();

    res.setHeader('Retry-After', Math.ceil((hit.resetAt - now) / 1000));
    return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again in a minute.' } });
  };
}

module.exports = { rateLimit };
