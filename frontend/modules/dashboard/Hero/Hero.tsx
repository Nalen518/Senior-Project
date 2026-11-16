"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { flushQueue, readQueue } from "@/lib/syncQueue";
import type { SyncItem } from "../../../../shared/contract";
import { MoodFace } from "@/components/UI/MoodFace";

type Checkin = Awaited<ReturnType<typeof api.listCheckins>>[number];
type Insight = Awaited<ReturnType<typeof api.getInsights>>;

const moodDetails = {
  1: { label: "Very low", color: "#D96B5B" },
  2: { label: "Low", color: "#E7975B" },
  3: { label: "Okay", color: "#D8D4A2" },
  4: { label: "Good", color: "#67AB83" },
  5: { label: "Very good", color: "#2EB812" },
} as const;

function getMoodDetails(mood: number) {
  return moodDetails[mood as keyof typeof moodDetails] ?? moodDetails[3];
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(date));
}

function jakartaDateKey(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getChartDays(days: number) {
  const today = jakartaDateKey(new Date());
  const [year, month, day] = today.split("-").map(Number);
  const todayUtc = Date.UTC(year, month - 1, day);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(todayUtc - (days - 1 - index) * 86_400_000);
    return date.toISOString().slice(0, 10);
  });
}

function formatChartDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${dateKey}T12:00:00+07:00`));
}

function resourceAction(url: string) {
  return url.startsWith("tel:") ? "Call" : "Open resource";
}

export const Hero = () => {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [queuedItems, setQueuedItems] = useState<SyncItem[]>([]);
  const queuedCount = queuedItems.length;
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedRange, setSelectedRange] = useState<7 | 30>(7);
  const [historyPageSize, setHistoryPageSize] = useState<7 | 10 | 15 | 31>(7);
  const [historyPage, setHistoryPage] = useState(1);

  const hasNoCheckins =
    !isLoading &&
    !errorMessage &&
    checkins.length === 0 &&
    queuedItems.length === 0;

  useEffect(() => {
    const refreshQueue = () => setQueuedItems(readQueue());

    refreshQueue();
    window.addEventListener("mindmeter:queue-change", refreshQueue);

    return () => {
      window.removeEventListener("mindmeter:queue-change", refreshQueue);
    };
  }, []);

  const loadDashboard = useCallback(async () => {
    setQueuedItems(readQueue());

    try {
      setErrorMessage("");

      const [checkinData, insightData] = await Promise.all([
        api.listCheckins(),
        api.getInsights(),
      ]);

      setCheckins(checkinData);
      setInsight(insightData);
    } catch {
      setErrorMessage(
        navigator.onLine
          ? "We could not load your weekly overview. Please try again shortly."
          : "Your saved dashboard history and insights need a connection to load. Any pending check-ins are listed below and will sync when you reconnect.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleRetrySync = async () => {
    setIsRetrying(true);

    try {
      await flushQueue();
      setQueuedItems(readQueue());
      await loadDashboard();
    } finally {
      setIsRetrying(false);
    }
  };

  const chartDays = useMemo(() => getChartDays(selectedRange), [selectedRange]);

  const checkinsByDate = useMemo(() => {
    return new Map(
      checkins.map((checkin) => [jakartaDateKey(checkin.created_at), checkin]),
    );
  }, [checkins]);

  const chartCheckins = chartDays
    .map((day) => checkinsByDate.get(day))
    .filter((checkin): checkin is Checkin => Boolean(checkin));

  const historyCheckins = [...checkins].reverse();

  const totalHistoryPages = Math.max(
    1,
    Math.ceil(historyCheckins.length / historyPageSize),
  );

  const currentHistoryPage = Math.min(historyPage, totalHistoryPages);

  const visibleCheckins = historyCheckins.slice(
    (currentHistoryPage - 1) * historyPageSize,
    currentHistoryPage * historyPageSize,
  );

  const historyPageItems = (() => {
    if (totalHistoryPages <= 7) {
      return Array.from({ length: totalHistoryPages }, (_, index) => index + 1);
    }

    const pages = new Set([
      1,
      2,
      currentHistoryPage - 1,
      currentHistoryPage,
      currentHistoryPage + 1,
      totalHistoryPages - 1,
      totalHistoryPages,
    ]);

    const validPages = [...pages]
      .filter((page) => page >= 1 && page <= totalHistoryPages)
      .sort((a, b) => a - b);

    const items: Array<number | "ellipsis"> = [];

    validPages.forEach((page, index) => {
      const previous = validPages[index - 1];

      if (previous && page - previous > 1) {
        items.push("ellipsis");
      }

      items.push(page);
    });

    return items;
  })();

  const chartWidth = 700;
  const chartHeight = 220;

  const gridLeft = 56;
  const gridRight = 16;
  const edgePadding = 42;
  const plotLeft = gridLeft + edgePadding;
  const plotRight = gridRight + edgePadding;

  const plotTop = 22;
  const plotBottom = 46;
  const plotWidth = chartWidth - plotLeft - plotRight;
  const plotHeight = chartHeight - plotTop - plotBottom;

  const pointFor = (mood: number, index: number) => ({
    x: plotLeft + (index * plotWidth) / (selectedRange - 1),
    y: plotTop + ((5 - mood) * plotHeight) / 4,
  });

  const chartLines = useMemo(() => {
    const lines: { x: number; y: number }[][] = [];
    let currentLine: { x: number; y: number }[] = [];

    chartDays.forEach((day, index) => {
      const checkin = checkinsByDate.get(day);

      if (!checkin) {
        if (currentLine.length > 0) lines.push(currentLine);
        currentLine = [];
        return;
      }

      currentLine.push(pointFor(checkin.mood_value, index));
    });

    if (currentLine.length > 0) lines.push(currentLine);

    return lines;
  }, [chartDays, checkinsByDate, selectedRange]);

  const xLabelIndexes =
    selectedRange === 7 ? [0, 1, 2, 3, 4, 5, 6] : [0, 7, 14, 21, 29];

  const handleHistoryPageSizeChange = (size: 7 | 10 | 15 | 31) => {
    setHistoryPageSize(size);
    setHistoryPage(1);
  };
  return (
    <>
      <main className="relative min-h-screen overflow-hidden bg-white px-4 pb-10 pt-24 text-[#1F3347] sm:px-6">
        <div className="pointer-events-none absolute -left-12 top-16 h-28 w-28 rounded-full bg-[#E4A79A]" />
        <div className="pointer-events-none absolute right-[28%] top-20 h-20 w-20 rounded-full bg-[#ECE1BE]" />
        <div className="pointer-events-none absolute -right-10 top-36 h-32 w-32 rounded-full bg-[#D3C1E5]" />
        <div className="pointer-events-none absolute -left-10 bottom-64 h-28 w-36 rounded-full bg-[#D3C1E5]" />
        <div className="pointer-events-none absolute -right-10 bottom-24 h-28 w-28 rounded-full bg-[#E3F2F1]" />

        <div className="relative mx-auto max-w-5xl">
          <header>
            <h1 className="font-serif text-3xl font-bold sm:text-4xl">
              Your wellbeing overview
            </h1>
            <p className="mt-1 text-sm text-[#3D4D59]">
              Your recent check-ins and gentle reflections.
            </p>
          </header>

          {hasNoCheckins && (
            <section className="mt-5 rounded-xl border border-[#C9DCDD] bg-[#E3F2F1] p-5">
              <h2 className="font-serif text-lg font-bold">No check-in yet</h2>

              <p className="mt-1 text-sm text-[#3D4D59]">
                Please check in to start building your personal mood overview.
              </p>

              <Link
                href="/"
                className="mt-4 inline-flex rounded-lg bg-[#2A9D90] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#238479]"
              >
                Go to today’s check-in
              </Link>
            </section>
          )}

          {queuedCount > 0 && (
            <section className="mt-5 flex flex-col gap-3 rounded-lg border border-[#C9DCDD] bg-[#E3F2F1] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold">
                  Your check-in is safe on this device.
                </p>
                <p className="text-xs text-[#3D4D59]">
                  {queuedCount} check-in{queuedCount > 1 ? "s" : ""} will sync
                  when the connection is back.
                </p>
              </div>

              {queuedItems.length > 0 && (
                <ul className="text-xs text-[#3D4D59]">
                  {queuedItems.map((item) => (
                    <li key={item.client_ts}>
                      Pending · {formatDate(item.client_ts)} ·{" "}
                      {getMoodDetails(item.mood_value).label}
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={handleRetrySync}
                disabled={isRetrying}
                className="rounded-lg border border-[#9FB7B9] bg-white px-4 py-2 text-sm font-bold disabled:opacity-60"
              >
                {isRetrying ? "Trying…" : "Try again now"}
              </button>
            </section>
          )}

          {errorMessage && (
            <p className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          {isLoading ? (
            <p className="mt-8 text-sm text-[#3D4D59]">
              Loading your overview…
            </p>
          ) : (
            <>
              <section className="mt-5 grid gap-4 lg:grid-cols-[1.7fr_0.95fr]">
                <article className="rounded-xl bg-[#E3F2F1] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-serif text-lg font-bold">
                        Mood, recent check-ins
                      </h2>
                      <p className="mt-1 text-xs text-[#3D4D59]">
                        {chartCheckins.length} check-in
                        {chartCheckins.length !== 1 ? "s" : ""} in the last{" "}
                        {selectedRange} days
                      </p>
                    </div>

                    <div
                      className="inline-flex rounded-lg border border-[#9FB7B9] bg-white p-1"
                      role="group"
                      aria-label="Choose chart period"
                    >
                      {[7, 30].map((range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => setSelectedRange(range as 7 | 30)}
                          className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                            selectedRange === range
                              ? "bg-[#1F405D] text-white"
                              : "text-[#1F405D] hover:bg-[#E3F2F1]"
                          }`}
                        >
                          {range} days
                        </button>
                      ))}
                    </div>
                  </div>

                  {chartCheckins.length === 0 ? (
                    <div className="flex h-44 items-center justify-center">
                      <p className="text-center text-sm text-[#3D4D59]">
                        No check-ins in this period. Please check in to start
                        your mood overview.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 overflow-x-auto">
                      <svg
                        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                        className="h-auto min-w-[620px] w-full"
                        role="img"
                        aria-label={`Mood chart for the last ${selectedRange} days`}
                      >
                        {[5, 4, 3, 2, 1].map((mood) => {
                          const y = pointFor(mood, 0).y;

                          return (
                            <g key={mood}>
                              <line
                                x1={gridLeft}
                                x2={chartWidth - gridRight}
                                y1={y}
                                y2={y}
                                stroke="#C8DFE0"
                                strokeWidth="1"
                              />

                              <circle
                                cx="22"
                                cy={y}
                                r="13"
                                fill={
                                  moodDetails[mood as keyof typeof moodDetails]
                                    .color
                                }
                              />

                              <MoodFace
                                mood={mood as 1 | 2 | 3 | 4 | 5}
                                x="10"
                                y={y - 12}
                                width="24"
                                height="24"
                                className="text-[#1F3347]"
                              />
                            </g>
                          );
                        })}

                        {chartLines.map((line, index) => (
                          <path
                            key={index}
                            d={line
                              .map(
                                (point, pointIndex) =>
                                  `${pointIndex === 0 ? "M" : "L"} ${point.x} ${point.y}`,
                              )
                              .join(" ")}
                            fill="none"
                            stroke="#7894A0"
                            strokeWidth="2"
                          />
                        ))}

                        {chartDays.map((day, index) => {
                          const checkin = checkinsByDate.get(day);
                          if (!checkin) return null;

                          const point = pointFor(checkin.mood_value, index);

                          return (
                            <circle
                              key={day}
                              cx={point.x}
                              cy={point.y}
                              r="5"
                              fill="#1F405D"
                            />
                          );
                        })}

                        {xLabelIndexes.map((index) => {
                          const x = pointFor(3, index).x;

                          return (
                            <text
                              key={chartDays[index]}
                              x={x}
                              y={chartHeight - 14}
                              textAnchor="middle"
                              fill="#3D4D59"
                              fontSize="11"
                            >
                              {formatChartDate(chartDays[index])}
                            </text>
                          );
                        })}
                      </svg>
                    </div>
                  )}
                </article>

                <article className="rounded-xl bg-[#1F405D] p-4 text-white">
                  <p className="text-[10px] font-bold tracking-wider text-[#C9DCDD]">
                    INSIGHT · RECENT CHECK-INS
                  </p>

                  <p className="mt-4 font-serif text-lg leading-relaxed">
                    {insight?.message ??
                      "Check in a few more days to see your mood pattern."}
                  </p>

                  <p className="mt-5 text-[10px] font-bold tracking-wider text-[#C9DCDD]">
                    THEMES
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {insight?.themes.length ? (
                      insight.themes.map((theme) => (
                        <span
                          key={theme}
                          className="rounded-full bg-[#C9DCDD] px-3 py-1 text-xs font-bold text-[#1F405D]"
                        >
                          {theme}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-[#C9DCDD]">
                        Themes will appear as you check in.
                      </span>
                    )}
                  </div>
                </article>
              </section>

              {insight?.resources.length ? (
                <section className="mt-6">
                  <h2 className="font-serif text-lg font-bold">
                    Suggested resources
                  </h2>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {insight.resources.map((resource) => (
                      <article
                        key={resource.id}
                        className="rounded-xl border border-[#D5E1E2] bg-[#E3F2F1] p-4"
                      >
                        <h3 className="font-serif font-bold">
                          {resource.title}
                        </h3>
                        <p className="mt-2 text-xs text-[#3D4D59]">
                          {resource.description}
                        </p>
                        <a
                          href={resource.url}
                          target={
                            resource.url.startsWith("tel:")
                              ? undefined
                              : "_blank"
                          }
                          rel={
                            resource.url.startsWith("tel:")
                              ? undefined
                              : "noreferrer"
                          }
                          className="mt-4 inline-flex text-xs font-bold underline"
                        >
                          {resourceAction(resource.url)} →
                        </a>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="mt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-baseline gap-2">
                    <h2 className="font-serif text-lg font-bold">
                      Check-in history
                    </h2>

                    <span className="text-xs text-[#5E6A70]">
                      {historyCheckins.length} check-in
                      {historyCheckins.length !== 1 ? "s" : ""} · Newest first
                    </span>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-[#3D4D59]">
                    Show
                    <select
                      value={historyPageSize}
                      onChange={(event) =>
                        handleHistoryPageSizeChange(
                          Number(event.target.value) as 7 | 10 | 15 | 31,
                        )
                      }
                      className="rounded-md border border-[#9FB7B9] bg-white px-2 py-1 text-xs font-bold text-[#1F405D] outline-none focus:ring-2 focus:ring-[#2A9D90]"
                      aria-label="Check-ins shown per page"
                    >
                      <option value={7}>7</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={31}>31</option>
                    </select>
                    per page
                  </label>
                </div>

                <div className="mt-3 overflow-hidden rounded-xl border border-[#D9E0E2] bg-white">
                  {visibleCheckins.length === 0 ? (
                    <p className="p-4 text-sm text-[#3D4D59]">
                      No check-ins yet. Visit Today to make your first one.
                    </p>
                  ) : (
                    visibleCheckins.map((checkin) => {
                      const mood = getMoodDetails(checkin.mood_value);

                      return (
                        <article
                          key={checkin.id}
                          className="grid grid-cols-[4.5rem_1.5rem_3.5rem_1fr] items-center gap-2 border-b border-[#E4E8E9] px-3 py-2 text-xs last:border-b-0"
                        >
                          <span>{formatDate(checkin.created_at)}</span>

                          <span
                            className="flex h-7 w-7 items-center justify-center rounded-full"
                            style={{ backgroundColor: mood.color }}
                          >
                            <MoodFace
                              mood={checkin.mood_value}
                              className="h-5 w-5 text-[#1F3347]"
                            />
                          </span>

                          <span>{mood.label}</span>

                          <span className="text-[#3D4D59]">
                            {checkin.note_text || "No note"}
                          </span>
                        </article>
                      );
                    })
                  )}
                  {historyCheckins.length > historyPageSize && (
                    <nav
                      className="mt-4 mb-4 flex flex-wrap items-center justify-center gap-1"
                      aria-label="Check-in history pages"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setHistoryPage((page) => Math.max(1, page - 1))
                        }
                        disabled={currentHistoryPage === 1}
                        className="rounded-md px-3 py-1.5 text-xs font-bold text-[#1F405D] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Previous
                      </button>

                      {historyPageItems.map((item, index) =>
                        item === "ellipsis" ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="px-2 text-xs text-[#5E6A70]"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setHistoryPage(item)}
                            aria-current={
                              item === currentHistoryPage ? "page" : undefined
                            }
                            className={`h-8 min-w-8 rounded-md px-2 text-xs font-bold transition-colors ${
                              item === currentHistoryPage
                                ? "bg-[#1F405D] text-white"
                                : "text-[#1F405D] hover:bg-[#E3F2F1]"
                            }`}
                          >
                            {item}
                          </button>
                        ),
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setHistoryPage((page) =>
                            Math.min(totalHistoryPages, page + 1),
                          )
                        }
                        disabled={currentHistoryPage === totalHistoryPages}
                        className="rounded-md px-3 py-1.5 text-xs font-bold text-[#1F405D] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </nav>
                  )}
                </div>
              </section>
            </>
          )}

          <Link
            href="/support"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#C9AFD8] px-5 py-3 text-sm font-bold text-[#1F3347] transition-colors hover:bg-[#B99BCB]"
          >
            Need to talk to someone?
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </main>
    </>
  );
};
