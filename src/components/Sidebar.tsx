"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Radio,
  TrendingUp,
  ShieldCheck,
  LogOut,
  Sprout,
  X,
  ChevronRight,
  Database,
  FileSpreadsheet,
  MessageSquareQuote,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  {
    name: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Farmers Directory",
    href: "/farmers",
    icon: Users,
  },
  {
    name: "Seeds & Varieties",
    href: "/seeds",
    icon: Sprout,
  },
  {
    name: "Crop AI Questions",
    href: "/crop-questions",
    icon: MessageSquareQuote,
    badge: "AI",
  },
  {
    name: "Activity Audit",
    href: "/activities",
    icon: ClipboardList,
  },
  {
    name: "Reports & Exports",
    href: "/reports",
    icon: FileSpreadsheet,
  },
  {
    name: "Advisories",
    href: "/broadcasts",
    icon: Radio,
  },
  {
    name: "Mandi Rates",
    href: "/mandi",
    icon: TrendingUp,
  },
  {
    name: "Admin Team",
    href: "/admins",
    icon: ShieldCheck,
  },
];

export function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (v: boolean) => void }) {
  const pathname = usePathname();
  const { adminUser, logout, isDemoMode } = useAuth();

  const handleNavClick = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Branding */}
        <div>
          <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800">
            <Link href="/" onClick={handleNavClick} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-md shadow-emerald-950">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg text-white tracking-tight">KrushiAR</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                    Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Agriculture Admin Portal</p>
              </div>
            </Link>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Pill */}
          <div className="px-6 pt-4 pb-2">
            <div className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between border ${
              isDemoMode
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isDemoMode ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                <span className="font-medium text-[11px]">
                  {isDemoMode ? "Demo Mode Active" : "Firebase Connected"}
                </span>
              </div>
              <Database className="w-3.5 h-3.5 opacity-70" />
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-4 space-y-1.5">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Menu
            </p>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-950 font-bold"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-4 h-4 text-emerald-200" />}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 text-sm shadow">
                {adminUser?.name ? adminUser.name.charAt(0) : "A"}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">
                  {adminUser?.name || "Admin"}
                </p>
                <p className="text-[10px] text-emerald-400 uppercase font-mono tracking-wide">
                  {adminUser?.role || "superadmin"}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-600/20 border border-rose-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
