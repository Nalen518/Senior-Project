"use client";

import React from "react";
import Link from "next/link";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
    >
      {/* stopPropagation prevents modal container clicks from closing the modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl"
      >
        <h2 className="font-serif text-2xl font-bold text-[#1F3347] sm:text-3xl">
          Welcome to MindMeter
        </h2>
        <p className="mt-1 text-xs text-gray-500 sm:text-sm">
          A quiet place to check in with yourself, one day at a time.
        </p>

        <div className="mt-6 space-y-4 text-left">
          <div>
            <h4 className="text-xs font-semibold text-[#1F3347] sm:text-sm">
              One tap a day
            </h4>
            <p className="text-xs text-gray-500">
              Pick how you feel. Add a short note if you want.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#1F3347] sm:text-sm">
              Private by design
            </h4>
            <p className="text-xs text-gray-500">
              No name, email or student number. Your check-ins are linked to
              this browser only.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#1F3347] sm:text-sm">
              Not medical advice
            </h4>
            <p className="text-xs text-gray-500">
              MindMeter helps you reflect. It does not diagnose. Real people at
              UGM are one tap away.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#2A9D90] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#238479]"
          >
            Start my first check-in
          </button>

          <Link
            href="/support"
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-semibold text-[#1F3347] transition-colors hover:bg-gray-50"
          >
            See support contacts
          </Link>
        </div>

        <p className="mt-4 text-[11px] text-gray-400">
          You can read this again under About.
        </p>
      </div>
    </div>
  );
};
