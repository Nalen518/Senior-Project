"use client";

import React from "react";
import Link from "next/link";

interface SavedProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export const Saved: React.FC<SavedProps> = ({
  isOpen,
  title,
  message,
  onClose,
}) => {
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
        <h3 className="title-section text-ink">
          {title}
        </h3>
        <p className="mt-2 text-sm text-muted">{message}</p>

        <div className="mt-6 flex justify-center">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="inline-flex min-h-12 items-center gap-2 rounded-btn border border-line bg-white px-6 text-base font-bold text-ink transition-colors hover:bg-tint"
          >
            <span>See your week</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
