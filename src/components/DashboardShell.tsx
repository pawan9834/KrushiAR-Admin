"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";

export function DashboardShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const { adminUser, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !adminUser) {
      router.push("/login");
    }
  }, [adminUser, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-sm font-medium text-emerald-300">Loading KrushiAR Admin...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop & Mobile Drawer Sidebar */}
      <div className="no-print">
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 pb-16 lg:pb-8 print:p-0 print:m-0 print:pl-0">
        <div className="no-print">
          <Header
            title={title}
            subtitle={subtitle}
            onMenuClick={() => setMobileOpen(true)}
          />
        </div>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in print:p-0 print:max-w-none">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="no-print">
          <MobileBottomNav />
        </div>
      </div>
    </div>
  );
}
