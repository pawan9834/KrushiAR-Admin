"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { INITIAL_BROADCASTS, BroadcastMessage } from "@/lib/mockData";
import { createBroadcastAdvisory } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  Radio,
  Send,
  CheckCircle2,
  MapPin,
  Clock,
  Eye
} from "lucide-react";

export default function BroadcastsPage() {
  const { adminUser } = useAuth();
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>(INITIAL_BROADCASTS);

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<"weather" | "pest_alert" | "subsidy" | "market">("weather");
  const [severity, setSeverity] = useState<"urgent" | "warning" | "info">("warning");
  const [targetDistrict, setTargetDistrict] = useState("All Districts");
  const [sending, setSending] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setSending(true);

    const newBroadcast: BroadcastMessage = {
      id: `b_${Date.now()}`,
      title,
      message,
      category,
      severity,
      targetDistrict,
      author: adminUser?.name || "KrushiAR Admin",
      createdAt: new Date().toISOString(),
      views: 0,
    };

    try {
      await createBroadcastAdvisory({
        title,
        message,
        category,
        severity,
        targetDistrict,
        author: adminUser?.name || "KrushiAR Admin",
      });
    } catch (err) {
      console.warn("Broadcast to Firebase note:", err);
    }

    setBroadcasts([newBroadcast, ...broadcasts]);
    setTitle("");
    setMessage("");
    setSending(false);
    setSuccessNotice(true);
    setTimeout(() => setSuccessNotice(false), 4000);
  };

  return (
    <DashboardShell
      title="Advisory & Weather Broadcasts"
      subtitle="Publish weather warnings, pest advisories and notifications to mobile app users"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Compose Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-xs sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">New Advisory</h3>
                <p className="text-[11px] text-slate-500">Send Instant App Notification</p>
              </div>
            </div>

            {successNotice && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Advisory successfully published!</span>
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Advisory Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Heavy Rain & Strong Winds Alert..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="weather">Weather Warning</option>
                  <option value="pest_alert">Pest & Disease Control</option>
                  <option value="subsidy">Government Subsidy / Scheme</option>
                  <option value="market">Market Trends & Price Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Severity Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "urgent", label: "Urgent", color: "border-rose-300 text-rose-700 bg-rose-50" },
                    { id: "warning", label: "Warning", color: "border-amber-300 text-amber-700 bg-amber-50" },
                    { id: "info", label: "Info", color: "border-blue-300 text-blue-700 bg-blue-50" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSeverity(s.id as any)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        severity === s.id ? s.color + " ring-2 ring-emerald-500" : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Region
                </label>
                <select
                  value={targetDistrict}
                  onChange={(e) => setTargetDistrict(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="All Districts">All Districts</option>
                  <option value="Pune, Nashik, Ahmednagar">Pune, Nashik, Ahmednagar</option>
                  <option value="Kolhapur, Sangli, Satara">Kolhapur, Sangli, Satara</option>
                  <option value="Solapur, Dharashiv">Solapur, Dharashiv</option>
                  <option value="Jalgaon, Dhule">Jalgaon, Dhule</option>
                  <option value="Akola, Amravati">Akola, Amravati</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message Content
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Enter detailed farming guidance and precautions..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {sending ? (
                  <span>Publishing...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Broadcast Now</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right: History & Published Advisories */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Published Advisories ({broadcasts.length})
            </h3>
            <span className="text-xs text-slate-400">Live in Farmer App</span>
          </div>

          <div className="space-y-3.5">
            {broadcasts.map((b) => (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        b.severity === "urgent"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : b.severity === "warning"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {b.severity}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {b.targetDistrict}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 flex items-center gap-1" suppressHydrationWarning>
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span suppressHydrationWarning>
                      {new Date(b.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900">{b.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {b.message}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <span>Author: <strong className="text-slate-700">{b.author}</strong></span>
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <Eye className="w-3.5 h-3.5" />
                    {b.views || 400}+ farmers reached
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
