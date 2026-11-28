"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { submitOrQueue, readQueue } from "@/lib/syncQueue";
import { api } from "@/lib/api";
import { AlreadyCheckedIn } from "./AlreadyCheckedIn";
import { Saved } from "./Saved";

const moods = [
  { value: 1, label: "Very low", color: "bg-[#D96B5B]" },
  { value: 2, label: "Low", color: "bg-[#E7975B]" },
  { value: 3, label: "Neutral", color: "bg-[#D8D4A2]" },
  { value: 4, label: "Good", color: "bg-[#67AB83]" },
  { value: 5, label: "Very good", color: "bg-[#2EB812]" },
] as const;

type MoodValue = (typeof moods)[number]["value"];
type Checkin = Awaited<ReturnType<typeof api.listCheckins>>[number];
type TodayCheckin = Pick<Checkin, "mood_value" | "note_text">;

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

export const Hero = () => {
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<MoodValue | null>(null);
  const [note, setNote] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedTitle, setSavedTitle] = useState("Check-in saved");
  const [existingCheckin, setExistingCheckin] = useState<TodayCheckin | null>(
    null,
  );
  const [showAlreadyCheckedIn, setShowAlreadyCheckedIn] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const maxChars = 200;
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
            "[data-anim=mood]",
            {
              y: 16,
              scale: 0.8,
              autoAlpha: 0,
              stagger: 0.08,
              ease: "back.out(1.7)",
              clearProps: "transform",
            },
            0.4,
          )
          .from("[data-anim=rise]", { y: 16, autoAlpha: 0, stagger: 0.1 }, 0.7);

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

  useEffect(() => {
    let cancelled = false;

    const loadTodayCheckin = async () => {
      const today = jakartaDateKey(new Date());

      const queuedToday =
        readQueue().find(
          (checkin) => jakartaDateKey(checkin.client_ts) === today,
        ) ?? null;

      try {
        const checkins = await api.listCheckins();

        const savedToday =
          checkins.find(
            (checkin) => jakartaDateKey(checkin.created_at) === today,
          ) ?? null;

        const currentCheckin = queuedToday ?? savedToday;

        if (!cancelled && currentCheckin) {
          setExistingCheckin({
            mood_value: currentCheckin.mood_value,
            note_text: currentCheckin.note_text ?? null,
          });

          setShowAlreadyCheckedIn(true);
        }
      } catch {
        if (!cancelled && queuedToday) {
          setExistingCheckin({
            mood_value: queuedToday.mood_value,
            note_text: queuedToday.note_text ?? null,
          });

          setShowAlreadyCheckedIn(true);
        }
      }
    };

    void loadTodayCheckin();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= maxChars) {
      setNote(e.target.value);
    }
  };

  const handleStartUpdate = () => {
    if (!existingCheckin) return;

    setSelectedMood(existingCheckin.mood_value);
    setNote(existingCheckin.note_text ?? "");
    setIsUpdating(true);
    setShowAlreadyCheckedIn(false);
  };

  const handleSave = async () => {
    if (selectedMood === null) {
      setErrorMessage("Choose how you are feeling before saving.");
      return;
    }

    setErrorMessage("");
    setIsSaving(true);

    try {
      const outcome = await submitOrQueue({
        mood_value: selectedMood,
        note_text: note.trim() || null,
      });

      if (outcome.kind === "queued") {
        setSavedTitle(
          outcome.replaced
            ? "Offline check-in updated"
            : "Saved on this device",
        );

        setSavedMessage(
          outcome.replaced
            ? "Your saved offline check-in was updated. The newest version will sync when you reconnect."
            : "Saved on this device. It will be sent when you are back online.",
        );

        setIsSaved(true);
        return;
      }

      if (outcome.response.crisis_flag) {
        router.push("/crisis");
        return;
      }

      if (!outcome.response.saved) {
        setErrorMessage(
          "This check-in was not saved because a newer check-in already exists for today.",
        );
        return;
      }

      setSavedTitle(isUpdating ? "Check-in updated" : "Check-in saved");
      setSavedMessage(outcome.response.insight);
      setIsSaved(true);
    } catch {
      setErrorMessage(
        "We could not save your check-in. Please try again in a moment.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <section
        ref={scope}
        className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-white px-4 py-12 text-[#1B363A] select-none"
      >
        {/* Background Decorative Circles */}
        <div
          data-anim="circle"
          className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[#E3F2F1]/60 z-0 pointer-events-none"
        />
        <div
          data-anim="circle"
          className="absolute right-12 top-20 h-32 w-32 rounded-full bg-[#ECE1BE] z-0 pointer-events-none"
        />
        <div
          data-anim="circle"
          className="absolute left-10 bottom-24 h-40 w-40 rounded-full bg-[#E4A79A]/70 z-0 pointer-events-none"
        />
        <div
          data-anim="circle"
          className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-[#D8C7E7] z-0 pointer-events-none"
        />

        {/* Main Container */}
        <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
          {/* Title */}
          <h1
            data-anim="title"
            className="mb-10 font-serif text-3xl font-bold text-[#1F3347] sm:text-4xl"
          >
            How are you feeling today?
          </h1>

          {/* Mood Selection */}
          <div className="mb-8 flex items-center justify-center gap-3 sm:gap-6">
            <span className="text-xs font-semibold text-[#1F3347] sm:text-sm">
              Very low
            </span>

            <div className="flex items-center gap-2 sm:gap-4">
              {moods.map((mood, idx) => (
                <button
                  key={idx}
                  type="button"
                  data-anim="mood"
                  onClick={() => setSelectedMood(mood.value)}
                  className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#1F3347] transition-transform hover:scale-105 sm:h-14 sm:w-14 ${
                    mood.color
                  } ${selectedMood === mood.value ? "ring-4 ring-[#1F3347]/30 scale-110" : ""}`}
                >
                  {/* SVG Face Details */}
                  {idx === 0 && (
                    <svg
                      className="w-8 h-8 text-[#1F3347]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <circle cx="9" cy="10" r="1" fill="currentColor" />
                      <circle cx="15" cy="10" r="1" fill="currentColor" />
                      <path d="M16 16c-2-1.5-6-1.5-8 0" />
                    </svg>
                  )}
                  {idx === 1 && (
                    <svg
                      className="w-8 h-8 text-[#1F3347]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <circle cx="9" cy="10" r="1" fill="currentColor" />
                      <circle cx="15" cy="10" r="1" fill="currentColor" />
                      <path d="M15 16c-1.5-1-4.5-1-6 0" />
                    </svg>
                  )}
                  {idx === 2 && (
                    <svg
                      className="w-8 h-8 text-[#1F3347]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <circle cx="9" cy="10" r="1" fill="currentColor" />
                      <circle cx="15" cy="10" r="1" fill="currentColor" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                  )}
                  {idx === 3 && (
                    <svg
                      className="w-8 h-8 text-[#1F3347]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <circle cx="9" cy="10" r="1" fill="currentColor" />
                      <circle cx="15" cy="10" r="1" fill="currentColor" />
                      <path d="M9 15c2 1.5 6 1.5 8 0" />
                    </svg>
                  )}
                  {idx === 4 && (
                    <svg
                      className="w-8 h-8 text-[#1F3347]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M7 9c.5-1 2-1 2.5 0" />
                      <path d="M14.5 9c.5-1 2-1 2.5 0" />
                      <path d="M8 14c2 3 6 3 8 0" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <span className="text-xs font-semibold text-[#1F3347] sm:text-sm">
              Very good
            </span>
          </div>

          {/* Text Input Container */}
          <div
            data-anim="rise"
            className={`relative w-full rounded-xl border focus-within:outline-2 focus-within:outline-[#1F3347] border-gray-300 bg-[#E8F3F3] p-4 text-left shadow-sm ${isSaved ? "" : ""}`}
          >
            <textarea
              value={note}
              onChange={handleTextChange}
              placeholder="Deadlines for three courses landed in the same week..."
              className="h-32 w-full resize-none bg-transparent text-sm text-[#1F3347] placeholder-gray-500 focus:outline-none"
            />
            <div className="text-right text-xs text-gray-500">
              {note.length} / {maxChars}
            </div>
          </div>

          {/* Warning text */}
          {note.length >= maxChars && (
            <p className="mt-2 text-xs text-gray-500">
              You have reached {maxChars} characters. Extra typing is blocked.
            </p>
          )}

          <button
            type="button"
            data-anim="rise"
            onClick={handleSave}
            disabled={isSaving}
            className="mt-6 w-full rounded-lg bg-[#A3D9D9] py-3 text-sm font-semibold text-[#1F3347] transition-colors hover:bg-[#8ECFCE] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving
              ? isUpdating
                ? "Updating..."
                : "Saving..."
              : isUpdating
                ? "Update check-in"
                : "Save check-in"}
          </button>

          {errorMessage && (
            <p className="mt-2 text-xs text-red-700" role="alert">
              {errorMessage}
            </p>
          )}

          <p className="mt-2 text-xs text-gray-500">
            {isUpdating
              ? "You are updating today’s check-in."
              : "One check-in per day. Pick a mood to save."}
          </p>

          {/* Need to talk to someone Button */}
          <Link
            href="/support"
            data-anim="rise"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#D3C1E5] py-3 text-sm font-semibold text-[#1F3347] transition-colors hover:bg-[#C5B0DA]"
          >
            <span>Need to talk to someone?</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </section>

      {showAlreadyCheckedIn && existingCheckin && (
        <AlreadyCheckedIn
          note={existingCheckin.note_text}
          onUpdate={handleStartUpdate}
        />
      )}

      <Saved
        isOpen={isSaved}
        title={savedTitle}
        message={savedMessage}
        onClose={() => setIsSaved(false)}
      />
    </>
  );
};