"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { INITIAL_SEEDS, SeedItem } from "@/lib/mockData";
import {
  ArrowLeft,
  Sprout,
  User,
  Phone,
  MapPin,
  Calendar,
  Layers,
  Award,
  Clock,
  Sparkles,
  ExternalLink,
  Search,
  CheckCircle2,
  Filter
} from "lucide-react";

export function SeedDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const { id: seedId } = use(params);
  const seed = INITIAL_SEEDS.find((s) => s.id === seedId);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  if (!seed) {
    return (
      <DashboardShell title="Seed Variety Not Found">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md mx-auto my-12">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Seed Variety Not Found</h2>
          <p className="text-xs text-slate-500 mb-6">
            The requested seed variety ID &quot;{seedId}&quot; does not exist in the database.
          </p>
          <Link
            href="/seeds"
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Seeds Directory</span>
          </Link>
        </div>
      </DashboardShell>
    );
  }

  // Filter farmers using this seed
  const filteredUsers = seed.users.filter((u) => {
    const matchesSearch =
      u.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.plotName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "ALL" || u.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardShell
      title={`Seed Variety: ${seed.varietyName}`}
      subtitle={`Complete agronomic specifications and list of farmers cultivating this variety`}
    >
      {/* Back to seeds directory button */}
      <div className="mb-5">
        <Link
          href="/seeds"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Seeds Directory</span>
        </Link>
      </div>

      {/* 1. Variety Specification Hero Banner */}
      <div className="p-6 lg:p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white border border-emerald-800/40 shadow-lg mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-2xl shadow-xl shadow-emerald-950 border border-emerald-400/30 shrink-0">
              <Sprout className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <h2 className="text-xl lg:text-2xl font-extrabold text-white">{seed.varietyName}</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  {seed.cropName}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {seed.seedType}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                  {seed.category}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Breeding Institute / Company: <strong className="text-white">{seed.companyOrInstitute}</strong>
              </p>
            </div>
          </div>

          <div className="text-left lg:text-right shrink-0">
            <span className="text-2xl font-black text-emerald-400 block">
              {seed.totalAcreage} Acres
            </span>
            <span className="text-xs text-slate-400 block mt-0.5 font-medium">
              Cultivated across {seed.users.length} active plots
            </span>
          </div>
        </div>

        {/* Agronomic Specifications Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recommended Seed Rate</span>
            <strong className="text-white text-sm mt-0.5 block">{seed.seedRate}</strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Crop Maturity Duration</span>
            <strong className="text-white text-sm mt-0.5 block">{seed.durationDays}</strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Key Agronomic Features</span>
            <strong className="text-emerald-300 mt-0.5 block">{seed.features}</strong>
          </div>
        </div>
      </div>

      {/* 2. Farmers List Header & Filter */}
      <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-xs mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search farmers sowing this seed by name, village, or plot..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <span className="text-slate-400 font-semibold mr-1 shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Stage:
            </span>
            {["ALL", "growing", "flowering", "harvesting"].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer ${
                  selectedStatus === st
                    ? "bg-emerald-600 text-white shadow-xs font-bold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st === "ALL" ? "All Stages" : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. List of Farmers Cultivating This Seed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <User className="w-4 h-4 text-emerald-600" />
            Farmers Cultivating {seed.varietyName} ({filteredUsers.length})
          </h3>
          <span className="text-xs text-slate-400">Click any farmer to open their complete audit page</span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
            No farmers found matching the search criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.map((user, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top: Farmer Name, ID & Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 font-extrabold flex items-center justify-center text-base border border-emerald-100 shadow-2xs">
                        {user.farmerName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/farmers/${user.farmerId}`}
                            className="text-sm font-bold text-slate-900 hover:text-emerald-700 hover:underline flex items-center gap-1"
                          >
                            <span>{user.farmerName}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          </Link>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          +91 {user.farmerPhone}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                      {user.status}
                    </span>
                  </div>

                  {/* Location & Soil */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{user.village}, {user.district}</span>
                    <span>•</span>
                    <span className="text-slate-600 font-medium">Soil: {user.soilType}</span>
                  </div>

                  {/* Plot and Acreage Details */}
                  <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Allocated Plot</span>
                      <strong className="text-slate-800">{user.plotName}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Land Sown</span>
                      <strong className="text-emerald-700 font-extrabold">{user.areaAcre} Acres</strong>
                    </div>
                  </div>
                </div>

                {/* Footer: Sowing Date & Direct Link */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Sown on: <strong>{user.sowingDate}</strong>
                  </span>

                  <Link
                    href={`/farmers/${user.farmerId}`}
                    className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
                  >
                    <span>Inspect User Audit</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
