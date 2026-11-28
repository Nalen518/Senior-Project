"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { api } from "@/lib/api";
import { offlineSupportResources } from "@/constant/offlineSupport";
import { facultyOptions, readFaculty, saveFaculty } from "@/lib/faculty";
import type { FacultyCode } from "../../../../shared/contract";

type Resource = Awaited<ReturnType<typeof api.getResources>>[number];

export const Hero = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [resourceSource, setResourceSource] = useState<"api" | "offline">(
    "api",
  );
  // Kept in the browser only, never sent to the API (FR-04).
  const [faculty, setFaculty] = useState<FacultyCode | null>(null);
  // Read after mount so the server render and the first client render match.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setFaculty(readFaculty()), []);
  const chooseFaculty = (value: string) => {
    const next = facultyOptions.find((f) => f.value === value)?.value ?? null;
    setFaculty(next);
    saveFaculty(next);
  };

  const crisisResources = resources.filter(
    (resource) => resource.support_group === "crisis",
  );

  const scope = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced || !scope.current) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power2.out", duration: 0.65 } })
        .from(
          "[data-anim=circle]",
          {
            opacity: 0,
            y: 10,
            stagger: 0.08,
            duration: 0.9,
          },
          0,
        )
        .from(
          "[data-anim=title]",
          {
            opacity: 0,
            y: 14,
            clearProps: "transform,opacity",
          },
          0.12,
        )
        .from(
          "[data-anim=rise]",
          {
            opacity: 0,
            y: 12,
            stagger: 0.08,
            clearProps: "transform,opacity",
          },
          0.24,
        );

      gsap.to("[data-anim=circle]", {
        y: "+=10",
        duration: 4.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: { each: 0.4, from: "random" },
        delay: 1.25,
      });
    }, scope);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const loadResources = async () => {
      try {
        setResources(await api.getResources());
        setResourceSource("api");
      } catch {
        setResources(
          offlineSupportResources.map((resource) => ({
            id: resource.id,
            title: resource.title,
            description: resource.description,
            url: resource.url,
            tags: resource.tags,
            faculty: resource.faculty,
            support_group: resource.support_group,
          })),
        );
        setResourceSource("offline");
      } finally {
        setIsLoading(false);
      }
    };

    void loadResources();
  }, []);

  return (
    <>
      <main
        ref={scope}
        className="relative min-h-screen overflow-hidden bg-white px-4 pb-12 pt-24 text-ink sm:px-6"
      >
        <div
          data-anim="circle"
          className="pointer-events-none absolute -left-16 top-20 h-32 w-32 blob bg-[#E4A79A] opacity-60 will-change-transform"
        />
        <div
          data-anim="circle"
          className="pointer-events-none absolute right-20 top-24 h-20 w-20 blob bg-[#ECE1BE] opacity-60 will-change-transform"
        />
        <div
          data-anim="circle"
          className="pointer-events-none absolute -right-12 top-40 h-36 w-36 blob bg-support opacity-60 will-change-transform"
        />
        <div
          data-anim="circle"
          className="pointer-events-none absolute -left-10 bottom-24 h-36 w-36 blob bg-[#ECE1BE] opacity-60 will-change-transform"
        />
        <div
          data-anim="circle"
          className="pointer-events-none absolute -right-10 bottom-14 h-40 w-40 blob bg-tint opacity-60 will-change-transform"
        />

        <div className="relative mx-auto max-w-[720px]">
          <header data-anim="title" className="mb-5 will-change-transform">
            <h1 className="title-page">
              Support at UGM
            </h1>
            <p className="mt-1 text-sm text-muted">
              Real people who can listen. MindMeter is for reflection and
              pointing you to help. It is not medical advice.
            </p>
          </header>

          {resourceSource === "offline" && (
            <section
              data-anim="rise"
              className="mb-6 rounded-2xl border border-line bg-tint p-6 text-ink will-change-transform"
              role="status"
            >
              {/* The fallback also shows when the server fails, so only say offline when it is true. */}
              <h2 className="title-section">
                {navigator.onLine ? "Showing built-in contacts." : "You are offline."}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                These emergency contacts are built into the app so they always work.
                {navigator.onLine
                  ? " The full list of UGM services could not load right now. Please try again in a moment."
                  : " The full list of UGM services loads when you are back online."}
              </p>
            </section>
          )}

          <section
            data-anim="rise"
            className="rounded-2xl bg-support p-6 will-change-transform"
          >
            <h2 className="title-section">
              If you need help right now
            </h2>
            <p className="mt-1 text-sm text-ink">
              If you are in immediate danger, call local emergency services or
              go to the nearest hospital.
            </p>

            <div className="mt-3 space-y-2">
              {isLoading && (
                <p className="rounded-2xl bg-white px-5 py-5 text-sm text-muted">
                  Loading support contacts…
                </p>
              )}

              {errorMessage && (
                <p
                  className="rounded-2xl bg-white px-5 py-5 text-sm text-red-700"
                  role="alert"
                >
                  {errorMessage}
                </p>
              )}

              {!isLoading && !errorMessage && crisisResources.length === 0 && (
                <p className="rounded-2xl bg-white px-5 py-5 text-sm text-muted">
                  Support contacts will appear here once they have been
                  verified.
                </p>
              )}

              {crisisResources.map((resource) => {
                const isPhoneLink = resource.url.startsWith("tel:");
                const actionLabel = isPhoneLink ? "Call" : "Open";

                return (
                  <article
                    key={resource.id}
                    className="flex flex-col gap-3 rounded-2xl bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="title-section">
                        {resource.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted">
                        {resource.description}
                      </p>
                    </div>

                    <a
                      href={resource.url}
                      target={isPhoneLink ? undefined : "_blank"}
                      rel={isPhoneLink ? undefined : "noreferrer"}
                      className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-btn bg-accent px-5 py-2 text-center text-base font-bold text-ink transition-colors hover:bg-accent-hover"
                    >
                      {actionLabel}
                    </a>
                  </article>
                );
              })}
            </div>
          </section>

          {resourceSource !== "offline" && (
            <section data-anim="rise" className="mt-8 will-change-transform">
              <h2 className="title-section">
                Talk to a counsellor
              </h2>

              <p className="mt-1 text-sm text-muted">
                Find a counselling service that feels right for you.
              </p>

              {[
                {
                  title: "University services",
                  group: "university",
                  empty:
                    "No university-wide counselling services are available yet.",
                },
                {
                  title: "Faculty services",
                  group: "faculty",
                  empty: faculty
                    ? "Your faculty has no counselling service listed yet. The university services above are open to you."
                    : "Choose your faculty to see its counselling service. Other faculties' services may only see their own students.",
                },
                {
                  title: "Clinics",
                  group: "clinic",
                  empty: "No clinic contacts are available yet.",
                },
              ].map(({ title, group, empty }) => {
                // A faculty service only takes its own students, so show only the student's own faculty.
                const groupResources = resources.filter(
                  (resource) =>
                    resource.support_group === group &&
                    (group !== "faculty" || resource.faculty === faculty),
                );

                return (
                  <details
                    key={group}
                    className="mt-3 border-b border-line py-3"
                  >
                    <summary className="title-section flex min-h-11 cursor-pointer items-center">
                      {title}
                    </summary>

                    <div className="mt-3 space-y-3">
                      {group === "faculty" && (
                        <label className="flex flex-col gap-2 text-sm font-medium text-ink sm:flex-row sm:items-center sm:gap-3">
                          Your faculty (saved only on this device)
                          <select
                            value={faculty ?? ""}
                            onChange={(e) => chooseFaculty(e.target.value)}
                            className="min-h-11 rounded-btn border border-[#999999] bg-white px-3 text-sm font-normal text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="">Prefer not to say</option>
                            {facultyOptions.map((f) => (
                              <option key={f.value} value={f.value}>
                                {f.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      {groupResources.length === 0 ? (
                        <p className="text-sm text-muted">{empty}</p>
                      ) : (
                        groupResources.map((resource) => {
                          const isPhoneLink = resource.url.startsWith("tel:");

                          return (
                            <article
                              key={resource.id}
                              className="flex flex-col gap-3 rounded-2xl border border-line bg-tint p-6 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <h3 className="title-section">
                                  {resource.title}
                                </h3>

                                <p className="mt-1 text-sm text-muted">
                                  {resource.description}
                                </p>
                              </div>

                              <a
                                href={resource.url}
                                target={isPhoneLink ? undefined : "_blank"}
                                rel={isPhoneLink ? undefined : "noreferrer"}
                                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-btn bg-accent px-5 py-2 text-center text-base font-bold text-ink transition-colors hover:bg-accent-hover"
                              >
                                {isPhoneLink ? "Call" : "Open"}
                              </a>
                            </article>
                          );
                        })
                      )}
                    </div>
                  </details>
                );
              })}
            </section>
          )}

          <p
            data-anim="rise"
            className="mt-8 text-xs text-muted will-change-transform"
          >
            MindMeter is not a medical or diagnostic tool.
          </p>
        </div>
      </main>
    </>
  );
};
