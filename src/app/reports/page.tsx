"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { DashboardShell } from "@/components/DashboardShell";
import {
  INITIAL_SEEDS,
  Farmer,
  FarmActivity,
  SeedItem,
  MandiRate,
} from "@/lib/mockData";
import { fetchLiveAllActivities } from "@/lib/farmersService";
import { useAuth } from "@/context/AuthContext";
import {
  FileSpreadsheet,
  Printer,
  Filter,
  Search,
  Users,
  Sprout,
  ClipboardList,
  TrendingUp,
  FileText,
  Sparkles,
  RefreshCw,
  Map as MapIcon,
  Layers,
  LayoutGrid,
  Download,
  X,
} from "lucide-react";

// Dynamically import Farmland Satellite GIS Map
const FarmlandCropMap = dynamic(
  () => import("@/components/FarmlandCropMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[520px] rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Loading Farmland Satellite GIS Map...</span>
        </div>
      </div>
    ),
  }
);

type ReportType = "farmers" | "crops" | "activities" | "seeds" | "mandi";

interface FlattenedCropRow {
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  district: string;
  taluka: string;
  cropName: string;
  variety: string;
  plotName: string;
  areaAcre: number;
  sowingDate: string;
  status: string;
}

export default function ReportsPage() {
  const { adminUser } = useAuth();
  const [selectedReport, setSelectedReport] = useState<ReportType>("farmers");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [reportDateStr, setReportDateStr] = useState<string>("16 Oct 2026");

  // View mode toggle for Map & Report
  const [viewMode, setViewMode] = useState<"both" | "map" | "table">("both");

  // Live data states
  const [liveFarmers, setLiveFarmers] = useState<Farmer[]>([]);
  const [liveActivities, setLiveActivities] = useState<FarmActivity[]>([]);
  const [liveMandi, setLiveMandi] = useState<MandiRate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Set report date string
  useEffect(() => {
    setReportDateStr(
      new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    );
  }, []);

  // Fetch live farmers & activities from Firestore, and live Mandi rates from /api/mandi
  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // 1. Fetch live farmers & activities from Firestore
      const { farmers, activities } = await fetchLiveAllActivities();
      setLiveFarmers(farmers || []);
      setLiveActivities(activities || []);

      // 2. Fetch live Mandi rates from official data.gov.in API route
      try {
        const mandiRes = await fetch("/api/mandi?state=Maharashtra&limit=80");
        if (mandiRes.ok) {
          const json = await mandiRes.json();
          if (json && json.records && Array.isArray(json.records)) {
            const mappedMandi: MandiRate[] = json.records.map((r: any, idx: number) => ({
              id: r.id || `mandi_${idx}`,
              commodity: r.commodity || "Commodity",
              market: r.market || "APMC",
              district: r.district || "Maharashtra",
              minPrice: Number(r.min_price || 0),
              maxPrice: Number(r.max_price || 0),
              modalPrice: Number(r.modal_price || 0),
              unit: "Quintal",
              trend: "stable" as const,
              updatedAt: r.arrival_date || "Today",
            }));
            setLiveMandi(mappedMandi);
          }
        }
      } catch (err) {
        console.warn("Could not load live Mandi rates for reports:", err);
      }
    } catch (err) {
      console.error("Error loading live data for reports:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Distilled districts list from live farmers
  const districts = useMemo(() => {
    const list = new Set<string>();
    liveFarmers.forEach((f: Farmer) => {
      if (f.district && f.district.trim()) list.add(f.district.trim());
    });
    // Add default agricultural districts of Maharashtra
    ["Nashik", "Jalgaon", "Pune", "Ahmednagar", "Solapur", "Dhule", "Kolhapur", "Sangli", "Latur", "Nagpur"].forEach((d) => list.add(d));
    return Array.from(list).sort();
  }, [liveFarmers]);

  // Filtered Farmers
  const filteredFarmers = useMemo(() => {
    return liveFarmers.filter((f: Farmer) => {
      const matchDistrict =
        districtFilter === "all" ||
        (f.district || "").toLowerCase() === districtFilter.toLowerCase();
      const term = searchQuery.toLowerCase();
      const matchSearch =
        !term ||
        (f.fullName || "").toLowerCase().includes(term) ||
        (f.phoneNumber || "").includes(term) ||
        (f.village || "").toLowerCase().includes(term) ||
        (f.taluka || "").toLowerCase().includes(term);
      return matchDistrict && matchSearch;
    });
  }, [liveFarmers, districtFilter, searchQuery]);

  // Filtered Crops Flattened from live farmers
  const filteredCrops = useMemo(() => {
    const rows: FlattenedCropRow[] = [];

    liveFarmers.forEach((farmer: Farmer) => {
      const matchDistrict =
        districtFilter === "all" ||
        (farmer.district || "").toLowerCase() === districtFilter.toLowerCase();
      if (!matchDistrict) return;

      (farmer.crops || []).forEach((crop) => {
        const term = searchQuery.toLowerCase();
        const matchSearch =
          !term ||
          (farmer.fullName || "").toLowerCase().includes(term) ||
          (crop.name || "").toLowerCase().includes(term) ||
          (crop.variety || "").toLowerCase().includes(term);

        if (matchSearch) {
          rows.push({
            farmerId: farmer.id,
            farmerName: farmer.fullName,
            farmerPhone: farmer.phoneNumber,
            district: farmer.district,
            taluka: farmer.taluka,
            cropName: crop.name,
            variety: crop.variety,
            plotName: crop.plotName,
            areaAcre: crop.areaAcre,
            sowingDate: crop.sowingDate,
            status: crop.status,
          });
        }
      });
    });

    return rows;
  }, [liveFarmers, districtFilter, searchQuery]);

  // Filtered Activities from live data
  const filteredActivities = useMemo(() => {
    return liveActivities.filter((act: FarmActivity) => {
      const farmer = liveFarmers.find((f: Farmer) => f.id === act.farmerId);
      const farmerDistrict = farmer?.district || "";
      const matchDistrict =
        districtFilter === "all" ||
        farmerDistrict.toLowerCase() === districtFilter.toLowerCase();
      const term = searchQuery.toLowerCase();
      const matchSearch =
        !term ||
        (act.farmerName || "").toLowerCase().includes(term) ||
        (act.cropName || "").toLowerCase().includes(term) ||
        (act.title || "").toLowerCase().includes(term) ||
        (act.activityType || "").toLowerCase().includes(term);
      return matchDistrict && matchSearch;
    });
  }, [liveActivities, liveFarmers, districtFilter, searchQuery]);

  // Filtered Seeds
  const filteredSeeds = useMemo(() => {
    return INITIAL_SEEDS.filter((s: SeedItem) => {
      const term = searchQuery.toLowerCase();
      return (
        !term ||
        (s.varietyName || "").toLowerCase().includes(term) ||
        (s.cropName || "").toLowerCase().includes(term) ||
        (s.companyOrInstitute || "").toLowerCase().includes(term)
      );
    });
  }, [searchQuery]);

  // Filtered Mandi from live APMC records
  const filteredMandi = useMemo(() => {
    return liveMandi.filter((m: MandiRate) => {
      const matchDistrict =
        districtFilter === "all" ||
        (m.district || "").toLowerCase() === districtFilter.toLowerCase();
      const term = searchQuery.toLowerCase();
      const matchSearch =
        !term ||
        (m.commodity || "").toLowerCase().includes(term) ||
        (m.market || "").toLowerCase().includes(term);
      return matchDistrict && matchSearch;
    });
  }, [liveMandi, districtFilter, searchQuery]);

  // Generate Excel (.CSV with UTF-8 BOM)
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      let headers: string[] = [];
      let rows: (string | number)[][] = [];
      const filename = `KrushiAR_${selectedReport}_Report_${new Date().toISOString().slice(0, 10)}.csv`;

      if (selectedReport === "farmers") {
        headers = [
          "Farmer ID",
          "Full Name",
          "Mobile Number",
          "District",
          "Taluka",
          "Village",
          "Total Acreage",
          "Plots Count",
          "Active Crops",
          "Total Recorded Expenses (INR)",
          "Registered Date",
        ];
        rows = filteredFarmers.map((f: Farmer) => [
          f.id,
          f.fullName,
          f.phoneNumber,
          f.district,
          f.taluka,
          f.village,
          f.totalAcreage,
          (f.plots || []).length,
          (f.crops || []).map((c) => `${c.name} (${c.variety})`).join("; "),
          f.totalExpenses,
          f.registeredAt,
        ]);
      } else if (selectedReport === "crops") {
        headers = [
          "Farmer Name",
          "Phone Number",
          "District",
          "Taluka",
          "Crop Name",
          "Variety",
          "Plot Name",
          "Sown Area (Acres)",
          "Sowing Date",
          "Crop Stage",
        ];
        rows = filteredCrops.map((c: FlattenedCropRow) => [
          c.farmerName,
          c.farmerPhone,
          c.district,
          c.taluka,
          c.cropName,
          c.variety,
          c.plotName,
          c.areaAcre,
          c.sowingDate,
          c.status.toUpperCase(),
        ]);
      } else if (selectedReport === "activities") {
        headers = [
          "Activity ID",
          "Date",
          "Farmer Name",
          "Crop Name",
          "Plot Name",
          "Activity Type",
          "Title",
          "Cost (INR)",
          "Inputs Used",
          "Dosage",
          "Location",
        ];
        rows = filteredActivities.map((a: FarmActivity) => [
          a.id,
          a.date,
          a.farmerName,
          a.cropName,
          a.plotName,
          a.activityType.toUpperCase(),
          a.title,
          a.cost,
          (a.inputsUsed || []).join("; "),
          a.dosage || "N/A",
          a.location,
        ]);
      } else if (selectedReport === "seeds") {
        headers = [
          "Seed ID",
          "Crop Name",
          "Variety Name",
          "Breeder / Institute",
          "Seed Type",
          "Maturity Duration",
          "Seed Rate",
          "Total Sown Acreage",
          "Registered Farmers Count",
          "Distinct Features",
        ];
        rows = filteredSeeds.map((s: SeedItem) => [
          s.id,
          s.cropName,
          s.varietyName,
          s.companyOrInstitute,
          s.seedType,
          s.durationDays,
          s.seedRate,
          s.totalAcreage,
          s.farmersCount,
          s.features,
        ]);
      } else if (selectedReport === "mandi") {
        headers = [
          "Record ID",
          "Commodity",
          "Market / APMC",
          "District",
          "Unit",
          "Min Price (INR)",
          "Max Price (INR)",
          "Modal Price (INR)",
          "Daily Trend",
          "Updated On",
        ];
        rows = filteredMandi.map((m: MandiRate) => [
          m.id,
          m.commodity,
          m.market,
          m.district,
          m.unit,
          m.minPrice,
          m.maxPrice,
          m.modalPrice,
          m.trend.toUpperCase(),
          m.updatedAt,
        ]);
      }

      // Convert to CSV string with UTF-8 BOM so Excel opens it with zero encoding distortion
      const csvContent =
        "\uFEFF" +
        [
          headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
          ...rows.map((row) =>
            row.map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(",")
          ),
        ].join("\r\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export Excel report. Please try again.");
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  // Trigger Print / PDF Export
  const handlePrintPDF = () => {
    window.print();
  };

  // Report metadata calculations
  const reportStats = useMemo(() => {
    if (selectedReport === "farmers") {
      const totalAcres = filteredFarmers.reduce((acc: number, f: Farmer) => acc + (f.totalAcreage || 0), 0);
      const totalPlots = filteredFarmers.reduce((acc: number, f: Farmer) => acc + (f.plots || []).length, 0);
      const avgHolding = filteredFarmers.length > 0 ? (totalAcres / filteredFarmers.length).toFixed(1) : "0";
      return [
        { label: "Total Farmers", value: filteredFarmers.length, desc: "Live registered farmers" },
        { label: "Total Land Holding", value: `${totalAcres.toFixed(1)} Acres`, desc: "Cultivated & uncultivated" },
        { label: "Average Farm Size", value: `${avgHolding} Acres`, desc: "Per farmer average" },
        { label: "Active Geo-Plots", value: totalPlots, desc: "Surveyed farmland plots" },
      ];
    } else if (selectedReport === "crops") {
      const totalAcres = filteredCrops.reduce((acc: number, c: FlattenedCropRow) => acc + (c.areaAcre || 0), 0);
      const cropsCount = new Set(filteredCrops.map((c: FlattenedCropRow) => c.cropName)).size;
      return [
        { label: "Active Plantings", value: filteredCrops.length, desc: "Individual crop plots" },
        { label: "Total Sown Acreage", value: `${totalAcres.toFixed(1)} Acres`, desc: "Current season" },
        { label: "Crops Represented", value: cropsCount, desc: "Distinct crop types" },
        { label: "Top Region", value: districtFilter === "all" ? "Statewide" : districtFilter, desc: "Active focus" },
      ];
    } else if (selectedReport === "activities") {
      const totalCost = filteredActivities.reduce((acc: number, a: FarmActivity) => acc + (a.cost || 0), 0);
      return [
        { label: "Total Logged Actions", value: filteredActivities.length, desc: "Field diary entries" },
        { label: "Total Recorded Cost", value: `₹${totalCost.toLocaleString("en-IN")}`, desc: "Inputs & farm labor" },
        { label: "Avg Cost / Activity", value: filteredActivities.length ? `₹${Math.round(totalCost / filteredActivities.length).toLocaleString("en-IN")}` : "₹0", desc: "Per operation average" },
        { label: "Active Farmers", value: new Set(filteredActivities.map((a: FarmActivity) => a.farmerId)).size, desc: "Submitting logs" },
      ];
    } else if (selectedReport === "seeds") {
      const totalAcreage = filteredSeeds.reduce((acc: number, s: SeedItem) => acc + s.totalAcreage, 0);
      const totalFarmers = filteredSeeds.reduce((acc: number, s: SeedItem) => acc + s.farmersCount, 0);
      return [
        { label: "Seed Varieties", value: filteredSeeds.length, desc: "Cataloged hybrids & varieties" },
        { label: "Total Adoption Acres", value: `${totalAcreage.toLocaleString()} Ac`, desc: "Cultivated acreage" },
        { label: "Total Farmers Using", value: totalFarmers, desc: "Active adoption count" },
        { label: "Avg Maturity", value: "128 Days", desc: "Mean lifecycle length" },
      ];
    } else {
      const avgPrice = filteredMandi.length ? Math.round(filteredMandi.reduce((acc: number, m: MandiRate) => acc + m.modalPrice, 0) / filteredMandi.length) : 0;
      return [
        { label: "Tracked Commodities", value: filteredMandi.length, desc: "Live APMC Mandi rates" },
        { label: "Average Modal Rate", value: `₹${avgPrice.toLocaleString("en-IN")} / Qtl`, desc: "Statewide benchmark" },
        { label: "Active APMC Mandis", value: new Set(filteredMandi.map((m: MandiRate) => m.market)).size, desc: "Reporting trading yards" },
        { label: "Districts Covered", value: new Set(filteredMandi.map((m: MandiRate) => m.district)).size, desc: "Geographic spread" },
      ];
    }
  }, [selectedReport, filteredFarmers, filteredCrops, filteredActivities, filteredSeeds, filteredMandi, districtFilter]);

  const reportTitles: Record<ReportType, string> = {
    farmers: "Farmer Census & Land Holding Register",
    crops: "Crop Sowing & Acreage Distribution Report",
    activities: "Field Operations & Expense Audit Statement",
    seeds: "Seed Varieties & Agronomic Adoption Audit",
    mandi: "APMC Mandi Market Price Intelligence Report",
  };

  return (
    <DashboardShell
      title="Reports & Data Export"
      subtitle="One-click generation of official PDF documents and Excel spreadsheets for agricultural audits"
    >
      {/* =========================================================================
          PRINT-ONLY OFFICIAL EXECUTIVE DOCUMENT (Shown ONLY when printing to PDF)
      ========================================================================= */}
      <div className="print-only text-slate-900 bg-white pl-2 pr-4 py-2">
        {/* Official Header */}
        <div className="border-b-2 border-emerald-800 pb-3 mb-3 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-800 flex items-center justify-center text-white font-extrabold text-lg">
              🌾
            </div>
            <div>
              <h1 className="text-lg font-bold uppercase tracking-tight text-emerald-950">
                KrushiAR Agricultural Intelligence Portal
              </h1>
              <p className="text-[11px] text-slate-600 font-medium">
                Official Agricultural Land, Crop & Activity Audit Document
              </p>
              <p className="text-[9px] text-slate-500">
                Government of Maharashtra & Digital Agriculture Mission Partner Framework
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p className="font-bold text-slate-900">REF: KR-REP-2026-0942</p>
            <p>Generated: {reportDateStr}</p>
            <p>Admin Officer: {adminUser?.name || "System Administrator"}</p>
          </div>
        </div>

        {/* Report Title */}
        <div className="mb-3">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
            {reportTitles[selectedReport]}
          </h2>
          <div className="flex gap-4 text-[11px] text-slate-600 mt-0.5">
            <span><strong>Scope:</strong> {districtFilter === "all" ? "Statewide (All Districts)" : `District: ${districtFilter}`}</span>
            <span><strong>Total Records:</strong> {
              selectedReport === "farmers" ? filteredFarmers.length :
                selectedReport === "crops" ? filteredCrops.length :
                  selectedReport === "activities" ? filteredActivities.length :
                    selectedReport === "seeds" ? filteredSeeds.length : filteredMandi.length
            }</span>
            <span><strong>Status:</strong> Verified Live Telemetry</span>
          </div>
        </div>

        {/* KPI Summary Block for Print */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {reportStats.map((stat, i) => (
            <div key={i} className="border border-slate-300 p-1.5 rounded bg-slate-50">
              <p className="text-[9px] uppercase font-bold text-slate-500">{stat.label}</p>
              <p className="text-xs font-extrabold text-emerald-900">{stat.value}</p>
              <p className="text-[8px] text-slate-500">{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* Printable Data Table */}
        <div className="mb-4">
          <table className="w-full text-xs">
            <thead>
              {selectedReport === "farmers" && (
                <tr>
                  <th style={{ width: "26px" }} className="text-center">#</th>
                  <th>Farmer Name</th>
                  <th>Contact</th>
                  <th>District</th>
                  <th>Village / Taluka</th>
                  <th className="text-right">Acreage</th>
                  <th>Active Crops</th>
                  <th className="text-right">Expenses (₹)</th>
                </tr>
              )}
              {selectedReport === "crops" && (
                <tr>
                  <th style={{ width: "26px" }} className="text-center">#</th>
                  <th>Farmer Name</th>
                  <th>District</th>
                  <th>Crop</th>
                  <th>Variety</th>
                  <th>Plot</th>
                  <th className="text-right">Area (Acres)</th>
                  <th>Sowing Date</th>
                  <th>Stage</th>
                </tr>
              )}
              {selectedReport === "activities" && (
                <tr>
                  <th style={{ width: "26px" }} className="text-center">#</th>
                  <th>Date</th>
                  <th>Farmer</th>
                  <th>Crop</th>
                  <th>Activity Type</th>
                  <th>Operation Title</th>
                  <th>Inputs / Dosage</th>
                  <th className="text-right">Cost (₹)</th>
                </tr>
              )}
              {selectedReport === "seeds" && (
                <tr>
                  <th style={{ width: "26px" }} className="text-center">#</th>
                  <th>Crop</th>
                  <th>Variety Name</th>
                  <th>Breeder / Brand</th>
                  <th>Duration</th>
                  <th>Seed Rate</th>
                  <th className="text-right">Acreage</th>
                  <th className="text-right">Farmers</th>
                </tr>
              )}
              {selectedReport === "mandi" && (
                <tr>
                  <th style={{ width: "26px" }} className="text-center">#</th>
                  <th>Commodity</th>
                  <th>Market APMC</th>
                  <th>District</th>
                  <th className="text-right">Min (₹/Qtl)</th>
                  <th className="text-right">Max (₹/Qtl)</th>
                  <th className="text-right">Modal Rate</th>
                  <th>Trend</th>
                </tr>
              )}
            </thead>
            <tbody>
              {selectedReport === "farmers" &&
                filteredFarmers.map((f: Farmer, i: number) => (
                  <tr key={f.id} className="print-avoid-break">
                    <td className="text-center font-mono">{i + 1}</td>
                    <td className="font-bold text-slate-900">{f.fullName}</td>
                    <td className="font-mono text-[9px]">{f.phoneNumber}</td>
                    <td>{f.district}</td>
                    <td>
                      <div className="font-bold text-slate-900 leading-tight">{f.village}</div>
                      <div className="text-[8px] text-slate-500 leading-tight">Tal: {f.taluka}</div>
                    </td>
                    <td className="text-right font-bold text-emerald-950">{(f.totalAcreage || 0).toFixed(1)} Ac</td>
                    <td>{(f.crops || []).map((c) => c.name).join(", ") || "None"}</td>
                    <td className="text-right font-mono">₹{(f.totalExpenses || 0).toLocaleString("en-IN")}</td>
                  </tr>
                ))}

              {selectedReport === "crops" &&
                filteredCrops.map((c: FlattenedCropRow, i: number) => (
                  <tr key={i} className="print-avoid-break">
                    <td className="text-center font-mono">{i + 1}</td>
                    <td className="font-bold">{c.farmerName}</td>
                    <td>{c.district}</td>
                    <td className="font-bold text-emerald-900">{c.cropName}</td>
                    <td>{c.variety}</td>
                    <td>{c.plotName}</td>
                    <td className="text-right font-bold">{c.areaAcre.toFixed(1)} Ac</td>
                    <td>{c.sowingDate}</td>
                    <td className="uppercase font-semibold">{c.status}</td>
                  </tr>
                ))}

              {selectedReport === "activities" &&
                filteredActivities.map((a: FarmActivity, i: number) => (
                  <tr key={a.id} className="print-avoid-break">
                    <td className="text-center font-mono">{i + 1}</td>
                    <td>{a.date.slice(0, 10)}</td>
                    <td className="font-bold">{a.farmerName}</td>
                    <td>{a.cropName}</td>
                    <td className="font-semibold uppercase">{a.activityType}</td>
                    <td>{a.title}</td>
                    <td>{(a.inputsUsed || []).join(", ") || a.dosage || "N/A"}</td>
                    <td className="text-right font-bold">₹{a.cost.toLocaleString("en-IN")}</td>
                  </tr>
                ))}

              {selectedReport === "seeds" &&
                filteredSeeds.map((s: SeedItem, i: number) => (
                  <tr key={s.id} className="print-avoid-break">
                    <td className="text-center font-mono">{i + 1}</td>
                    <td>{s.cropName}</td>
                    <td className="font-bold text-emerald-900">{s.varietyName}</td>
                    <td>{s.companyOrInstitute}</td>
                    <td>{s.durationDays}</td>
                    <td>{s.seedRate}</td>
                    <td className="text-right font-bold">{s.totalAcreage} Ac</td>
                    <td className="text-right">{s.farmersCount}</td>
                  </tr>
                ))}

              {selectedReport === "mandi" &&
                filteredMandi.map((m: MandiRate, i: number) => (
                  <tr key={m.id} className="print-avoid-break">
                    <td className="text-center font-mono">{i + 1}</td>
                    <td className="font-bold text-emerald-900">{m.commodity}</td>
                    <td>{m.market}</td>
                    <td>{m.district}</td>
                    <td className="text-right">₹{m.minPrice}</td>
                    <td className="text-right">₹{m.maxPrice}</td>
                    <td className="text-right font-bold text-emerald-950">₹{m.modalPrice}</td>
                    <td className="text-center uppercase font-bold">{m.trend}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Official Sign-off Block */}
        <div className="print-avoid-break pt-8 mt-6 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs text-slate-700">
          <div>
            <div className="h-14 border-b border-dashed border-slate-400 mb-1" />
            <p className="font-bold">Prepared By</p>
            <p className="text-[10px] text-slate-500">Data & Operations Officer</p>
          </div>
          <div>
            <div className="h-14 border-b border-dashed border-slate-400 mb-1" />
            <p className="font-bold">Verified By Agronomist</p>
            <p className="text-[10px] text-slate-500">Taluka / District Agricultural Office</p>
          </div>
          <div>
            <div className="h-14 border-b border-dashed border-slate-400 mb-1" />
            <p className="font-bold">Authorized Signatory / Seal</p>
            <p className="text-[10px] text-slate-500">Directorate of Agriculture</p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          INTERACTIVE WEB INTERFACE (Screen Only)
      ========================================================================= */}
      <div className="no-print space-y-6">
        {/* Top Control Hero Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 border border-slate-800 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Audit & Compliance Exporter</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              One-Click PDF & Excel Report Generator
            </h2>
            <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
              Generate standardized agricultural census sheets, crop acreage registries, field activity cost audits, and APMC market price intelligence directly exported to Excel (.csv) or printed to official PDF.
            </p>
          </div>

          {/* Master View Mode, Refresh & Export Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setViewMode("both")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${viewMode === "both"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white"
                  }`}
                title="Show both GIS Map and Report Table"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Map & Table</span>
              </button>

              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${viewMode === "map"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white"
                  }`}
                title="Show Farmland GIS Map only"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Map Only</span>
              </button>

              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${viewMode === "table"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white"
                  }`}
                title="Show Data Table only"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Table Only</span>
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing || loading}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh live data from Firestore and Mandi API"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Excel Export */}
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-emerald-900/50 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isExporting ? "Generating..." : "Download Excel (.CSV)"}</span>
            </button>

            {/* PDF Print */}
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold text-xs shadow-md transition-all cursor-pointer border border-slate-600"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Export PDF / Print</span>
            </button>
          </div>
        </div>



        {/* Data Table View (Shown when viewMode is 'both' or 'table') */}
        {(viewMode === "both" || viewMode === "table") && (
          <div className="space-y-6">
            {/* Report Selector Pills */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
              {[
                {
                  id: "farmers" as ReportType,
                  name: "Farmer Census",
                  desc: "Demographics & Acreage",
                  icon: Users,
                  count: filteredFarmers.length,
                },
                {
                  id: "crops" as ReportType,
                  name: "Crop Acreage",
                  desc: "Plots & Sowing Stages",
                  icon: Sprout,
                  count: filteredCrops.length,
                },
                {
                  id: "activities" as ReportType,
                  name: "Operations Audit",
                  desc: "Field Diary & Costs",
                  icon: ClipboardList,
                  count: filteredActivities.length,
                },
                {
                  id: "seeds" as ReportType,
                  name: "Seeds Adoption",
                  desc: "Varieties & Yield Stats",
                  icon: FileText,
                  count: filteredSeeds.length,
                },
                {
                  id: "mandi" as ReportType,
                  name: "Mandi Rates",
                  desc: "APMC Daily Prices",
                  icon: TrendingUp,
                  count: filteredMandi.length,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = selectedReport === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedReport(tab.id)}
                    className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${isSelected
                      ? "bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                      : "bg-white/80 hover:bg-white border-slate-200 text-slate-600"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-500"
                          }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${isSelected
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                          }`}
                      >
                        {tab.count}
                      </span>
                    </div>
                    <p
                      className={`text-xs font-bold truncate ${isSelected ? "text-slate-900" : "text-slate-700"
                        }`}
                    >
                      {tab.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{tab.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Metric Tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {reportStats.map((stat, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {stat.label}
                  </p>
                  <p className="text-xl font-extrabold text-slate-900 my-1">
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {stat.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Filter & Live Search Toolbar */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* District Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600">District:</span>
                  <select
                    value={districtFilter}
                    onChange={(e) => setDistrictFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="all">All Districts (Statewide)</option>
                    {districts.map((d: string) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Reset */}
                {(districtFilter !== "all" || searchQuery) && (
                  <button
                    onClick={() => {
                      setDistrictFilter("all");
                      setSearchQuery("");
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Filters</span>
                  </button>
                )}
              </div>

              {/* Search Input */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in this report..."
                  className="w-full text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Live Preview Data Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Live Data Preview ({
                      selectedReport === "farmers" ? filteredFarmers.length :
                        selectedReport === "crops" ? filteredCrops.length :
                          selectedReport === "activities" ? filteredActivities.length :
                            selectedReport === "seeds" ? filteredSeeds.length : filteredMandi.length
                    } Records)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Click Download Excel or Export PDF to obtain the full formatted dataset.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Live Firestore Data
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-slate-500">Loading live report records...</span>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200">
                      {selectedReport === "farmers" && (
                        <tr>
                          <th className="py-3 px-4">Farmer</th>
                          <th className="py-3 px-4">Contact</th>
                          <th className="py-3 px-4">District</th>
                          <th className="py-3 px-4">Village / Taluka</th>
                          <th className="py-3 px-4 text-right">Acreage</th>
                          <th className="py-3 px-4">Active Crops</th>
                          <th className="py-3 px-4 text-right">Expenses</th>
                          <th className="py-3 px-4">Registered</th>
                        </tr>
                      )}
                      {selectedReport === "crops" && (
                        <tr>
                          <th className="py-3 px-4">Farmer</th>
                          <th className="py-3 px-4">District</th>
                          <th className="py-3 px-4">Crop & Variety</th>
                          <th className="py-3 px-4">Plot</th>
                          <th className="py-3 px-4">Area Sown</th>
                          <th className="py-3 px-4">Sowing Date</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      )}
                      {selectedReport === "activities" && (
                        <tr>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Farmer</th>
                          <th className="py-3 px-4">Crop</th>
                          <th className="py-3 px-4">Operation</th>
                          <th className="py-3 px-4">Inputs & Dosage</th>
                          <th className="py-3 px-4">Cost</th>
                          <th className="py-3 px-4">Location</th>
                        </tr>
                      )}
                      {selectedReport === "seeds" && (
                        <tr>
                          <th className="py-3 px-4">Crop</th>
                          <th className="py-3 px-4">Variety Name</th>
                          <th className="py-3 px-4">Breeder / Institute</th>
                          <th className="py-3 px-4">Maturity Days</th>
                          <th className="py-3 px-4">Seed Rate</th>
                          <th className="py-3 px-4">Acreage</th>
                          <th className="py-3 px-4">Farmers</th>
                        </tr>
                      )}
                      {selectedReport === "mandi" && (
                        <tr>
                          <th className="py-3 px-4">Commodity</th>
                          <th className="py-3 px-4">APMC Market</th>
                          <th className="py-3 px-4">District</th>
                          <th className="py-3 px-4">Min Rate</th>
                          <th className="py-3 px-4">Max Rate</th>
                          <th className="py-3 px-4">Modal Price</th>
                          <th className="py-3 px-4">Trend</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedReport === "farmers" &&
                        filteredFarmers.slice(0, 50).map((f: Farmer) => (
                          <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">{f.fullName}</td>
                            <td className="py-3 px-4 font-mono text-slate-600">{f.phoneNumber}</td>
                            <td className="py-3 px-4 font-medium text-slate-700">{f.district}</td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900 leading-tight">{f.village}</div>
                              <div className="text-[10px] text-slate-500 leading-tight">Tal: {f.taluka}</div>
                            </td>
                            <td className="py-3 px-4 font-semibold text-emerald-700 text-right">{(f.totalAcreage || 0).toFixed(1)} Ac</td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {(f.crops || []).map((c) => (
                                  <span key={c.id} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-700">
                                    {c.name}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900 text-right">₹{(f.totalExpenses || 0).toLocaleString("en-IN")}</td>
                            <td className="py-3 px-4 text-slate-500">{f.registeredAt}</td>
                          </tr>
                        ))}

                      {selectedReport === "crops" &&
                        filteredCrops.slice(0, 50).map((c: FlattenedCropRow, i: number) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">{c.farmerName}</td>
                            <td className="py-3 px-4">{c.district}</td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-emerald-800">{c.cropName}</span>
                              <span className="text-[11px] text-slate-500 ml-1">({c.variety})</span>
                            </td>
                            <td className="py-3 px-4">{c.plotName}</td>
                            <td className="py-3 px-4 font-semibold text-emerald-700">{c.areaAcre.toFixed(1)} Ac</td>
                            <td className="py-3 px-4 text-slate-600">{c.sowingDate}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))}

                      {selectedReport === "activities" &&
                        filteredActivities.slice(0, 50).map((a: FarmActivity) => (
                          <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{a.date.slice(0, 10)}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">{a.farmerName}</td>
                            <td className="py-3 px-4 font-medium text-emerald-800">{a.cropName}</td>
                            <td className="py-3 px-4 font-semibold uppercase text-[10px] tracking-wide text-slate-600">{a.activityType}</td>
                            <td className="py-3 px-4">{(a.inputsUsed || []).join(", ") || a.dosage || "—"}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">₹{a.cost.toLocaleString("en-IN")}</td>
                            <td className="py-3 px-4 text-slate-500">{a.location}</td>
                          </tr>
                        ))}

                      {selectedReport === "seeds" &&
                        filteredSeeds.map((s: SeedItem) => (
                          <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">{s.cropName}</td>
                            <td className="py-3 px-4 font-semibold text-emerald-800">{s.varietyName}</td>
                            <td className="py-3 px-4 text-slate-600">{s.companyOrInstitute}</td>
                            <td className="py-3 px-4">{s.durationDays}</td>
                            <td className="py-3 px-4">{s.seedRate}</td>
                            <td className="py-3 px-4 font-bold text-emerald-700">{s.totalAcreage.toLocaleString()} Ac</td>
                            <td className="py-3 px-4 font-semibold text-slate-900">{s.farmersCount}</td>
                          </tr>
                        ))}

                      {selectedReport === "mandi" &&
                        filteredMandi.map((m: MandiRate) => (
                          <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-bold text-emerald-900">{m.commodity}</td>
                            <td className="py-3 px-4 font-medium text-slate-900">{m.market}</td>
                            <td className="py-3 px-4">{m.district}</td>
                            <td className="py-3 px-4">₹{m.minPrice}</td>
                            <td className="py-3 px-4">₹{m.maxPrice}</td>
                            <td className="py-3 px-4 font-bold text-emerald-800">₹{m.modalPrice}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${m.trend === "up" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                m.trend === "down" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                                  "bg-slate-100 text-slate-600"
                                }`}>
                                {m.trend}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
