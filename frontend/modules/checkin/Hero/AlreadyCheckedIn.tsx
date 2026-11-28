"use client";

import Link from "next/link";

interface AlreadyCheckedInProps {
  note: string | null;
  onUpdate: () => void;
}

export function AlreadyCheckedIn({
  note,
  onUpdate,
}: AlreadyCheckedInProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <h2 className="title-section text-ink">
          You already checked in today
        </h2>

        <p className="mt-2 text-sm text-muted">
          You can update today’s mood or go to your dashboard.
        </p>

        {/* {note && (
          <p className="mt-4 rounded-2xl bg-tint p-4 text-left text-sm text-muted">
            Your note: {note}
          </p>
        )} */}

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onUpdate}
            className="flex min-h-12 w-full items-center justify-center rounded-btn bg-primary px-6 text-[19px] font-bold text-white transition-colors hover:bg-primary-hover"
          >
            Update today’s check-in
          </button>

          <Link
            href="/dashboard"
            className="flex min-h-12 w-full items-center justify-center rounded-btn border border-line bg-white px-6 text-base font-bold text-ink transition-colors hover:bg-tint"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}