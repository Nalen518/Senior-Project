import Link from "next/link";
import { offlineSupportResources } from "@/constant/offlineSupport";

// The two first crisis contacts, from the same verified list the Support page uses offline.
const helpNow = offlineSupportResources
  .filter((r) => r.support_group === "crisis")
  .slice(0, 2);

const explore = [
  { name: "How it works", href: "/#how-it-works" },
  { name: "Privacy", href: "/about" },
  { name: "Support", href: "/support" },
];

export function Footer() {
  return (
    <footer className="mt-12 rounded-t-[32px] bg-ink px-6 pb-12 pt-16 text-white lg:px-20">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-10 lg:flex-row lg:justify-between">
        <div className="flex max-w-[360px] flex-col gap-3">
          <p className="font-serif text-[30px] font-semibold leading-[38px] tracking-[-0.5px]">
            MindMeter
          </p>
          <p className="text-base leading-6">
            A private space to notice your own patterns. For UGM students.
            Anonymous and free.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-1 text-sm">
          <p className="font-mono leading-5">EXPLORE</p>
          {explore.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="inline-flex min-h-11 items-center font-medium leading-5 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex max-w-[320px] flex-col gap-1 text-sm">
          <p className="font-mono leading-5">NEED HELP NOW</p>
          {helpNow.map((r) => {
            const isPhone = r.url.startsWith("tel:");
            return (
              <a
                key={r.id}
                href={r.url}
                target={isPhone ? undefined : "_blank"}
                rel={isPhone ? undefined : "noopener noreferrer"}
                className="inline-flex min-h-11 items-center font-medium leading-5 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {r.title}
              </a>
            );
          })}
        </div>
      </div>

      <div className="mx-auto mt-8 h-px max-w-[1120px] bg-white" />

      <div className="mx-auto mt-8 flex max-w-[1120px] flex-col gap-2 text-sm leading-5 lg:flex-row lg:justify-between">
        <p>
          MindMeter is not a medical or diagnostic tool. If you are in crisis,
          contact a real person now.
        </p>
        <p>Senior Project, DTETI UGM 2026</p>
      </div>
    </footer>
  );
}
