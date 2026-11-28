"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MoodFace } from "@/components/UI/MoodFace";
import { Blobs } from "./Blobs";

gsap.registerPlugin(ScrollTrigger);

const moods = [
  { value: 1, label: "Very low", color: "bg-mood-1" },
  { value: 2, label: "Low", color: "bg-mood-2" },
  { value: 3, label: "Okay", color: "bg-mood-3" },
  { value: 4, label: "Good", color: "bg-mood-4" },
  { value: 5, label: "Very good", color: "bg-mood-5" },
] as const;

const steps = [
  {
    number: "01",
    title: "Check in with one tap",
    text: "Pick the face that fits your day. Add a short note only if you want to. One check-in per day.",
  },
  {
    number: "02",
    title: "See your own patterns",
    text: "A private weekly view of your mood with plain-language insights. It reflects your patterns back to you. It never diagnoses.",
  },
  {
    number: "03",
    title: "Reach real support",
    text: "UGM counselling contacts stay one click away on every screen, even when you are offline.",
  },
];

// 19px bold keeps white on primary at AA (large text).
const ctaClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[19px] font-bold leading-6 text-white transition-colors hover:bg-primary-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-ink/40";

function StartCta() {
  return (
    <>
      <Link href="/checkin" className={ctaClass}>
        Start today’s check-in <span aria-hidden="true">→</span>
      </Link>
      <p className="text-sm leading-5 text-body">No name, no email. Not a medical or diagnostic tool.</p>
    </>
  );
}

function MoodDot({ mood, size = "h-10 w-10" }: { mood: (typeof moods)[number]; size?: string }) {
  return (
    <span className={`flex items-center justify-center rounded-full border border-line text-ink ${mood.color} ${size}`}>
      <MoodFace mood={mood.value} className="h-3/4 w-3/4" />
    </span>
  );
}

function BrowserCard({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
      <div className="flex justify-center border-b border-line py-1.5">
        <span className="rounded-full bg-[#EDEDED] px-3 py-0.5 font-mono text-[10px] text-body">{url}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function WeekChart() {
  return (
    <svg viewBox="0 0 360 100" className="w-full" aria-hidden="true">
      <polyline points="16,30 72,40 128,62 184,82 240,58 296,40 344,22" fill="none" stroke="#163250" strokeWidth="2" />
      {[30, 40, 62, 82, 58, 40, 22].map((y, i) => (
        <circle key={i} cx={16 + i * 56 - (i === 6 ? 8 : 0)} cy={y} r="6" fill="#163250" />
      ))}
    </svg>
  );
}

function InsightMock() {
  return (
    <div className="rounded-xl bg-ink p-4 text-white">
      <p className="font-mono text-[11px] tracking-wider">INSIGHT · LAST 7 DAYS</p>
      <p className="mt-2 font-serif text-base leading-snug">Your mood has been trending up this week.</p>
      <p className="mt-3 font-mono text-[11px] tracking-wider">THEMES · LAST 14 DAYS</p>
      <div className="mt-2 flex gap-2 text-xs text-ink">
        <span className="rounded-full bg-hero px-3 py-0.5">Workload</span>
        <span className="rounded-full bg-hero px-3 py-0.5">Sleep</span>
      </div>
    </div>
  );
}

function CheckinMock({ note }: { note?: boolean }) {
  return (
    <>
      <p className="text-center font-serif text-xl font-semibold text-ink">How are you feeling today?</p>
      <div className="mt-4 flex justify-center gap-2">
        {moods.map((m) => (
          <div key={m.value} className="flex w-14 flex-col items-center gap-1 text-[11px] text-body">
            <MoodDot mood={m} size={`h-10 w-10 ${m.value === 4 ? "ring-2 ring-ink" : ""}`} />
            {m.label}
          </div>
        ))}
      </div>
      {note && (
        <>
          <p className="mt-3 text-xs text-body">Add a note (optional)</p>
          <div className="mt-1 h-16 rounded-btn border border-ink p-3 text-sm text-body">so much coursework this week, barely sleeping</div>
        </>
      )}
      <div className="mt-3 rounded-btn bg-primary py-2.5 text-center text-sm font-bold text-white">Save check-in</div>
    </>
  );
}

function ContactMock({ name, detail, action }: { name: string; detail: string; action: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-white p-3">
      <div>
        <p className="font-serif font-semibold text-ink">{name}</p>
        <p className="text-xs text-body">{detail}</p>
      </div>
      <span className="rounded-btn bg-accent px-4 py-1.5 text-sm font-bold text-ink">{action}</span>
    </div>
  );
}

function SupportMock() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-xl bg-support p-3">
        <div>
          <p className="font-serif font-semibold text-ink">Need to talk to someone?</p>
          <p className="text-xs text-body">Real people at UGM are here to listen.</p>
        </div>
        <span className="rounded-btn bg-accent px-4 py-1.5 text-sm font-bold text-ink">Get support</span>
      </div>
      <ContactMock name="MHERL" detail="24 hours, WhatsApp" action="Chat" />
      <ContactMock name="PK4L" detail="Campus emergency" action="Call" />
    </div>
  );
}

const stepVisuals = [
  <div key="1" className="rounded-2xl border border-line bg-white p-5"><CheckinMock /></div>,
  <div key="2" className="rounded-2xl border border-line bg-white p-5">
    <p className="font-serif text-lg font-semibold text-ink">Your week</p>
    <WeekChart />
    <div className="mt-3"><InsightMock /></div>
  </div>,
  <SupportMock key="3" />,
];

export const Hero = () => {
  const scope = useRef<HTMLDivElement>(null);

  // All motion is off for reduced motion. Hover and tap are CSS (motion-safe), the rest is GSAP.
  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: "power3.out", duration: 0.7 } })
          .from("[data-anim=hero]", { y: 24, autoAlpha: 0, stagger: 0.1 })
          .from("[data-anim=screen]", { y: 60, autoAlpha: 0, stagger: 0.12, duration: 0.9 }, 0.3);

        // Living faces: a slow wave across the five moods.
        gsap.to("[data-face]", { y: -6, duration: 1.5, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: { each: 0.25 }, delay: 0.8 });
        // The Very good face winks its right eye now and then.
        gsap
          .timeline({ repeat: -1, repeatDelay: 4.5, delay: 2.5 })
          .to('[data-face="5"] svg path:nth-of-type(2)', { scaleY: 0.1, svgOrigin: "15.75 9", duration: 0.09, yoyo: true, repeat: 1 });

        // Background blobs: pop in, float softly, then fly up and away as the page scrolls past them.
        gsap.from("[data-blob-inner]", { scale: 0.5, autoAlpha: 0, duration: 1.4, ease: "power2.out", stagger: 0.12 });
        gsap.utils.toArray<HTMLElement>("[data-blob-inner]").forEach((el) => {
          gsap.to(el, {
            x: "random(-24, 24)",
            y: "random(-28, 28)",
            scale: "random(0.9, 1.1)",
            rotation: "random(-12, 12)",
            duration: "random(5, 8)",
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        });
        gsap.utils.toArray<HTMLElement>("[data-blob]").forEach((el) => {
          gsap.to(el, {
            y: gsap.utils.random(-460, -260),
            x: gsap.utils.random(-70, 70),
            rotation: gsap.utils.random(-25, 25),
            ease: "none",
            scrollTrigger: { trigger: el, start: "clamp(top bottom)", end: "bottom top", scrub: 1.2 },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-anim=step]").forEach((el) => {
          gsap.from(el, { y: 40, autoAlpha: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
        });
      });
    },
    { scope },
  );

  return (
    <div ref={scope} className="relative overflow-x-clip bg-white text-ink">
      <Blobs />
      <div className="relative mx-auto max-w-[1280px] px-4 pt-5 lg:px-8">
        <div aria-hidden="true" className="mx-12 h-3 rounded-t-[24px] bg-hero/60" />
        <section className="relative overflow-hidden rounded-[28px] bg-hero/30">
          <header className="relative z-[2] flex items-center justify-between gap-2 px-4 py-5 lg:px-16">
            <a href="#how-it-works" className="hidden min-h-11 items-center whitespace-nowrap rounded-full border border-ink px-3 text-sm font-medium hover:bg-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink sm:inline-flex lg:px-5 lg:text-base">
              How it works
            </a>
            <p className="font-serif text-xl font-semibold tracking-[-0.5px] lg:text-[26px]">MindMeter</p>
            <Link href="/support" className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-accent px-3 text-sm font-bold hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ink lg:px-5 lg:text-base">
              Need support?
            </Link>
          </header>

          <div className="relative z-[2] flex flex-col items-center gap-5 px-4 pt-4 text-center">
            <nav data-anim="hero" aria-label="Pick today’s mood" className="flex gap-1 overflow-x-auto rounded-full border border-line bg-white px-4 pb-2 pt-3">
              {moods.map((m) => (
                <Link
                  key={m.value}
                  href={`/checkin?mood=${m.value}`}
                  aria-label={`Mood ${m.value} of 5, ${m.label.toLowerCase()}`}
                  className="group flex w-16 shrink-0 flex-col items-center gap-1.5 rounded-2xl py-1 text-sm text-body focus:outline-none focus-visible:ring-2 focus-visible:ring-ink lg:w-20"
                >
                  <span data-face={m.value} className="block">
                    <span className="block transition-transform duration-300 ease-out motion-safe:group-hover:-rotate-6 motion-safe:group-hover:scale-110 motion-safe:group-active:scale-90">
                      <MoodDot mood={m} size="h-12 w-12 lg:h-13 lg:w-13" />
                    </span>
                  </span>
                  <span aria-hidden="true">{m.label}</span>
                </Link>
              ))}
            </nav>
            <h1 data-anim="hero" className="max-w-[760px] font-serif text-4xl font-semibold leading-tight tracking-[-1px] lg:text-[44px] lg:leading-[52px]">
              Notice how you are
              <br />
              really doing.
            </h1>
            <p data-anim="hero" className="max-w-[560px] text-base leading-7 text-body">
              One tap a day. MindMeter reflects your own mood patterns back to you and keeps real people at UGM one click away.
            </p>
            <div data-anim="hero" className="flex flex-col items-center gap-4">
              <StartCta />
            </div>
          </div>

          {/* Product preview. Pictures of the app, not working controls. */}
          <div aria-hidden="true" className="relative z-[2] mt-8 h-[240px] lg:h-[260px]">
            <div data-anim="screen" className="absolute left-[5%] top-[50px] hidden w-[360px] -rotate-6 lg:block">
              <BrowserCard url="mindmeter.ugm.ac.id/dashboard">
                <p className="font-serif text-lg font-semibold">Your week</p>
                <WeekChart />
                <div className="mt-3"><InsightMock /></div>
              </BrowserCard>
            </div>
            <div data-anim="screen" className="absolute right-[5%] top-[50px] hidden w-[360px] rotate-6 lg:block">
              <BrowserCard url="mindmeter.ugm.ac.id/support">
                <div className="mb-3 rounded-xl bg-support p-3 text-center">
                  <p className="font-serif text-lg font-semibold">You are not alone.</p>
                  <p className="text-xs text-body">Real people at UGM are here to listen.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <ContactMock name="MHERL" detail="24 hours, WhatsApp" action="Chat" />
                  <ContactMock name="PK4L" detail="Campus emergency" action="Call" />
                </div>
              </BrowserCard>
            </div>
            <div data-anim="screen" className="absolute left-1/2 top-0 w-[min(480px,92%)] -translate-x-1/2">
              <BrowserCard url="mindmeter.ugm.ac.id">
                <CheckinMock note />
              </BrowserCard>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="relative z-[2] scroll-mt-6 py-16 lg:px-16">
          <p className="text-center font-mono text-sm">HOW IT WORKS</p>
          <h2 className="mt-3 text-center font-serif text-[28px] font-semibold leading-9 tracking-[-0.5px] lg:text-[32px] lg:leading-10">
            Small check-ins, a clearer picture.
          </h2>
          <ol className="mt-12 flex flex-col gap-14">
            {steps.map((step, i) => (
              <li key={step.number} data-anim="step" className={`flex flex-col items-center gap-8 lg:flex-row lg:gap-16 ${i % 2 ? "lg:flex-row-reverse" : ""}`}>
                <div className="max-w-[440px] lg:flex-1">
                  <p className="font-mono text-2xl text-primary">{step.number}</p>
                  <h3 className="mt-3 font-serif text-2xl font-semibold leading-8">{step.title}</h3>
                  <p className="mt-2 text-base leading-6 text-body">{step.text}</p>
                </div>
                <div aria-hidden="true" className="w-full max-w-[520px] rounded-[28px] bg-hero/30 p-5 lg:flex-1 lg:p-8">
                  {stepVisuals[i]}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col items-center gap-4 rounded-[28px] bg-hero/30 px-6 py-14 text-center [&>*]:relative [&>*]:z-[2]">
          <h2 className="font-serif text-[28px] font-semibold leading-9 tracking-[-0.5px] lg:text-[32px] lg:leading-10">Ready for today’s check-in?</h2>
          <p className="text-base leading-7 text-body">One tap is enough. Everything else is optional.</p>
          <StartCta />
        </section>
      </div>
    </div>
  );
};
