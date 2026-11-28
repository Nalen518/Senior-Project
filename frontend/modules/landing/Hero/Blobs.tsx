// Soft background blobs from the Figma landing frame. Decorative only.
// Outer element flies away on scroll, inner element floats (both animated in Hero's useGSAP).
// z-[1]: above section backgrounds, below content (which is z-[2]).
const blobs = [
  { top: "2%", left: "-4%", size: 260, color: "bg-[#CFE3E4]" },
  { top: "9%", right: "-3%", size: 190, color: "bg-[#ECE1BE]" },
  { top: "22%", left: "5%", size: 120, color: "bg-[#E4A79A]/70" },
  { top: "37%", right: "2%", size: 210, color: "bg-[#D8C7E7]" },
  { top: "46%", left: "-4%", size: 230, color: "bg-[#ECE1BE]" },
  { top: "58%", right: "-3%", size: 160, color: "bg-[#E4A79A]/70" },
  { top: "69%", left: "3%", size: 250, color: "bg-[#D8C7E7]" },
  { top: "80%", right: "9%", size: 140, color: "bg-[#ECE1BE]" },
];

export function Blobs() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
      {blobs.map(({ size, color, ...pos }, i) => (
        <div key={i} data-blob className="absolute will-change-transform" style={{ ...pos, width: size, height: size * 0.85 }}>
          <div data-blob-inner className={`h-full w-full rounded-[48%_52%_55%_45%/50%_45%_55%_50%] opacity-60 ${color}`} />
        </div>
      ))}
    </div>
  );
}
