"use client";

import React, { useState, useEffect, useRef } from "react";
import { MoodFace } from "@/components/UI/MoodFace";
import { SupportBar } from "@/components/UI/SupportBar";
import { useRouter, useSearchParams } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { submitOrQueue, readQueue } from "@/lib/syncQueue";
import { api, describeError } from "@/lib/api";
import { AlreadyCheckedIn } from "./AlreadyCheckedIn";
import { Saved } from "./Saved";

const moods = [
  { value: 1, label: "Very low", color: "bg-mood-1" },
  { value: 2, label: "Low", color: "bg-mood-2" },
  { value: 3, label: "Okay", color: "bg-mood-3" },
  { value: 4, label: "Good", color: "bg-mood-4" },
  { value: 5, label: "Very good", color: "bg-mood-5" },
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
  // A mood tapped on the landing page arrives as ?mood=1..5 and starts selected.
  const moodParam = Number(useSearchParams().get("mood"));
  const [selectedMood, setSelectedMood] = useState<MoodValue | null>(
    moods.find((m) => m.value === moodParam)?.value ?? null,
  );
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
    } catch (err) {
      setErrorMessage(
        describeError(err, "We could not save your check-in. Please try again in a moment."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <section
        ref={scope}
        className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-white px-4 py-12 text-ink select-none"
      >
        {/* Background blobs, same shapes and colours as the landing page */}
        <div data-anim="circle" className="blob pointer-events-none absolute -left-20 -top-20 z-0 h-72 w-72 bg-[#CFE3E4] opacity-60" />
        <div data-anim="circle" className="blob pointer-events-none absolute right-12 top-20 z-0 h-32 w-32 bg-[#ECE1BE] opacity-60" />
        <div data-anim="circle" className="blob pointer-events-none absolute bottom-24 left-10 z-0 h-40 w-40 bg-[#E4A79A]/70 opacity-60" />
        <div data-anim="circle" className="blob pointer-events-none absolute -bottom-20 -right-20 z-0 h-80 w-80 bg-[#D8C7E7] opacity-60" />

        <div className="relative z-10 flex w-full max-w-[720px] flex-col items-center text-center">
          <h1 data-anim="title" className="title-page mb-8 text-ink">
            How are you feeling today?
          </h1>

          <div className="mb-8 flex flex-wrap items-start justify-center gap-2 sm:gap-4">
            {moods.map((mood) => (
              <button
                key={mood.value}
                type="button"
                data-anim="mood"
                aria-label={`Mood ${mood.value} of 5, ${mood.label.toLowerCase()}`}
                aria-pressed={selectedMood === mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className="group flex w-20 flex-col items-center gap-2 rounded-2xl py-1 text-sm text-body focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                <span
                  className={`flex h-16 w-16 items-center justify-center rounded-full border border-line text-ink transition-transform group-hover:scale-105 ${mood.color} ${
                    selectedMood === mood.value ? "scale-110 ring-2 ring-ink ring-offset-2" : ""
                  }`}
                >
                  <MoodFace mood={mood.value} className="h-3/4 w-3/4" />
                </span>
                <span aria-hidden="true" className={selectedMood === mood.value ? "font-bold text-ink" : ""}>
                  {mood.label}
                </span>
              </button>
            ))}
          </div>

          <div
            data-anim="rise"
            className="relative w-full rounded-2xl border border-line bg-white p-6 text-left focus-within:outline-2 focus-within:outline-ink"
          >
            <label htmlFor="checkin-note" className="mb-2 block text-sm font-semibold text-ink">
              Add a note (optional)
            </label>
            <textarea
              id="checkin-note"
              value={note}
              onChange={handleTextChange}
              placeholder="Deadlines for three courses landed in the same week..."
              className="h-28 w-full resize-none bg-transparent text-base text-ink placeholder-muted focus:outline-none"
            />
            <div className="text-right text-xs text-muted">
              {note.length} / {maxChars}
            </div>
          </div>

          {note.length >= maxChars && (
            <p className="mt-2 text-sm text-muted">
              You have reached {maxChars} characters. Extra typing is blocked.
            </p>
          )}

          <button
            type="button"
            data-anim="rise"
            onClick={handleSave}
            disabled={isSaving}
            className="mt-6 min-h-12 w-full rounded-btn bg-primary px-6 text-[19px] font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
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
            <p className="mt-2 text-sm text-red-700" role="alert">
              {errorMessage}
            </p>
          )}

          <p className="mt-2 text-sm text-muted">
            {isUpdating
              ? "You are updating today’s check-in."
              : "One check-in per day. Pick a mood to save."}
          </p>

          <div data-anim="rise" className="mt-6 w-full">
            <SupportBar />
          </div>
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