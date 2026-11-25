"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type Resource = Awaited<ReturnType<typeof api.getResources>>[number];

export const Hero = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const crisisResources = resources.filter(
    (resource) => resource.support_group === "crisis",
  );

  useEffect(() => {
    void api
      .getResources()
      .then(setResources)
      .finally(() => setIsLoading(false));
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

        <div className="mb-10 flex w-full flex-col gap-4">
          {isLoading ? (
            <p className="rounded-xl bg-[#EAF5F5] p-5 text-sm text-[#4A5568]">
              Loading support contacts…
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

        <p className="mb-10 text-xs text-[#718096] md:text-sm">
          Your check-in is saved. No AI insight is shown here.
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
