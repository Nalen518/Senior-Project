"use client";

import { useRef } from "react";
import Link from "next/link";
import { SupportBar } from "@/components/UI/SupportBar";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export const Hero = () => {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: "power3.out", duration: 0.7 } })
          .from("[data-anim=circle]", {
            scale: 0.6,
            autoAlpha: 0,
            stagger: 0.1,
            duration: 1.2,
          })
          .from("[data-anim=title]", { y: 24, autoAlpha: 0 }, 0.2)
          .from(
            "[data-anim=rise]",
            { y: 16, autoAlpha: 0, stagger: 0.1 },
            0.45,
          );

        gsap.to("[data-anim=circle]", {
          y: "random(-18, 18)",
          x: "random(-12, 12)",
          duration: "random(5, 8)",
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: 1.2,
        });
      });
    },
    { scope },
  );

  return (
    <>
      <section
        ref={scope}
        className="relative min-h-screen overflow-hidden bg-white px-4 pb-10 pt-24 text-ink sm:px-6"
      >
        <div
          data-anim="circle"
          className="pointer-events-none absolute -left-12 top-16 h-28 w-28 blob bg-[#E4A79A] opacity-60"
        />
        <div
          data-anim="circle"
          className="pointer-events-none absolute right-[28%] top-20 h-20 w-20 blob bg-[#ECE1BE] opacity-60"
        />
        <div
          data-anim="circle"
          className="pointer-events-none absolute -right-10 top-36 h-32 w-32 blob bg-support opacity-60"
        />
        <div
          data-anim="circle"
          className="pointer-events-none absolute right-12 top-[20rem] h-20 w-20 blob bg-support opacity-60"
        />
        <div
          data-anim="circle"
          className="pointer-events-none absolute -left-10 bottom-4 h-32 w-44 blob bg-[#ECE1BE] opacity-60"
        />
        <div
          data-anim="circle"
          className="pointer-events-none absolute -right-12 bottom-0 h-28 w-28 blob bg-tint opacity-60"
        />

        <div className="relative mx-auto max-w-[720px]">
          <header data-anim="title">
            <h1 className="title-page">
              About MindMeter
            </h1>
            <p className="mt-1 text-sm text-muted">
              A private daily check-in for UGM students.
            </p>
          </header>

          <div className="mt-6 space-y-6 text-sm text-muted">
            <section data-anim="rise">
              <h2 className="title-section text-ink">
                What it is
              </h2>
              <p className="mt-2 leading-relaxed">
                You pick how you feel once a day and add a short note if you
                want. Over time, you see your own pattern, with a simple insight
                about how your week is going.
              </p>
            </section>

            <section data-anim="rise">
              <h2 className="title-section text-ink">
                What it is not
              </h2>
              <p className="mt-2 leading-relaxed">
                MindMeter is for reflection and for pointing you to real help.
                It is not medical advice and it does not diagnose. Insights come
                from simple rules based on your check-ins, not a clinical test.
              </p>
            </section>

            <section data-anim="rise">
              <h2 className="title-section text-ink">
                Your privacy
              </h2>

              <div className="mt-2 space-y-3 leading-relaxed">
                <p>
                  There is no account, name, email, or student number. Check-ins
                  are linked to a random code stored only in this browser, so
                  clearing browser data also removes access to your history.
                </p>

                <p>
                  Optional notes may be analysed only to identify broad themes
                  such as sleep or exams. Notes that indicate a crisis are never
                  sent for analysis and take you straight to support.
                </p>
              </div>
            </section>

            <section data-anim="rise">
              <h2 className="title-section text-ink">
                If you need help
              </h2>
              <p className="mt-2 leading-relaxed">
                Real people at UGM are here to listen, any time.
              </p>

              <Link
                href="/support"
                className="mt-3 inline-flex min-h-11 items-center rounded-btn bg-accent px-5 py-2 text-base font-bold text-ink transition-colors hover:bg-accent-hover"
              >
                See support contacts
              </Link>
            </section>
          </div>

          {/* The project credit lives in the site footer. */}
          <div data-anim="rise" className="mt-8">
            <SupportBar />
          </div>
        </div>
      </section>
    </>
  );
};
