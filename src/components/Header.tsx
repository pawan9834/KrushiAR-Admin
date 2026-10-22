"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Menu,
  Sparkles,
  Calendar
} from "lucide-react";

export function Header({
  onMenuClick,
  title,
  subtitle,
}: {
  onMenuClick: () => void;
  title: string;
  subtitle?: string;
}) {
  const { adminUser, isDemoMode } = useAuth();
  const [todayStr, setTodayStr] = useState<string>("");

  useEffect(() => {
    try {
      const formatted = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date());
      setTodayStr(formatted);
    } catch (e) {
      // fallback
      setTodayStr(new Date().toDateString());
    }
  }, []);

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between shadow-xs">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <h1 className="text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{title}</span>
            {isDemoMode && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Demo Mode
              </span>
            )}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Date & Profile */}
      <div className="flex items-center gap-3">
        {todayStr && (
          <div
            suppressHydrationWarning
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs text-slate-600"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span suppressHydrationWarning>{todayStr}</span>
          </div>
        )}

        {/* Admin profile chip */}
        <div className="flex items-center gap-2 pl-2">
          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-emerald-100">
            {adminUser?.name ? adminUser.name.charAt(0) : "A"}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">
              {adminUser?.name || "Admin"}
            </p>
            <p className="text-[10px] text-emerald-600 font-semibold uppercase">
              {adminUser?.role || "superadmin"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
