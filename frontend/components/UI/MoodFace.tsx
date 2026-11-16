import type { SVGProps } from "react";

type MoodValue = 1 | 2 | 3 | 4 | 5;

type MoodFaceProps = SVGProps<SVGSVGElement> & {
  mood: MoodValue;
};

export function MoodFace({ mood, ...props }: MoodFaceProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {mood === 1 && (
        <>
          <circle cx="9" cy="10" r="1" fill="currentColor" />
          <circle cx="15" cy="10" r="1" fill="currentColor" />
          <path d="M16 16c-2-1.5-6-1.5-8 0" />
        </>
      )}

      {mood === 2 && (
        <>
          <circle cx="9" cy="10" r="1" fill="currentColor" />
          <circle cx="15" cy="10" r="1" fill="currentColor" />
          <path d="M15 16c-1.5-1-4.5-1-6 0" />
        </>
      )}

      {mood === 3 && (
        <>
          <circle cx="9" cy="10" r="1" fill="currentColor" />
          <circle cx="15" cy="10" r="1" fill="currentColor" />
          <path d="M8 15h8" />
        </>
      )}

      {mood === 4 && (
        <>
          <circle cx="9" cy="10" r="1" fill="currentColor" />
          <circle cx="15" cy="10" r="1" fill="currentColor" />
          <path d="M9 15c2 1.5 4 1.5 6 0" />
        </>
      )}

      {mood === 5 && (
        <>
          <path d="M7 9c.5-1 2-1 2.5 0" />
          <path d="M14.5 9c.5-1 2-1 2.5 0" />
          <path d="M8 14c2 3 6 3 8 0" />
        </>
      )}
    </svg>
  );
}