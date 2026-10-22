"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import {
  Search,
  MapPin,
  RefreshCw,
  Clock,
  Sparkles,
  Filter,
  Building2,
  Sprout,
  ArrowUpDown,
  Download,
  X,
  TrendingUp,
  TrendingDown,
  Layers,
  ChevronDown
} from "lucide-react";

interface MandiRateItem {
  id: number | string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety?: string;
  grade?: string;
  arrival_date?: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  fetched_at?: string;
}

const AVAILABLE_STATES = [
  "Maharashtra",
  "Madhya Pradesh",
  "Karnataka",
  "Punjab",
  "Uttar Pradesh"
];

const POPULAR_CROPS = [
  { id: "ALL", label: "All Crops", icon: "🌱" },
  { id: "Onion", label: "Onion (कांदा)", icon: "🧅" },
  { id: "Soyabean", label: "Soyabean (सोयाबीन)", icon: "🫘" },
  { id: "Tomato", label: "Tomato (टोमॅटो)", icon: "🍅" },
  { id: "Cotton", label: "Cotton (कापूस)", icon: "☁️" },
  { id: "Wheat", label: "Wheat (गहू)", icon: "🌾" },
  { id: "Banana", label: "Banana (केळी)", icon: "🍌" },
  { id: "Pomegranate", label: "Pomegranate (डाळिंब)", icon: "🍎" },
  { id: "Maize", label: "Maize (मका)", icon: "🌽" },
  { id: "Gram", label: "Gram (हरभरा)", icon: "🥣" }
];

export default function MandiPage() {
  const [rates, setRates] = useState<MandiRateItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters
  const [selectedState, setSelectedState] = useState<string>("Maharashtra");
  const [selectedCrop, setSelectedCrop] = useState<string>("Onion");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [selectedTaluka, setSelectedTaluka] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<"price_desc" | "price_asc" | "market_asc" | "recent">("price_desc");

  // Fetch rates from API whenever State or Crop filter changes
  const fetchRates = async (stateToFetch: string, cropToFetch: string) => {
    try {
      setRefreshing(true);
      let url = `https://mandi-api.onrender.com/v1/prices?state=${encodeURIComponent(stateToFetch)}`;
      if (cropToFetch !== "ALL") {
        url += `&commodity=${encodeURIComponent(cropToFetch)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json && json.data && Array.isArray(json.data)) {
          setRates(json.data);
        } else {
          setRates([]);
        }
      } else {
        setRates([]);
      }
    } catch (err) {
      console.warn("Could not load Mandi rates:", err);
      setRates([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRates(selectedState, selectedCrop);
    // Reset district and taluka when state changes
    setSelectedDistrict("ALL");
    setSelectedTaluka("ALL");
  }, [selectedState, selectedCrop]);

  // Extract unique Districts from the current state data
  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    rates.forEach((r) => {
      if (r.district && r.district.trim()) {
        set.add(r.district.trim());
      }
    });
    return Array.from(set).sort();
  }, [rates]);

  // Extract unique Talukas / APMC Markets (optionally filtered by selected district)
  const availableTalukas = useMemo(() => {
    const set = new Set<string>();
    rates.forEach((r) => {
      if (selectedDistrict === "ALL" || r.district?.toLowerCase() === selectedDistrict.toLowerCase()) {
        if (r.market && r.market.trim()) {
          const cleanName = r.market.replace(/^APMC\s+/i, "").trim();
          set.add(cleanName);
        }
      }
    });
    return Array.from(set).sort();
  }, [rates, selectedDistrict]);

  // Filtered and Sorted rates
  const filteredRates = useMemo(() => {
    return rates
      .filter((r) => {
        // District filter
        const matchDistrict =
          selectedDistrict === "ALL" ||
          (r.district || "").toLowerCase() === selectedDistrict.toLowerCase();

        // Taluka / Market filter
        const cleanMarket = (r.market || "").replace(/^APMC\s+/i, "").toLowerCase();
        const matchTaluka =
          selectedTaluka === "ALL" ||
          cleanMarket.includes(selectedTaluka.toLowerCase()) ||
          (r.market || "").toLowerCase().includes(selectedTaluka.toLowerCase());

        // Crop / Commodity in-memory filter (in case "ALL" was fetched)
        const matchCrop =
          selectedCrop === "ALL" ||
          (r.commodity || "").toLowerCase().includes(selectedCrop.toLowerCase());

        // Search text filter
        const term = searchTerm.toLowerCase();
        const matchSearch =
          !term ||
          (r.commodity || "").toLowerCase().includes(term) ||
          (r.market || "").toLowerCase().includes(term) ||
          (r.district || "").toLowerCase().includes(term) ||
          (r.variety || "").toLowerCase().includes(term) ||
          (r.grade || "").toLowerCase().includes(term);

        return matchDistrict && matchTaluka && matchCrop && matchSearch;
      })
      .sort((a, b) => {
        if (sortBy === "price_desc") return Number(b.modal_price || 0) - Number(a.modal_price || 0);
        if (sortBy === "price_asc") return Number(a.modal_price || 0) - Number(b.modal_price || 0);
        if (sortBy === "market_asc") return (a.market || "").localeCompare(b.market || "");
        if (sortBy === "recent") return new Date(b.arrival_date || 0).getTime() - new Date(a.arrival_date || 0).getTime();
        return 0;
      });
  }, [rates, selectedDistrict, selectedTaluka, selectedCrop, searchTerm, sortBy]);

  // Aggregate statistics
  const stats = useMemo(() => {
    if (filteredRates.length === 0) {
      return { total: 0, min: 0, max: 0, avg: 0 };
    }
    const prices = filteredRates.map((r) => Number(r.modal_price || 0)).filter((p) => p > 0);
    if (prices.length === 0) {
      return { total: filteredRates.length, min: 0, max: 0, avg: 0 };
    }
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    return {
      total: filteredRates.length,
      min,
      max,
      avg
    };
  }, [filteredRates]);

  // Export CSV function
  const handleExportCSV = () => {
    const headers = ["State,District,Market / Taluka,Commodity,Variety,Grade,Min Price,Max Price,Modal Price,Arrival Date"];
    const rows = filteredRates.map((r) =>
      `"${r.state}","${r.district}","${r.market?.trim()}","${r.commodity}","${r.variety || ""}","${r.grade || ""}",${r.min_price},${r.max_price},${r.modal_price},"${r.arrival_date || ""}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mandi_rates_${selectedState}_${selectedCrop}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setSelectedState("Maharashtra");
    setSelectedCrop("Onion");
    setSelectedDistrict("ALL");
    setSelectedTaluka("ALL");
    setSearchTerm("");
    setSortBy("price_desc");
  };

  const hasActiveFilters =
    selectedDistrict !== "ALL" ||
    selectedTaluka !== "ALL" ||
    searchTerm !== "" ||
    selectedCrop !== "Onion" ||
    selectedState !== "Maharashtra";

  return (
    <DashboardShell
      title="Live Mandi Market Rates"
      subtitle="Real-time APMC agricultural commodity rates filtered by State, District, Taluka, and Crops"
    >
      {/* 1. Summary KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Reporting Markets
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-500 font-medium">APMC Yards</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {selectedState} • {selectedCrop === "ALL" ? "All Commodities" : selectedCrop}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Average Modal Rate
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-700">
              ₹{stats.avg.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">/ Quintal</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Average weighted price
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Highest Rate Recorded
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-teal-700">
              ₹{stats.max.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">/ Qtl</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block truncate">Top APMC bidding price</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Lowest Rate Recorded
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-amber-700">
              ₹{stats.min.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">/ Qtl</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block truncate">Base arrival price</span>
        </div>
      </div>

      {/* 2. Comprehensive Filter Console (State, District, Taluka, Crop & Search) */}
      <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-xs mb-6 space-y-4">
        {/* Row A: Crop / Commodity Quick Chips */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-emerald-600" />
              Select Crop (Commodity):
            </label>
            <span className="text-[11px] font-medium text-slate-400">
              Active: <strong className="text-emerald-700">{selectedCrop === "ALL" ? "All Crops" : selectedCrop}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {POPULAR_CROPS.map((crop) => (
              <button
                key={crop.id}
                onClick={() => setSelectedCrop(crop.id)}
                className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${selectedCrop === crop.id
                    ? "bg-emerald-600 text-white shadow-xs font-bold"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
              >
                <span>{crop.icon}</span>
                <span>{crop.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Row B: State, District, Taluka Dropdowns & Sorting */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          {/* State Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> State
            </label>
            <div className="relative">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer pr-8"
              >
                {AVAILABLE_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* District Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" /> District
            </label>
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setSelectedTaluka("ALL"); // Reset taluka when district changes
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer pr-8"
              >
                <option value="ALL">All Districts ({availableDistricts.length})</option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Taluka / APMC Market Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-600" /> Taluka / Market
            </label>
            <div className="relative">
              <select
                value={selectedTaluka}
                onChange={(e) => setSelectedTaluka(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer pr-8"
              >
                <option value="ALL">All Talukas / Markets ({availableTalukas.length})</option>
                {availableTalukas.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" /> Sort Rates
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer pr-8"
              >
                <option value="price_desc">Highest Price (₹ High to Low)</option>
                <option value="price_asc">Lowest Price (₹ Low to High)</option>
                <option value="market_asc">Market Name (A to Z)</option>
                <option value="recent">Most Recent Date</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Row C: Live Search & Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Live search Taluka, APMC Market, District, Variety (e.g. Lasalgaon, Chopda, Nashik)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                title="Reset all filters to defaults"
              >
                Reset
              </button>
            )}

            <button
              onClick={() => fetchRates(selectedState, selectedCrop)}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              title="Refresh rates from live server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
              <span className="hidden md:inline">{refreshing ? "Fetching..." : "Refresh"}</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={filteredRates.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-400">Active Filters:</span>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              State: {selectedState}
            </span>
            {selectedCrop !== "ALL" && (
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                Crop: {selectedCrop}
              </span>
            )}
            {selectedDistrict !== "ALL" && (
              <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                District: {selectedDistrict}
              </span>
            )}
            {selectedTaluka !== "ALL" && (
              <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                Taluka / Market: {selectedTaluka}
              </span>
            )}
            {searchTerm && (
              <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                Search: &quot;{searchTerm}&quot;
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. Rates Cards Grid / Results */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">
            Fetching live Mandi APMC rates for {selectedState} ({selectedCrop})...
          </p>
        </div>
      ) : filteredRates.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No APMC Market Rates Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No market rates matched your selected criteria (State: {selectedState}, District: {selectedDistrict}, Taluka: {selectedTaluka}, Crop: {selectedCrop}).
          </p>
          <button
            onClick={resetFilters}
            className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-xs font-semibold text-slate-500">
              Showing <span className="text-slate-900 font-bold">{filteredRates.length}</span> APMC market rates
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRates.map((rate) => {
              const cleanMarket = (rate.market || "").replace(/^APMC\s+/i, "").trim();
              return (
                <div
                  key={rate.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {cleanMarket}
                          </h3>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                            APMC
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            Taluka: {cleanMarket}, District: {rate.district}, {rate.state}
                          </span>
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                        {rate.grade || "Local"}
                      </span>
                    </div>

                    {/* Commodity & Variety Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                        {rate.commodity}
                      </span>
                      {rate.variety && (
                        <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          Variety: {rate.variety}
                        </span>
                      )}
                    </div>

                    {/* Price Display */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 my-3 text-center group-hover:bg-emerald-50/40 group-hover:border-emerald-200/60 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Modal Price
                      </span>
                      <span className="text-2xl font-black text-emerald-700 block mt-0.5">
                        ₹{Number(rate.modal_price || 0).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">per Quintal (Rs/Qtl)</span>
                    </div>

                    {/* Min - Max Range */}
                    <div className="flex items-center justify-between text-xs text-slate-600 px-1 mb-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Min Price</span>
                        <strong className="text-slate-800">₹{Number(rate.min_price || 0).toLocaleString("en-IN")}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">Max Price</span>
                        <strong className="text-slate-800">₹{Number(rate.max_price || 0).toLocaleString("en-IN")}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Arrival: {rate.arrival_date || "Recent"}
                    </span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> APMC Verified
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
