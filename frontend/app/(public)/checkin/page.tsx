import { Suspense } from "react";
import { Hero } from "@/modules/checkin/index";
import { Navbar } from "@/components/layout/Navbar";

export default function Checkin() {
  return (
    <>
      <Navbar />
      {/* Hero reads ?mood= from the landing page, which needs a Suspense boundary. */}
      <Suspense>
        <Hero />
      </Suspense>
    </>
  );
}
