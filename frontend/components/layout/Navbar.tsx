"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "@/constant/navigation";

export const Navbar = () => {
  const pathname = usePathname();
  
  return (
    <nav className="fixed inset-x-0 top-0 z-50">
      <div className="relative bg-[#2A9D90] px-7">
        <div className="flex items-center justify-between px-8 py-3">
          <div className="flex items-center space-x-8">
            <span className="font-serif text-2xl font-bold tracking-wide text-white">
              MindMeter
            </span>

            <div className="flex items-center space-x-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`rounded-full px-5 py-1.5 text-sm font-bold transition-all ${
                      isActive
                        ? "bg-white text-[#1E3A3A] shadow-sm"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right section: Support Button */}
          <div>
            <Link
              href="/support"
              className="rounded-xl bg-[#F6A15E] px-5.5 py-2 text-sm font-bold text-[#1E3A3A] shadow-sm transition-colors hover:bg-[#e09152]"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};