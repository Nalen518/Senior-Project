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
      className={`mt-10 rounded-2xl border p-6 ${
        help.suggest_booking
          ? "border-2 border-[#F19F65] bg-[#FFF4EC]"
          : "border-[#D9D9D9] bg-white"
      }`}
    >
      <h2 className="font-serif text-[22px] font-semibold leading-[30px] text-[#163250]">
        Talk to someone
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-5 text-[#333333]">
        {help.message}
      </p>

      {help.booking_options.length > 0 && (
        <>
          <label className="mt-6 flex flex-col gap-2 text-sm font-medium text-[#163250] sm:flex-row sm:items-center sm:gap-3">
            Your faculty (saved only on this device)
            <select
              value={faculty ?? ""}
              onChange={(e) => chooseFaculty(e.target.value)}
              className="min-h-11 rounded-[10px] border border-[#999999] bg-white px-3 text-sm font-normal text-[#163250] focus:outline-none focus:ring-2 focus:ring-[#2A9D90]"
            >
              <option value="">Prefer not to say</option>
              {Object.entries(facultyLabels).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <ul className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {options.map((option) => {
              const isPhone = option.url.startsWith("tel:");
              return (
                <li
                  key={option.id}
                  className="flex flex-col gap-2 rounded-2xl border border-[#D9D9D9] bg-[#A7DADC]/30 p-6"
                >
                  <h3 className="font-serif text-[22px] font-semibold leading-[30px] text-[#163250]">
                    {option.title}
                  </h3>
                  <p className="text-sm leading-5 text-[#333333]">
                    {option.description}
                  </p>
                  <a
                    href={option.url}
                    target={isPhone ? undefined : "_blank"}
                    rel={isPhone ? undefined : "noopener noreferrer"}
                    className={`mt-auto inline-flex min-h-11 items-center gap-2 self-start rounded-[10px] text-sm font-medium text-[#163250] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D90] ${
                      help.suggest_booking
                        ? "border border-[#163250] bg-[#163250] px-4 text-white hover:bg-[#1F405D]"
                        : "hover:underline"
                    }`}
                  >
                    {isPhone ? "Call" : "Book a session"}
                    <span aria-hidden="true">→</span>
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
