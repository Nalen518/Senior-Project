"use client";

import { useEffect, useState } from "react";
import { WelcomeModal } from "@/components/UI/WelcomeModal";

const WELCOME_SEEN_KEY = "mindmeter_welcome_seen";

export function WelcomeGate() {
  const [isReady, setIsReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(WELCOME_SEEN_KEY) === "true";

    setIsOpen(!hasSeenWelcome);
    setIsReady(true);
  }, []);

  const closeWelcome = () => {
    localStorage.setItem(WELCOME_SEEN_KEY, "true");
    setIsOpen(false);
  };

  if (!isReady) return null;

  return <WelcomeModal isOpen={isOpen} onClose={closeWelcome} />;
}