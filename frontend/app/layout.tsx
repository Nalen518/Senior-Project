import type { Metadata } from "next";


import { OfflineExperience } from "@/components/UI/OfflineExperience";
import { WelcomeGate } from "@/components/UI/WelcomeGate";

import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MindMeter",
  description: "MindMeter",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <WelcomeGate />
        <OfflineExperience />
        {children}
      </body>
    </html>
  );
}
