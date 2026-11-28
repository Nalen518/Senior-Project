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
        className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl"
      >
        <h2 className="title-section text-ink">
          Welcome to MindMeter
        </h2>
        <p className="mt-1 text-xs text-muted sm:text-sm">
          A quiet place to check in with yourself, one day at a time.
        </p>

        <div className="mt-6 space-y-4 text-left">
          <div>
            <h4 className="text-xs font-semibold text-ink sm:text-sm">
              One tap a day
            </h4>
            <p className="text-xs text-muted">
              Pick how you feel. Add a short note if you want.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-ink sm:text-sm">
              Private by design
            </h4>
            <p className="text-xs text-muted">
              No name, email or student number. Your check-ins are linked to
              this browser only.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-ink sm:text-sm">
              Not medical advice
            </h4>
            <p className="text-xs text-muted">
              MindMeter helps you reflect. It does not diagnose. Real people at
              UGM are one tap away.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/checkin"
            onClick={onClose}
            className="flex min-h-12 w-full items-center justify-center rounded-btn bg-primary px-6 text-[19px] font-bold text-white transition-colors hover:bg-primary-hover"
          >
            Start today’s check-in
          </Link>

          <Link
            href="/support"
            onClick={onClose}
            className="flex min-h-12 w-full items-center justify-center rounded-btn border border-line bg-white px-6 text-base font-bold text-ink transition-colors hover:bg-tint"
          >
            See support contacts
          </Link>
        </div>

        <p className="mt-4 text-xs text-muted">
          You can read this again under About.
        </p>
      </div>
    </div>
  );
};
