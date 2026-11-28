"use client";

import { useEffect, useState } from "react";
import type {
  FacultyCode,
  InsightHelp,
  Resource,
} from "../../../../shared/contract";

// Kept in the browser only, never sent to the API (FR-04).
const FACULTY_KEY = "mindmeter_faculty";

const facultyLabels: Record<FacultyCode, string> = {
  agricultural_technology: "Agricultural Technology",
  agriculture: "Agriculture",
  animal_science: "Animal Science",
  biology: "Biology",
  cultural_sciences: "Cultural Sciences",
  dentistry: "Dentistry",
  economics_business: "Economics and Business",
  engineering: "Engineering",
  forestry: "Forestry",
  geography: "Geography",
  graduate_school: "Graduate School",
  law: "Law",
  mathematics_natural_sciences: "Mathematics and Natural Sciences",
  medicine_public_health_nursing: "Medicine, Public Health and Nursing",
  pharmacy: "Pharmacy",
  philosophy: "Philosophy",
  psychology: "Psychology",
  social_political_sciences: "Social and Political Sciences",
  veterinary_medicine: "Veterinary Medicine",
  vocational_college: "Vocational College",
};

/** Own faculty first, then UGM-wide services. Other faculties' services are hidden. */
export function orderBookingOptions(
  options: Resource[],
  faculty: FacultyCode | null,
): Resource[] {
  const own = faculty ? options.filter((o) => o.faculty === faculty) : [];
  return [...own, ...options.filter((o) => o.faculty === null)];
}

function readFaculty(): FacultyCode | null {
  try {
    const value = localStorage.getItem(FACULTY_KEY);
    return value && value in facultyLabels ? (value as FacultyCode) : null;
  } catch {
    return null;
  }
}

export function HelpCard({ help }: { help: InsightHelp }) {
  const [faculty, setFaculty] = useState<FacultyCode | null>(null);

  // Read after mount so the server render and the first client render match.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setFaculty(readFaculty()), []);

  const chooseFaculty = (value: string) => {
    const next = value in facultyLabels ? (value as FacultyCode) : null;
    setFaculty(next);
    try {
      if (next) localStorage.setItem(FACULTY_KEY, next);
      else localStorage.removeItem(FACULTY_KEY);
    } catch {
      // Storage blocked: the choice still works until the page reloads.
    }
  };

  const options = orderBookingOptions(help.booking_options, faculty);

  return (
    <section
      className={`mt-6 rounded-xl border p-4 ${
        help.suggest_booking
          ? "border-[#F19F65] bg-[#FFF4EC]"
          : "border-[#D5E1E2] bg-white"
      }`}
    >
      <h2 className="font-serif text-lg font-bold">Talk to someone</h2>
      <p className="mt-2 text-sm text-[#3D4D59]">{help.message}</p>

      {help.booking_options.length > 0 && (
        <>
          <label className="mt-4 flex flex-col gap-1 text-xs font-bold text-[#3D4D59] sm:flex-row sm:items-center sm:gap-3">
            Your faculty (saved only on this device)
            <select
              value={faculty ?? ""}
              onChange={(e) => chooseFaculty(e.target.value)}
              className="min-h-11 rounded-md border border-[#CBD5E0] bg-white px-3 text-sm font-normal text-[#1F3347]"
            >
              <option value="">Prefer not to say</option>
              {Object.entries(facultyLabels).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {options.map((option) => {
              const isPhone = option.url.startsWith("tel:");
              return (
                <li
                  key={option.id}
                  className="rounded-lg border border-[#D5E1E2] bg-[#E3F2F1] p-3"
                >
                  <h3 className="font-serif font-bold">{option.title}</h3>
                  <p className="mt-1 text-xs text-[#3D4D59]">
                    {option.description}
                  </p>
                  <a
                    href={option.url}
                    target={isPhone ? undefined : "_blank"}
                    rel={isPhone ? undefined : "noopener noreferrer"}
                    className="mt-3 inline-flex min-h-11 items-center text-xs font-bold underline"
                  >
                    {isPhone ? "Call" : "Book a session"}
                  </a>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
