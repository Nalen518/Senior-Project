"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { offlineSupportResources } from "@/constant/offlineSupport";

type Resource = Awaited<ReturnType<typeof api.getResources>>[number];

export const Hero = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [resourceSource, setResourceSource] = useState<"api" | "offline">(
    "api",
  );
  const crisisResources = resources.filter(
    (resource) => resource.support_group === "crisis",
  );

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
      <main className="relative min-h-screen overflow-hidden bg-white px-4 pb-12 pt-24 text-[#1F3347] sm:px-6">
        <div className="pointer-events-none absolute -left-16 top-20 h-32 w-32 rounded-full bg-[#E4A79A]" />
        <div className="pointer-events-none absolute right-20 top-24 h-20 w-20 rounded-full bg-[#ECE1BE]" />
        <div className="pointer-events-none absolute -right-12 top-40 h-36 w-36 rounded-full bg-[#D3C1E5]" />
        <div className="pointer-events-none absolute -left-10 bottom-24 h-36 w-36 rounded-full bg-[#ECE1BE]" />
        <div className="pointer-events-none absolute -right-10 bottom-14 h-40 w-40 rounded-full bg-[#E3F2F1]" />

        <div className="relative mx-auto max-w-3xl">
          <header className="mb-5">
            <h1 className="font-serif text-3xl font-bold sm:text-4xl">
              Support at UGM
            </h1>
            <p className="mt-1 text-sm text-[#3D4D59]">
              Real people who can listen. MindMeter is for reflection and
              pointing you to help. It is not medical advice.
            </p>
          </header>
          {resourceSource === "offline" && (
            <section
              className="mb-5 rounded-xl border border-[#CFE3E4] bg-[#EAF4F4] px-5 py-4 text-[#1F3347] shadow-xs sm:px-6"
              role="status"
            >
              <h2 className="font-serif text-lg font-bold">You are offline.</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[#3D4D59]">
                This emergency contact is built into the app so it always works.
                The full list of UGM services loads when you are back online.
              </p>
            </section>
          )}

          <section className="rounded-xl bg-[#C9AFD8] p-4 shadow-sm sm:p-5">
            <h2 className="font-serif text-lg font-bold">
              If you need help right now
            </h2>
            <p className="mt-1 text-sm text-[#3D4D59]">
              If you are in immediate danger, call local emergency services or
              go to the nearest hospital.
            </p>

            <div className="mt-3 space-y-2">
              {isLoading && (
                <p className="rounded-lg bg-white px-4 py-5 text-sm text-[#3D4D59]">
                  Loading support contacts…
                </p>
              )}

              {errorMessage && (
                <p
                  className="rounded-lg bg-white px-4 py-5 text-sm text-red-700"
                  role="alert"
                >
                  {errorMessage}
                </p>
              )}

              {!isLoading && !errorMessage && crisisResources.length === 0 && (
                <p className="rounded-lg bg-white px-4 py-5 text-sm text-[#3D4D59]">
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
                    className="flex flex-col gap-3 rounded-xl bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="font-serif text-base font-bold">
                        {resource.title}
                      </h3>
                      <p className="mt-1 text-xs text-[#3D4D59]">
                        {resource.description}
                      </p>
                    </div>

                    <a
                      href={resource.url}
                      target={isPhoneLink ? undefined : "_blank"}
                      rel={isPhoneLink ? undefined : "noreferrer"}
                      className="shrink-0 rounded-lg bg-[#F6A15E] px-5 py-2 text-center text-sm font-bold text-[#1F3347] transition-colors hover:bg-[#E09152]"
                    >
                      {actionLabel}
                    </a>
                  </article>
                );
              })}
            </div>
          </section>

          {resourceSource !== "offline" && (
            <section className="mt-5">
              <h2 className="font-serif text-lg font-bold">
                Talk to a counsellor
              </h2>

              <p className="mt-1 text-sm text-[#3D4D59]">
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
                  empty:
                    "Choose your faculty on the dashboard to see relevant faculty counselling services.",
                },
                {
                  title: "Clinics",
                  group: "clinic",
                  empty: "No clinic contacts are available yet.",
                },
              ].map(({ title, group, empty }) => {
                const groupResources = resources.filter(
                  (resource) => resource.support_group === group,
                );

                return (
                  <details
                    key={group}
                    className="mt-3 border-b border-[#B8C0C3] py-3"
                  >
                    <summary className="cursor-pointer font-serif font-bold">
                      {title}
                    </summary>

                    <div className="mt-3 space-y-3">
                      {groupResources.length === 0 ? (
                        <p className="text-sm text-[#3D4D59]">{empty}</p>
                      ) : (
                        groupResources.map((resource) => {
                          const isPhoneLink = resource.url.startsWith("tel:");

                          return (
                            <article
                              key={resource.id}
                              className="flex flex-col gap-3 rounded-xl border border-[#D5E1E2] bg-[#E3F2F1] p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <h3 className="font-serif font-bold">
                                  {resource.title}
                                </h3>

                                <p className="mt-1 text-sm text-[#3D4D59]">
                                  {resource.description}
                                </p>
                              </div>

                              <a
                                href={resource.url}
                                target={isPhoneLink ? undefined : "_blank"}
                                rel={isPhoneLink ? undefined : "noreferrer"}
                                className="shrink-0 rounded-lg bg-[#F6A15E] px-5 py-2 text-center text-sm font-bold text-[#1F3347] transition-colors hover:bg-[#E09152]"
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

          <p className="mt-8 text-xs text-[#5E6A70]">
            MindMeter is not a medical or diagnostic tool.
          </p>
        </div>
      </main>
    </>
  );
};
