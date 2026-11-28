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
        <h2 className="font-serif text-2xl font-bold text-[#1F3347]">
          You already checked in today
        </h2>

        <p className="mt-2 text-sm text-[#3D4D59]">
          You can update today’s mood or go to your dashboard.
        </p>

        {/* {note && (
          <p className="mt-4 rounded-lg bg-[#E8F3F3] p-3 text-left text-sm text-[#3D4D59]">
            Your note: {note}
          </p>
        )} */}

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onUpdate}
            className="w-full rounded-xl bg-[#2A9D90] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#238479]"
          >
            Update today’s check-in
          </button>

          <Link
            href="/dashboard"
            className="w-full rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-[#1F3347] transition-colors hover:bg-gray-50"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}