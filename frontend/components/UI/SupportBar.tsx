import Link from "next/link";

/** Figma "Support bar": the always-visible way to the Support page (FR-07). */
export function SupportBar({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/support"
      className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-btn border border-[#999999] bg-support px-6 text-[19px] font-bold text-ink transition-colors hover:bg-support-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ink ${className}`}
    >
      Need to talk to someone? <span aria-hidden="true">→</span>
    </Link>
  );
}
