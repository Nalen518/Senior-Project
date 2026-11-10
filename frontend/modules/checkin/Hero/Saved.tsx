"use client";

import React from "react";
import Link from "next/link";

interface SavedProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export const Saved: React.FC<SavedProps> = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl"
      >
        <h3 className="font-serif text-2xl font-bold text-[#1F3347]">
          Saved for today.
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          {message}
        </p>

        <div className="mt-6 flex justify-center">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-[#1F3347] transition-colors hover:bg-gray-50"
          >
            <span>See your week</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
