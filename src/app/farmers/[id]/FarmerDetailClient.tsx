"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import type { FarmActivity, Farmer, FarmerPlot, FarmerCrop } from "@/lib/mockData";
import { fetchLiveFarmerById } from "@/lib/farmersService";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  Layers,
  Sprout,
  ClipboardList,
  IndianRupee,
  Mic,
  Play,
  Pause,
  CheckCircle2,
  FileText,
  Clock,
  Filter,
  Loader2,
  ImageIcon
} from "lucide-react";

export function FarmerDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const { id: farmerId } = use(params);

  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [crops, setCrops] = useState<FarmerCrop[]>([]);
  const [plots, setPlots] = useState<FarmerPlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<"activities" | "plots" | "crops">("activities");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function loadFarmer() {
      setLoading(true);
      try {
        const result = await fetchLiveFarmerById(farmerId);
        if (result) {
          setFarmer(result.farmer);
          setActivities(result.activities);
          setCrops(result.crops);
          setPlots(result.plots);
        } else {
          setFarmer(null);
        }
      } catch (err) {
        console.error("Error loading farmer details:", err);
        setFarmer(null);
      } finally {
        setLoading(false);
      }
    }

    if (farmerId) {
      loadFarmer();
    }

    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, [farmerId]);

  const togglePlayAudio = (id: string, audioUri?: string) => {
    if (playingId === id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    if (audioUri) {
      try {
        const audio = new Audio(audioUri);
        audioPlayerRef.current = audio;
        setPlayingId(id);

        audio.play().catch((e) => {
          console.warn("Audio playback issue:", e);
          setPlayingId(null);
        });

        audio.onended = () => {
          setPlayingId(null);
        };
      } catch (e) {
        console.warn("Failed to create audio:", e);
        setPlayingId(null);
      }
    } else {
      setPlayingId(id);
      setTimeout(() => {
        setPlayingId((curr) => (curr === id ? null : curr));
      }, 4000);
    }
  };

  if (loading) {
    return (
      <DashboardShell title="Loading Farmer Profile...">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">
            Fetching real farmer profile and live field records from Firestore...
          </p>
        </div>
      </DashboardShell>
    );
  }

  if (!farmer) {
    return (
      <DashboardShell title="Farmer Not Found">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md mx-auto my-12 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Farmer Profile Not Found</h2>
          <p className="text-xs text-slate-500 mb-6">
            The requested farmer ID &quot;{farmerId}&quot; does not exist in the live database.
          </p>
          <Link
            href="/farmers"
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Farmers Directory</span>
          </Link>
        </div>
      </DashboardShell>
    );
  }

  // Filter activities
  const filteredActivities = activities.filter(
    (act) => selectedType === "ALL" || act.activityType.toLowerCase() === selectedType.toLowerCase()
  );

  const totalCost = activities.reduce((acc, curr) => acc + curr.cost, 0);
  const voiceNotesCount = activities.filter((a) => a.hasAudio).length;

  return (
    <DashboardShell
      title={`Farmer Audit: ${farmer.fullName}`}
      subtitle={`Live records, plots, standing crops and field activity stream for ID ${farmer.id}`}
    >
      {/* Back button */}
      <div className="mb-5">
        <Link
          href="/farmers"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Farmers Directory</span>
        </Link>
      </div>

      {/* 1. Farmer Profile Hero Banner */}
      <div className="p-6 lg:p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white border border-emerald-800/40 shadow-lg mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {farmer.avatarUrl ? (
              <img
                src={farmer.avatarUrl}
                alt={farmer.fullName}
                className="w-16 h-16 rounded-2xl object-cover shadow-xl shadow-emerald-950 border border-emerald-400/40 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-2xl shadow-xl shadow-emerald-950 border border-emerald-400/30 shrink-0">
                {farmer.fullName.charAt(0) || "F"}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <h2 className="text-xl lg:text-2xl font-extrabold text-white">{farmer.fullName}</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  {farmer.id}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                  {farmer.totalAcreage} Total Acres
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  +91 {farmer.phoneNumber}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {[farmer.village, farmer.taluka, farmer.district].filter(Boolean).join(", ") || "Maharashtra"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Registered: {farmer.registeredAt}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <a
              href={`tel:${farmer.phoneNumber}`}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors shrink-0"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Farmer</span>
            </a>
          </div>
        </div>

        {/* Highlight Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Land</span>
            <span className="text-lg lg:text-xl font-extrabold text-white mt-0.5 block">{farmer.totalAcreage} Acres</span>
            <span className="text-[10px] text-slate-400">{plots.length} registered plots</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Activity Logs</span>
            <span className="text-lg lg:text-xl font-extrabold text-emerald-400 mt-0.5 block">{activities.length} Entries</span>
            <span className="text-[10px] text-slate-400">{voiceNotesCount} voice recordings</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recorded Expenses</span>
            <span className="text-lg lg:text-xl font-extrabold text-teal-400 mt-0.5 block">₹{totalCost.toLocaleString("en-IN")}</span>
            <span className="text-[10px] text-slate-400">Total inputs & labor</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Standing Crops</span>
            <span className="text-lg lg:text-xl font-extrabold text-amber-300 mt-0.5 block">{crops.length} Crops</span>
            <span className="text-[10px] text-slate-400 truncate block">
              {crops.length > 0 ? crops.map(c => c.name).join(", ") : "None listed"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 lg:px-6 shadow-2xs mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("activities")}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "activities"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Activity Audit Stream ({activities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("plots")}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "plots"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Plots & Soil ({plots.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("crops")}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "crops"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>Standing Crops ({crops.length})</span>
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: ACTIVITY AUDIT */}
      {activeTab === "activities" && (
        <div className="space-y-4">
          {/* Sub-filter by activity type */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1 shrink-0">
                <Filter className="w-3.5 h-3.5" /> Filter Type:
              </span>
              {[
                { id: "ALL", label: "All Activities" },
                { id: "fertilizer", label: "Fertilizer" },
                { id: "spraying", label: "Spraying" },
                { id: "irrigation", label: "Irrigation" },
                { id: "harvest", label: "Harvest" },
                { id: "expense", label: "Expense" },
                { id: "other", label: "Other" }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer ${
                    selectedType === type.id
                      ? "bg-emerald-600 text-white shadow-xs font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <span className="text-xs font-semibold text-slate-500">
              Showing {filteredActivities.length} of {activities.length} activities
            </span>
          </div>

          {/* Activity Cards List */}
          {filteredActivities.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
              No field activities recorded for this filter criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-5 lg:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-3"
                >
                  {/* Top row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {act.cropName} • {act.plotName}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            act.activityType === "spraying"
                              ? "bg-emerald-100 text-emerald-800"
                              : act.activityType === "fertilizer"
                              ? "bg-teal-100 text-teal-800"
                              : act.activityType === "irrigation"
                              ? "bg-blue-100 text-blue-800"
                              : act.activityType === "harvest"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {act.activityType}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">#{act.id}</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900">{act.title}</h4>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-base font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200 block">
                        ₹{act.cost.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-1">Recorded Cost</span>
                    </div>
                  </div>

                  {/* Notes / Transcription / AI Summary */}
                  <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                    &quot;{act.description}&quot;
                  </p>

                  {/* Field Photo if available */}
                  {act.photoUrl && (
                    <div className="pt-1">
                      <a
                        href={act.photoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 group cursor-pointer"
                      >
                        <img
                          src={act.photoUrl}
                          alt={act.title}
                          className="w-32 h-24 object-cover rounded-xl border border-slate-200 group-hover:opacity-90 transition-opacity shadow-2xs"
                        />
                        <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 group-hover:underline">
                          <ImageIcon className="w-3.5 h-3.5" /> View Photo
                        </span>
                      </a>
                    </div>
                  )}

                  {/* Agrochemical inputs & dosage */}
                  {(act.inputsUsed || act.dosage) && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      {act.inputsUsed?.map((inp, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200"
                        >
                          📦 {inp}
                        </span>
                      ))}
                      {act.dosage && (
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-medium border border-amber-200">
                          ⚖️ {act.dosage}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Audio note player */}
                  {act.hasAudio && (
                    <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/60 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => togglePlayAudio(act.id, act.audioUri)}
                          className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-xs"
                          title={playingId === act.id ? "Pause Audio" : "Play Farmer Voice Note"}
                        >
                          {playingId === act.id ? (
                            <Pause className="w-4 h-4 fill-white" />
                          ) : (
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          )}
                        </button>
                        <div>
                          <p className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                            <Mic className="w-3.5 h-3.5 text-purple-600" />
                            {playingId === act.id ? "Playing Voice Note..." : "Original Voice Log"}
                          </p>
                          <p className="text-[10px] text-purple-700/80">
                            {act.audioUri ? "Audio stream loaded from Cloud Storage" : `Duration: ${act.audioDuration} mins`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-4 bg-purple-400 rounded-full ${playingId === act.id ? "animate-pulse" : ""}`} />
                        <div className={`w-2 h-6 bg-purple-500 rounded-full ${playingId === act.id ? "animate-pulse delay-75" : ""}`} />
                        <div className={`w-2 h-3 bg-purple-400 rounded-full ${playingId === act.id ? "animate-pulse delay-150" : ""}`} />
                      </div>
                    </div>
                  )}

                  {/* Metadata footer */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {act.location}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(act.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </span>
                    </div>

                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Cloud Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PLOTS & SOIL */}
      {activeTab === "plots" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plots.length === 0 ? (
            <div className="col-span-2 bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
              No farmland plots registered yet for this farmer.
            </div>
          ) : (
            plots.map((plot) => (
              <div
                key={plot.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-bold text-slate-900">{plot.name}</h4>
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200">
                      {plot.acreage} Acres
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Plot ID: {plot.id}</p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Soil Type:</span>
                    <strong className="text-slate-800">{plot.soilType}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Irrigation Source:</span>
                    <strong className="text-slate-800">{plot.irrigationSource}</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: STANDING CROPS */}
      {activeTab === "crops" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {crops.length === 0 ? (
            <div className="col-span-2 bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
              No crops currently registered for this farmer.
            </div>
          ) : (
            crops.map((crop) => (
              <div
                key={crop.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-bold text-slate-900">{crop.name}</h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] uppercase">
                      {crop.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Variety: <strong className="text-slate-700">{crop.variety}</strong>
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Allocated Plot:</span>
                    <strong className="text-slate-800">{crop.plotName}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Area Cultivated:</span>
                    <strong className="text-emerald-700">{crop.areaAcre} Acres</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Sowing Date:</span>
                    <strong className="text-slate-800">{crop.sowingDate}</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </DashboardShell>
  );
}
