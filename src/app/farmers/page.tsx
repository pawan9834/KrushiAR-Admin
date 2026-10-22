"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { DashboardShell } from "@/components/DashboardShell";
import type { Farmer } from "@/lib/mockData";
import { fetchLiveFarmers } from "@/lib/farmersService";
import {
  Users,
  Search,
  Filter,
  Phone,
  MapPin,
  Sprout,
  X,
  ChevronRight,
  Download,
  ClipboardList,
  RefreshCw,
  Loader2,
  Calendar,
  AlertCircle,
  Map as MapIcon,
  LayoutGrid,
  Layers
} from "lucide-react";

// Dynamically import the Farmland Satellite GIS Map just like Dashboard
const FarmlandCropMap = dynamic(
  () => import("@/components/FarmlandCropMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[540px] rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Loading Farmland Satellite GIS Map...</span>
        </div>
      </div>
    ),
  }
);

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCrop, setSelectedCrop] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"both" | "map" | "cards">("both");

  const loadData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const liveData = await fetchLiveFarmers();
      setFarmers(liveData);
    } catch (err) {
      console.error("Failed to load live farmers:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute available unique crops for filter buttons
  const availableCrops = useMemo(() => {
    const cropSet = new Set<string>();
    farmers.forEach((f) => {
      f.crops?.forEach((c) => {
        if (c.name && c.name.trim()) {
          cropSet.add(c.name.trim());
        }
      });
    });
    return ["ALL", ...Array.from(cropSet)];
  }, [farmers]);

  // Filter farmers
  const filtered = useMemo(() => {
    return farmers.filter((f) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        f.fullName.toLowerCase().includes(term) ||
        f.phoneNumber.includes(term) ||
        f.village.toLowerCase().includes(term) ||
        f.taluka.toLowerCase().includes(term) ||
        f.district.toLowerCase().includes(term) ||
        f.id.toLowerCase().includes(term);

      const matchesCrop =
        selectedCrop === "ALL" ||
        f.crops.some((c) => c.name.toLowerCase().includes(selectedCrop.toLowerCase()));

      return matchesSearch && matchesCrop;
    });
  }, [farmers, searchTerm, selectedCrop]);

  const handleExportCSV = () => {
    const headers = ["ID,Name,Phone,Village,Taluka,District,Total Acreage,Expenses,Activities"];
    const rows = filtered.map((f) =>
      `"${f.id}","${f.fullName}","${f.phoneNumber}","${f.village}","${f.taluka}","${f.district}",${f.totalAcreage},${f.totalExpenses},${f.activitiesCount}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `krushiar_farmers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardShell
      title="Farmers Directory & Farmland GIS"
      subtitle="Interactive satellite GIS map and live registered farmer directory with field audit trails"
    >
      {/* Top Search, Filters & View Mode Bar */}
      <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-xs mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search farmer name, phone number, village, or taluka..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Mode Toggle & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setViewMode("both")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${viewMode === "both"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
                title="Show both Map and Farmer Directory"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Map & Cards</span>
              </button>

              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${viewMode === "map"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
                title="Show GIS Map only"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Map Only</span>
              </button>

              <button
                onClick={() => setViewMode("cards")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${viewMode === "cards"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
                title="Show Directory Cards only"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards Only</span>
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing || loading}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh live farmers from Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Export */}
            <button
              onClick={handleExportCSV}
              disabled={filtered.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Chips by Crop */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Crops:
          </span>
          {availableCrops.map((crop) => (
            <button
              key={crop}
              onClick={() => setSelectedCrop(crop)}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer ${selectedCrop === crop
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              {crop === "ALL" ? "All Crops" : crop}
            </button>
          ))}
        </div>
      </div>



      {/* SECTION 2: FARMERS DIRECTORY CARDS */}
      {(viewMode === "both" || viewMode === "cards") && (
        <div>
          {/* Results Count Summary */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Registered Farmer Profiles
              </h2>
              <p className="text-xs text-slate-500">
                Live Registered Farmers:{" "}
                <span className="text-slate-900 font-bold">{filtered.length}</span>{" "}
                {filtered.length !== farmers.length && `(filtered from ${farmers.length})`}
              </p>
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs animate-pulse space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-200" />
                      <div className="space-y-1.5">
                        <div className="w-28 h-4 bg-slate-200 rounded" />
                        <div className="w-20 h-3 bg-slate-100 rounded" />
                      </div>
                    </div>
                    <div className="w-16 h-5 bg-slate-100 rounded" />
                  </div>
                  <div className="w-full h-8 bg-slate-100 rounded-xl" />
                  <div className="w-3/4 h-4 bg-slate-100 rounded" />
                  <div className="pt-3 border-t border-slate-100 flex justify-between">
                    <div className="w-20 h-3 bg-slate-100 rounded" />
                    <div className="w-16 h-3 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            /* Empty State */
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center max-w-md mx-auto my-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No farmers found</h3>
              <p className="text-xs text-slate-500">
                {searchTerm || selectedCrop !== "ALL"
                  ? "No live farmers matched your active search or crop filters. Try resetting the filters."
                  : "No live farmers have been registered yet in the Firestore database."}
              </p>
              {(searchTerm || selectedCrop !== "ALL") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCrop("ALL");
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            /* Farmers Grid / Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((farmer) => {
                return (
                  <Link
                    key={farmer.id}
                    href={`/farmers/${farmer.id}`}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-400 hover:ring-1 hover:ring-emerald-400/40 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {farmer.avatarUrl ? (
                            <img
                              src={farmer.avatarUrl}
                              alt={farmer.fullName}
                              className="w-11 h-11 rounded-2xl object-cover border border-emerald-200 group-hover:scale-105 transition-all shadow-2xs"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 font-extrabold flex items-center justify-center text-base border border-emerald-100 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs">
                              {farmer.fullName.charAt(0) || "F"}
                            </div>
                          )}
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {farmer.fullName}
                            </h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              +91 {farmer.phoneNumber}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {farmer.totalAcreage} Acres
                        </span>
                      </div>

                      {/* Location Badge */}
                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-3 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {[farmer.village, farmer.taluka, farmer.district].filter(Boolean).join(", ") || "Maharashtra"}
                        </span>
                      </div>

                      {/* Registered Crops */}
                      <div className="space-y-1.5 mb-4">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Standing Crops
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {farmer.crops && farmer.crops.length > 0 ? (
                            farmer.crops.map((c) => (
                              <span
                                key={c.id}
                                className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200"
                              >
                                {c.name} {c.areaAcre ? `(${c.areaAcre} ac)` : ""}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">No crops recorded</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Stats */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-emerald-700">
                        <ClipboardList className="w-3.5 h-3.5" />
                        {farmer.activitiesCount} Activities Logged
                      </span>
                      <span className="font-bold text-slate-800">
                        ₹{farmer.totalExpenses.toLocaleString("en-IN")} cost
                      </span>
                      <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
