"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { INITIAL_SEEDS, SeedItem } from "@/lib/mockData";
import {
  Sprout,
  Search,
  Filter,
  User,
  MapPin,
  Calendar,
  Layers,
  Award,
  Sparkles,
  ChevronRight,
  ExternalLink,
  X,
  ArrowRight
} from "lucide-react";

export default function SeedsPage() {
  const [seeds, setSeeds] = useState<SeedItem[]>(INITIAL_SEEDS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const filtered = seeds.filter((seed) => {
    const matchesSearch =
      seed.varietyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seed.cropName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seed.companyOrInstitute.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seed.features.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seed.users.some(
        (u) =>
          u.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.district.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "ALL" || seed.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalVarieties = seeds.length;
  const totalSownAcreage = seeds.reduce((acc, s) => acc + s.totalAcreage, 0);
  const totalPlantedFarms = seeds.reduce((acc, s) => acc + s.users.length, 0);

  return (
    <DashboardShell
      title="Seeds & Crop Varieties Tracker"
      subtitle="Track seed varieties, certified hybrids, and field planting usage across farmers' land"
    >
      {/* 1. KPI Top Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 mb-6">
        <div className="p-4 lg:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Seed Varieties
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Sprout className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl lg:text-3xl font-extrabold text-slate-900">
            {totalVarieties}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Across 10 crop species</p>
        </div>

        <div className="p-4 lg:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Sown Area
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-900">
              {totalSownAcreage.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-semibold">Acres</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Verified on farm plots</p>
        </div>

        <div className="p-4 lg:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Planted Plots
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl lg:text-3xl font-extrabold text-slate-900">
            {totalPlantedFarms}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Monitored in diaries</p>
        </div>

        <div className="p-4 lg:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Breeding Source
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <span className="text-sm font-extrabold text-slate-900 block mt-1">
            University & Hybrids
          </span>
          <p className="text-[11px] text-slate-400 mt-1">MPKV, Bayer, VSI, ICAR, Rasi</p>
        </div>
      </div>

      {/* 2. Search & Category Filters */}
      <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-xs mb-6 space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search seed variety (e.g. Phule Samarth, Abhinav, JS 335), company, or farmer name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Chips by Crop Category */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          {["ALL", "Vegetables", "Fruits", "Cash Crops", "Oilseeds", "Cereals"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-xs font-semibold text-slate-500">
          Showing <span className="text-slate-900 font-bold">{filtered.length}</span> seed varieties (Click any card to open dedicated variety route)
        </p>
      </div>

      {/* 3. Seeds & Variety Cards - Linking to /seeds/[id] */}
      <div className="space-y-5">
        {filtered.map((seed) => (
          <div
            key={seed.id}
            className="p-5 lg:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all space-y-4"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {seed.cropName}
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {seed.category}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                    {seed.seedType}
                  </span>
                </div>
                <Link
                  href={`/seeds/${seed.id}`}
                  className="text-lg font-extrabold text-slate-900 hover:text-emerald-700 hover:underline flex items-center gap-1.5 transition-colors"
                >
                  <span>{seed.varietyName}</span>
                  <ArrowRight className="w-4 h-4 text-emerald-600" />
                </Link>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Developed / Produced by: <strong className="text-slate-700">{seed.companyOrInstitute}</strong>
                </p>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                <span className="text-lg font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 block">
                  {seed.totalAcreage} Acres
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">Total Sown Area</span>
              </div>
            </div>

            {/* Agronomic Specifications Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Recommended Seed Rate</span>
                <strong className="text-slate-800 mt-0.5 block">{seed.seedRate}</strong>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Maturity Duration</span>
                <strong className="text-slate-800 mt-0.5 block">{seed.durationDays}</strong>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Key Features</span>
                <strong className="text-slate-800 mt-0.5 block">{seed.features}</strong>
              </div>
            </div>

            {/* Farmers Using This Seed Preview & Direct Route Link */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Cultivated by <strong>{seed.users.length} farmers</strong>:{" "}
                  {seed.users.map((u) => u.farmerName).join(", ")}
                </span>
              </div>

              <Link
                href={`/seeds/${seed.id}`}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                <span>View Farmers Using This Variety</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
