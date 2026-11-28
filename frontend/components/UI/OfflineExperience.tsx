"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startAutoSync } from "@/lib/syncQueue";

export function OfflineExperience() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine);

    updateConnection();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);

    const stopAutoSync = startAutoSync(() => router.push("/crisis"));

    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
      stopAutoSync();
    };
  }, [router]);

  if (isOnline !== false) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-[68px] z-40 bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-950 shadow"
    >
      You’re offline. New check-ins will be saved on this device and synced
      when you reconnect.
    </div>
  );
}