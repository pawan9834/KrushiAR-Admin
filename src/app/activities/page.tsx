"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import type { FarmActivity, Farmer } from "@/lib/mockData";
import { fetchLiveAllActivities } from "@/lib/farmersService";
import {
  Search,
  Filter,
  Mic,
  MapPin,
  Calendar,
  Play,
  Pause,
  CheckCircle2,
  User,
  Phone,
  X,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
  Loader2,
  ImageIcon
} from "lucide-react";

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const loadData = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetchLiveAllActivities();
      setActivities(res.activities);
      setFarmers(res.farmers);
    } catch (err) {
      console.error("Failed to load activities:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  // Selected farmer object
  const activeFarmer = selectedFarmerId === "ALL" ? null : farmers.find((f) => f.id === selectedFarmerId);

  // Filter activities
  const filtered = useMemo(() => {
    return activities.filter((act) => {
      const matchesFarmer =
        selectedFarmerId === "ALL" || act.farmerId === selectedFarmerId;

      const term = searchTerm.toLowerCase();
      const matchesSearch =
        act.farmerName.toLowerCase().includes(term) ||
        act.title.toLowerCase().includes(term) ||
        act.description.toLowerCase().includes(term) ||
        act.cropName.toLowerCase().includes(term) ||
        act.plotName.toLowerCase().includes(term);

      const matchesType =
        selectedType === "ALL" || act.activityType.toLowerCase() === selectedType.toLowerCase();

      return matchesFarmer && matchesSearch && matchesType;
    });
  }, [activities, selectedFarmerId, searchTerm, selectedType]);

  // Farmer-specific metrics
  const farmerActivities = selectedFarmerId === "ALL" ? activities : activities.filter((a) => a.farmerId === selectedFarmerId);
  const farmerTotalCost = farmerActivities.reduce((acc, curr) => acc + curr.cost, 0);
  const farmerVoiceCount = farmerActivities.filter((a) => a.hasAudio).length;

  const togglePlayAudio = (id: string, audioUri?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

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

        audio.play().catch((err) => {
          console.warn("Audio play issue:", err);
          setPlayingId(null);
        });

        audio.onended = () => {
          setPlayingId(null);
        };
      } catch (err) {
        console.warn("Audio error:", err);
        setPlayingId(null);
      }
    } else {
      setPlayingId(id);
      setTimeout(() => {
        setPlayingId((curr) => (curr === id ? null : curr));
      }, 4000);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((curr) => (curr === id ? null : id));
  };

  return (
    <DashboardShell
      title="Activity Audit"
      subtitle="Detailed live farm activities, voice transcriptions and expense audit per user"
    >
      {/* 1. Farmer / User Filter Bar */}
      <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-xs mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-emerald-600" />
            Select User (Farmer):
          </label>
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold self-start sm:self-auto cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
            <span>Refresh Stream</span>
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedFarmerId("ALL")}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer ${
              selectedFarmerId === "ALL"
                ? "bg-slate-900 text-white shadow-xs font-bold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Farmers ({activities.length})
          </button>
          {farmers.map((farmer) => {
            const count = activities.filter((a) => a.farmerId === farmer.id).length;
            return (
              <button
                key={farmer.id}
                onClick={() => setSelectedFarmerId(farmer.id)}
                className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedFarmerId === farmer.id
                    ? "bg-emerald-600 text-white shadow-xs font-bold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{farmer.fullName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedFarmerId === farmer.id
                      ? "bg-emerald-700 text-emerald-100"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Activity Type Filter */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search activity notes, crop, plot, inputs..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Type:
            </span>
            {[
              { id: "ALL", label: "All" },
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
                className={`px-2.5 py-1.5 rounded-lg font-medium shrink-0 transition-all cursor-pointer ${
                  selectedType === type.id
                    ? "bg-emerald-600 text-white font-bold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Farmer Context Card (When specific farmer is selected) */}
      {activeFarmer && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-emerald-800/40 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {activeFarmer.avatarUrl ? (
              <img
                src={activeFarmer.avatarUrl}
                alt={activeFarmer.fullName}
                className="w-12 h-12 rounded-xl object-cover border border-emerald-400/40 shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-emerald-600 font-extrabold flex items-center justify-center text-lg shadow-md border border-emerald-400/30">
                {activeFarmer.fullName.charAt(0) || "F"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">{activeFarmer.fullName}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeFarmer.id}
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  +91 {activeFarmer.phoneNumber}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {[activeFarmer.village, activeFarmer.district].filter(Boolean).join(", ")}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-700/50">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Expenses</span>
              <strong className="text-sm font-extrabold text-emerald-400">₹{farmerTotalCost.toLocaleString("en-IN")}</strong>
            </div>

            <div className="bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-700/50">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Voice Recordings</span>
              <strong className="text-sm font-extrabold text-purple-300">{farmerVoiceCount} audio notes</strong>
            </div>

            <Link
              href={`/farmers/${activeFarmer.id}`}
              className="py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Open User Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-xs font-semibold text-slate-500">
          Showing <span className="text-slate-900 font-bold">{filtered.length}</span> activities
          {activeFarmer && <span> for <strong>{activeFarmer.fullName}</strong></span>}
        </p>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="p-5 lg:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs animate-pulse space-y-3"
            >
              <div className="flex justify-between">
                <div className="w-48 h-5 bg-slate-200 rounded" />
                <div className="w-20 h-5 bg-slate-100 rounded" />
              </div>
              <div className="w-full h-12 bg-slate-100 rounded-xl" />
              <div className="w-32 h-4 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
          No live activities found matching your filters.
        </div>
      ) : (
        /* Activity Timeline */
        <div className="space-y-4">
          {filtered.map((act) => {
            const isExpanded = expandedId === act.id;
            return (
              <div
                key={act.id}
                className={`p-5 lg:p-6 rounded-2xl bg-white border transition-all shadow-xs ${
                  isExpanded ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Top row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <Link
                        href={`/farmers/${act.farmerId}`}
                        className="text-sm font-extrabold text-slate-900 hover:text-emerald-700 hover:underline transition-colors flex items-center gap-1"
                        title="Open user profile route"
                      >
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        {act.farmerName}
                      </Link>
                      <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
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
                    <h3 className="text-base font-bold text-slate-800">{act.title}</h3>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-base font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200 block">
                      ₹{act.cost.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-1">Recorded Cost</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3 leading-relaxed">
                  &quot;{act.description}&quot;
                </p>

                {/* Photo if available */}
                {act.photoUrl && (
                  <div className="mb-3">
                    <a
                      href={act.photoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 group cursor-pointer"
                    >
                      <img
                        src={act.photoUrl}
                        alt={act.title}
                        className="w-28 h-20 object-cover rounded-xl border border-slate-200 group-hover:opacity-90 transition-opacity"
                      />
                      <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 group-hover:underline">
                        <ImageIcon className="w-3.5 h-3.5" /> View Photo
                      </span>
                    </a>
                  </div>
                )}

                {/* Inputs / Dosage Tags */}
                {(act.inputsUsed || act.dosage) && (
                  <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                    {act.inputsUsed?.map((input, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200"
                      >
                        📦 {input}
                      </span>
                    ))}
                    {act.dosage && (
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-medium border border-amber-200">
                        ⚖️ {act.dosage}
                      </span>
                    )}
                  </div>
                )}

                {/* Audio Voice Player Bar */}
                {act.hasAudio && (
                  <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/60 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={(e) => togglePlayAudio(act.id, act.audioUri, e)}
                        className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-xs"
                        title={playingId === act.id ? "Pause Audio" : "Play Voice Recording"}
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
                          {playingId === act.id ? "Playing Voice Note..." : "Original Voice Recording"}
                        </p>
                        <p className="text-[10px] text-purple-700/80">
                          {act.audioUri ? "Audio loaded from Cloud Storage" : `Duration: ${act.audioDuration} mins`}
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

                {/* Inline Expansion Area */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 bg-emerald-50/30 p-4 rounded-xl border border-emerald-100 space-y-3 text-xs mb-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      Complete Activity & Input Audit
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Farmer & Location</span>
                        <p className="font-bold text-slate-800">{act.farmerName} ({act.farmerPhone})</p>
                        <p className="text-slate-500">{act.location}</p>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Timing & Crop Details</span>
                        <p className="font-bold text-slate-800">{act.cropName} on {act.plotName}</p>
                        <p className="text-slate-500">
                          {new Date(act.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>

                    {act.voiceTranscript && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Raw Voice Transcript</span>
                        <p className="text-slate-700 italic font-mono text-[11px]">&quot;{act.voiceTranscript}&quot;</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer bar */}
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
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
                          year: "numeric"
                        })}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </span>
                    <button
                      onClick={() => toggleExpand(act.id)}
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-700 font-semibold text-xs cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-100"
                    >
                      {isExpanded ? (
                        <>
                          <span>Collapse</span>
                          <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <span>Full Audit Details</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
