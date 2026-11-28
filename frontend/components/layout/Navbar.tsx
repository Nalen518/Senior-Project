"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "@/constant/navigation";

export const Navbar = () => {
  const pathname = usePathname();
  
  return (
    <nav className="fixed inset-x-0 top-0 z-50">
      <div className="relative bg-primary px-7">
        <div className="flex items-center justify-between px-8 py-3">
          <div className="flex items-center space-x-8">
            <span className="font-serif text-[26px] font-semibold text-white">
              MindMeter
            </span>

            <div className="flex items-center space-x-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`inline-flex min-h-11 items-center rounded-full px-4 text-[19px] font-bold transition-all ${
                      isActive
                        ? "bg-white text-ink shadow-sm"
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
              className="inline-flex min-h-11 items-center rounded-[10px] bg-accent px-6 text-[19px] font-bold text-ink shadow-sm transition-colors hover:bg-accent-hover"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};