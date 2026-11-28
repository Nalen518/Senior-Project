"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { offlineSupportResources } from "@/constant/offlineSupport";

type Resource = Awaited<ReturnType<typeof api.getResources>>[number];

export const Hero = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);

  const crisisResources = resources.filter(
    (resource) => resource.support_group === "crisis",
  );

  useEffect(() => {
    const loadResources = async () => {
      try {
        setErrorMessage("");
        setIsOfflineFallback(false);
        const data = await api.getResources();
        setResources(data);
      } catch {
        const fallbackCrisis = offlineSupportResources
          .filter((resource) => resource.support_group === "crisis")
          .map((resource) => ({
            id: resource.id,
            title: resource.title,
            description: resource.description,
            url: resource.url,
            tags: resource.tags,
            faculty: resource.faculty,
            support_group: resource.support_group,
          }));

        if (fallbackCrisis.length > 0) {
          setResources(fallbackCrisis);
          setIsOfflineFallback(true);
        } else {
          setErrorMessage(
            navigator.onLine
              ? "We could not load support contacts right now. Please try again shortly."
              : "You are offline and support contacts could not be loaded.",
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadResources();
  }, []);

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-white pb-10 pt-24">
      <div className="relative z-10 flex w-full max-w-[720px] flex-col items-center px-4 text-center">
        <h1 className="title-page mb-4 text-ink">
          You are not alone.
        </h1>

        <p className="mb-10 max-w-md text-base text-muted md:text-lg">
          It sounds like things are really heavy right now. Talking to a real
          person can help. You can reach someone now.
        </p>

        {isOfflineFallback && (
          <p
            role="status"
            className="mb-4 w-full rounded-2xl border border-line bg-tint px-6 py-4 text-sm text-muted"
          >
            {navigator.onLine
              ? "Showing built-in emergency contacts. They always work."
              : "You are offline. Showing built-in emergency contacts. They always work."}
          </p>
        )}

        <div className="mb-10 flex w-full flex-col gap-4">
          {isLoading ? (
            <p className="rounded-2xl bg-tint p-6 text-sm text-muted">
              Loading support contacts…
            </p>
          ) : errorMessage ? (
            <p
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
            >
              {errorMessage}
            </p>
          ) : crisisResources.length === 0 ? (
            <p className="rounded-2xl bg-tint p-6 text-sm text-muted">
              No support contacts are available right now.
            </p>
          ) : (
            crisisResources.map((resource) => {
              const isPhone = resource.url.startsWith("tel:");

              return (
                <article
                  key={resource.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-tint p-6"
                >
                  <div className="pr-4 text-left">
                    <h2 className="title-section mb-1 text-ink">
                      {resource.title}
                    </h2>

                    <p className="text-sm text-muted">
                      {resource.description}
                    </p>
                  </div>

                  <a
                    href={resource.url}
                    target={isPhone ? undefined : "_blank"}
                    rel={isPhone ? undefined : "noreferrer"}
                    className="inline-flex min-h-11 shrink-0 items-center rounded-btn bg-accent px-5 py-2 text-base font-bold text-ink transition-colors hover:bg-accent-hover"
                  >
                    {isPhone ? "Call" : "Open"}
                  </a>
                </article>
              );
            })
          )}
        </div>

        <p className="mb-4 max-w-lg text-sm font-medium text-ink md:text-base">
          If you are in immediate danger, call local emergency services or go to
          the nearest hospital.
        </p>


        <Link
          href="/"
          className="inline-flex min-h-12 items-center rounded-btn border border-line bg-white px-6 text-[19px] font-bold text-ink transition-colors hover:bg-tint"
        >
          Back to MindMeter
        </Link>
      </div>
    </main>
  );
};
