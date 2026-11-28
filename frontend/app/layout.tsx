import type { Metadata } from "next";


import { OfflineExperience } from "@/components/UI/OfflineExperience";
import { WelcomeGate } from "@/components/UI/WelcomeGate";
import { Footer } from "@/components/layout/Footer";

import { Fraunces, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/globals.css";

// Figma type: Fraunces for headings, Plus Jakarta Sans for body, JetBrains Mono for labels.
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MindMeter",
  description: "MindMeter",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jakarta.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <WelcomeGate />
        <OfflineExperience />
        {children}
        {/* Disclaimer and crisis contacts on every page (FR-15). */}
        <div className="mx-auto w-full max-w-[1280px] px-4 lg:px-8">
          <Footer />
        </div>
      </body>
    </html>
  );
}
