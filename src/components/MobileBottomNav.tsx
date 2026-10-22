"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Radio,
  TrendingUp
} from "lucide-react";

const MOBILE_NAV = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Farmers", href: "/farmers", icon: Users },
  { name: "Activities", href: "/activities", icon: ClipboardList },
  { name: "Advisory", href: "/broadcasts", icon: Radio },
  { name: "Mandi", href: "/mandi", icon: TrendingUp },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 lg:hidden px-2 py-1.5 flex items-center justify-around shadow-lg">
      {MOBILE_NAV.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all ${
              isActive
                ? "text-emerald-700 bg-emerald-50 scale-105"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-emerald-600 stroke-[2.5]" : "text-slate-500"}`} />
            <span>{tab.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
