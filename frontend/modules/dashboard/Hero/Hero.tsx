"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SupportBar } from "@/components/UI/SupportBar";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { api, describeError } from "@/lib/api";
import { flushQueue, readQueue } from "@/lib/syncQueue";
import type { SyncItem } from "../../../../shared/contract";
import { MoodFace } from "@/components/UI/MoodFace";
import type { FacultyCode, ThemeCode } from "../../../../shared/contract";

// Readable chip text for the fixed theme vocabulary. Typed so a new code in the contract needs a label.
const themeLabels: Record<ThemeCode, string> = {
  sleep: "Sleep",
  workload: "Workload",
  exams: "Exams",
  isolation: "Feeling alone",
  relationships: "Relationships",
  finance: "Money",
  health: "Health",
  motivation: "Motivation",
};
import {
  facultyOptions,
  filterBookingOptions,
  readFaculty,
  saveFaculty,
} from "@/lib/faculty";
import { HelpCard } from "./HelpCard";

type Checkin = Awaited<ReturnType<typeof api.listCheckins>>[number];
type Insight = Awaited<ReturnType<typeof api.getInsights>>;

const moodDetails = {
  1: { label: "Very low", color: "#E07A5F" },
  2: { label: "Low", color: "#F4A462" },
  3: { label: "Okay", color: "#E9D8A6" },
  4: { label: "Good", color: "#70B77E" },
  5: { label: "Very good", color: "#38B000" },
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
  const hasEnoughInsightData = insight?.has_enough_data === true;
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyCode | null>(
    null,
  );
  const [showTodayReminder, setShowTodayReminder] = useState(false);

  const scope = useRef<HTMLElement>(null);

  // 1. Static background & header — runs once on mount
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
          .from("[data-anim=title]", { y: 24, autoAlpha: 0 }, 0.2);

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

  // 2. Loaded content — runs once when loading finishes
  useGSAP(
    () => {
      if (isLoading) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-anim=rise]", {
          y: 16,
          autoAlpha: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.1,
          clearProps: "transform,opacity,visibility",
        });
      });
    },
    { scope, dependencies: [isLoading] },
  );

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
    const queuedCheckins = readQueue();
    setQueuedItems(queuedCheckins);

    try {
      setErrorMessage("");

      const [checkinData, insightData] = await Promise.all([
        api.listCheckins(),
        api.getInsights(),
      ]);

      setCheckins(checkinData);
      setInsight(insightData);

      const today = jakartaDateKey(new Date());

      const hasSavedCheckinToday = checkinData.some(
        (checkin) => jakartaDateKey(checkin.created_at) === today,
      );

      const hasQueuedCheckinToday = queuedCheckins.some(
        (checkin) => jakartaDateKey(checkin.client_ts) === today,
      );

      setShowTodayReminder(!hasSavedCheckinToday && !hasQueuedCheckinToday);
    } catch (err) {
      setErrorMessage(
        navigator.onLine
          ? describeError(err, "We could not load your weekly overview. Please try again shortly.")
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

  useEffect(() => {
    setSelectedFaculty(readFaculty());
  }, []);

  const bookingOptions = filterBookingOptions(
    insight?.help.booking_options ?? [],
    selectedFaculty,
  );

  const handleFacultyChange = (value: string) => {
    const faculty = value === "" ? null : (value as FacultyCode);

    setSelectedFaculty(faculty);
    saveFaculty(faculty);
  };

  return (
    <>
      <main
        ref={scope}
        className="relative min-h-screen overflow-hidden bg-white px-4 pb-10 pt-24 text-ink sm:px-6"
      >
        {showTodayReminder && (
          <div className="fixed inset-0 z-[45] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
              <h2 className="title-section text-ink">
                You have not checked in today
              </h2>

              <p className="mt-2 text-sm text-muted">
                Take a moment to record how you are feeling today.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/checkin"
                  className="flex min-h-12 w-full items-center justify-center rounded-btn bg-primary px-6 text-[19px] font-bold text-white transition-colors hover:bg-primary-hover"
                >
                  Start today’s check-in
                </Link>

                <button
                  type="button"
                  onClick={() => setShowTodayReminder(false)}
                  className="flex min-h-12 w-full items-center justify-center rounded-btn border border-line bg-white px-6 text-base font-bold text-ink transition-colors hover:bg-tint"
                >
                  Stay on dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        <div
          data-anim="circle"
          className="pointer-events-none absolute -left-12 top-16 h-28 w-28 blob opacity-60 bg-[#E4A79A]"
        />
        <div
          data-anim="circle"
          className="pointer-events-none absolute right-[28%] top-20 h-20 w-20 blob opacity-60 bg-[#ECE1BE]"
        />
        <div
          data-anim="circle"
          className="pointer-events-none absolute -right-10 top-36 h-32 w-32 blob opacity-60 bg-support"
        />
        <div
          data-anim="circle"
          className="pointer-events-none absolute -left-10 bottom-64 h-28 w-36 blob opacity-60 bg-support"
        />
        <div
          data-anim="circle"
          className="pointer-events-none absolute -right-10 bottom-24 h-28 w-28 rounded-full bg-tint"
        />

        <div className="relative mx-auto max-w-[1200px]">
          <header data-anim="title">
            <h1 className="title-page">
              Your wellbeing overview
            </h1>
            <p className="mt-1 text-sm text-muted">
              Your recent check-ins and gentle reflections.
            </p>
          </header>

          {hasNoCheckins && (
            <section
              data-anim="rise"
              className="mt-6 rounded-2xl border border-line bg-tint p-6"
            >
              <h2 className="title-section">No check-in yet</h2>

              <p className="mt-1 text-sm text-muted">
                Please check in to start building your personal mood overview.
              </p>

              <Link
                href="/checkin"
                className="mt-4 inline-flex min-h-12 items-center rounded-btn bg-primary px-6 text-[19px] font-bold text-white transition-colors hover:bg-primary-hover"
              >
                Start today’s check-in
              </Link>
            </section>
          )}

          {queuedCount > 0 && (
            <section
              data-anim="rise"
              className="mt-5 flex flex-col gap-3 rounded-2xl border border-line bg-tint p-6 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-bold">
                  Your check-in is safe on this device.
                </p>
                <p className="text-xs text-muted">
                  {queuedCount} check-in{queuedCount > 1 ? "s" : ""} will sync
                  when the connection is back.
                </p>
              </div>

              {queuedItems.length > 0 && (
                <ul className="text-xs text-muted">
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
                className="rounded-btn border border-[#9FB7B9] bg-white px-4 py-2 text-sm font-bold disabled:opacity-60"
              >
                {isRetrying ? "Trying…" : "Try again now"}
              </button>
            </section>
          )}

          {errorMessage && (
            <p
              data-anim="rise"
              className="mt-5 rounded-2xl bg-red-50 p-6 text-sm text-red-700"
            >
              {errorMessage}
            </p>
          )}

          {isLoading ? (
            <p className="mt-8 text-sm text-muted">
              Loading your overview…
            </p>
          ) : (
            <>
              <section
                data-anim="rise"
                className="mt-5 grid gap-4 lg:grid-cols-[1.7fr_0.95fr]"
              >
                <article className="rounded-2xl border border-line bg-tint p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="title-section">
                        Mood, last {selectedRange} days
                      </h2>
                      <p className="mt-1 text-sm text-muted">
                        {chartCheckins.length} check-in
                        {chartCheckins.length !== 1 ? "s" : ""}
                      </p>
                    </div>

                    <div
                      className="inline-flex rounded-full border border-line bg-white p-1"
                      role="group"
                      aria-label="Choose chart period"
                    >
                      {[7, 30].map((range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => setSelectedRange(range as 7 | 30)}
                          className={`min-h-11 rounded-full px-4 text-sm font-bold transition-colors ${
                            selectedRange === range
                              ? "bg-ink text-white"
                              : "text-ink hover:bg-tint"
                          }`}
                        >
                          {range} days
                        </button>
                      ))}
                    </div>
                  </div>

                  {errorMessage ? (
                    <div className="flex h-44 items-center justify-center px-4">
                      <p className="text-center text-sm text-muted">
                        Your mood chart will show here once it loads.
                      </p>
                    </div>
                  ) : chartCheckins.length === 0 ? (
                    <div className="flex h-44 items-center justify-center">
                      <p className="text-center text-sm text-muted">
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
                                className="text-ink"
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
                              fill="#163250"
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

                {(hasEnoughInsightData || Boolean(errorMessage)) && (
                  <article className="rounded-2xl bg-ink p-6 text-white">
                    <p className="font-mono text-xs tracking-wider text-[#C9DCDD]">
                      INSIGHT · LAST 7 DAYS
                    </p>

                    <p className="mt-4 font-serif text-lg leading-relaxed">
                      {errorMessage
                        ? "Your insight will show here once it loads."
                        : (insight?.message ??
                          "Check in a few more days to see your mood pattern.")}
                    </p>

                    {!errorMessage && (
                      <>
                        <p className="mt-5 font-mono text-xs tracking-wider text-[#C9DCDD]">
                          THEMES · LAST 14 DAYS
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {insight?.themes.length ? (
                            insight.themes.map((theme) => (
                              <span
                                key={theme}
                                className="rounded-full bg-[#C9DCDD] px-3 py-1 text-xs font-bold text-ink"
                              >
                                {themeLabels[theme] ?? theme}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-[#C9DCDD]">
                              Themes will appear as you check in.
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </article>
                )}
              </section>

              {insight?.help ? (
                <div data-anim="rise">
                  <HelpCard help={insight.help} />
                </div>
              ) : null}

              {hasEnoughInsightData && insight?.resources.length ? (
                <section data-anim="rise" className="mt-6">
                  <h2 className="title-section">
                    Suggested resources
                  </h2>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {insight.resources.map((resource) => (
                      <article
                        key={resource.id}
                        className="rounded-2xl border border-line bg-tint p-6"
                      >
                        <h3 className="title-section">
                          {resource.title}
                        </h3>
                        <p className="mt-2 text-sm text-body">
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
                          className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-ink hover:underline"
                        >
                          {resourceAction(resource.url)} <span aria-hidden="true">→</span>
                        </a>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {!errorMessage && (
                <section data-anim="rise" className="mt-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-baseline gap-2">
                      <h2 className="title-section">
                        Check-in history
                      </h2>

                      <span className="text-xs text-muted">
                        {historyCheckins.length} check-in
                        {historyCheckins.length !== 1 ? "s" : ""} · Newest first
                      </span>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-semibold text-muted">
                      Show
                      <select
                        value={historyPageSize}
                        onChange={(event) =>
                          handleHistoryPageSizeChange(
                            Number(event.target.value) as 7 | 10 | 15 | 31,
                          )
                        }
                        className="rounded-md border border-[#9FB7B9] bg-white px-2 py-1 text-xs font-bold text-ink outline-none focus:ring-2 focus:ring-primary"
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

                  <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-white">
                    {visibleCheckins.length === 0 ? (
                      <p className="p-4 text-sm text-muted">
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
                                className="h-5 w-5 text-ink"
                              />
                            </span>

                            <span>{mood.label}</span>

                            <span className="text-muted">
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
                          className="rounded-md px-3 py-1.5 text-xs font-bold text-ink disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Previous
                        </button>

                        {historyPageItems.map((item, index) =>
                          item === "ellipsis" ? (
                            <span
                              key={`ellipsis-${index}`}
                              className="px-2 text-xs text-muted"
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
                              className={`h-8 min-w-8 rounded-btn px-2 text-xs font-bold transition-colors ${
                                item === currentHistoryPage
                                  ? "bg-ink text-white"
                                  : "text-ink hover:bg-tint"
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
                          className="rounded-md px-3 py-1.5 text-xs font-bold text-ink disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next
                        </button>
                      </nav>
                    )}
                  </div>
                </section>
              )}
            </>
          )}

          <div data-anim="rise" className="mt-8">
            <SupportBar />
          </div>
        </div>
      </main>
    </>
  );
};
