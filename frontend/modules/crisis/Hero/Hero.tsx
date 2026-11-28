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
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-white py-20">
      <div className="relative z-10 mt-8 flex w-full max-w-2xl flex-col items-center px-4 text-center">
        <h1 className="mb-4 font-serif text-4xl font-bold text-[#142B47] md:text-5xl">
          You are not alone.
        </h1>

        <p className="mb-10 max-w-md text-base text-[#4A5568] md:text-lg">
          It sounds like things are really heavy right now. Talking to a real
          person can help. You can reach someone now.
        </p>

        {isOfflineFallback && (
          <p
            role="status"
            className="mb-4 w-full rounded-xl border border-[#D1E8E8] bg-[#EAF5F5] px-4 py-3 text-xs text-[#4A5568] md:text-sm"
          >
            You are offline. Showing saved emergency contact details.
          </p>
        )}

        <div className="mb-10 flex w-full flex-col gap-4">
          {isLoading ? (
            <p className="rounded-xl bg-[#EAF5F5] p-5 text-sm text-[#4A5568]">
              Loading support contacts…
            </p>
          ) : errorMessage ? (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
            >
              {errorMessage}
            </p>
          ) : crisisResources.length === 0 ? (
            <p className="rounded-xl bg-[#EAF5F5] p-5 text-sm text-[#4A5568]">
              No support contacts are available right now.
            </p>
          ) : (
            crisisResources.map((resource) => {
              const isPhone = resource.url.startsWith("tel:");

              return (
                <article
                  key={resource.id}
                  className="flex items-center justify-between rounded-xl border border-[#D1E8E8] bg-[#EAF5F5] p-5"
                >
                  <div className="pr-4 text-left">
                    <h2 className="mb-1 font-serif text-lg font-bold text-[#142B47] md:text-xl">
                      {resource.title}
                    </h2>

                    <p className="text-xs text-[#4A5568] md:text-sm">
                      {resource.description}
                    </p>
                  </div>

                  <a
                    href={resource.url}
                    target={isPhone ? undefined : "_blank"}
                    rel={isPhone ? undefined : "noreferrer"}
                    className="rounded-md bg-[#F19F65] px-5 py-2 font-semibold text-[#142B47] transition-colors hover:bg-[#E08E54]"
                  >
                    {isPhone ? "Call" : "Open"}
                  </a>
                </article>
              );
            })
          )}
        </div>

        <p className="mb-4 max-w-lg text-sm font-medium text-[#142B47] md:text-base">
          If you are in immediate danger, call local emergency services or go to
          the nearest hospital.
        </p>


        <Link
          href="/"
          className="rounded-md border border-[#CBD5E0] bg-white px-6 py-2.5 font-semibold text-[#142B47] shadow-sm transition-colors hover:bg-gray-50"
        >
          Back to MindMeter
        </Link>
      </div>
    </main>
  );
};
