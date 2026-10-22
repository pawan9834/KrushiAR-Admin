"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import type { Farmer, FarmActivity } from "@/lib/mockData";
import { fetchFarmersFromFirestore, db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import dynamic from "next/dynamic";
import {
  Users,
  MapPin,
  Sprout,
  ClipboardList,
  IndianRupee,
  Mic,
  AlertTriangle,
  ChevronRight,
  Radio,
  Sparkles,
  CloudRain,
  Wind,
  ThermometerSun
} from "lucide-react";

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

export default function DashboardOverviewPage() {
  const [farmers, setFarmers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [mandiRates, setMandiRates] = useState<any[]>([]);
  const [mandiLoading, setMandiLoading] = useState<boolean>(true);
  const [dashboardMandiCrop, setDashboardMandiCrop] = useState<string>("Onion");
  const [dashboardMandiDistrict, setDashboardMandiDistrict] = useState<string>("ALL");
  const [activeAdvisory, setActiveAdvisory] = useState({
    title: "IMD Weather Alert: High Wind & Pre-Winter Moisture Surge",
    message: "Gusty winds (30-40 km/h) with light unseasonal showers forecast across Khandesh and North Maharashtra. Farmers with Banana (केळी) plantations in Chopda/Jalgaon are advised to support pseudostems and ensure drainage in low-lying plots.",
    category: "weather",
    severity: "warning",
    targetDistrict: "Jalgaon, Chopda & Khandesh",
    date: "Active Today • 16 Oct 2026",
    temp: "31°C",
    humidity: "72%",
    wind: "18 km/h",
  });

  // Fetch live Mandi rates from API based on selected crop
  useEffect(() => {
    async function loadMandiPrices() {
      try {
        setMandiLoading(true);
        let url = "https://mandi-api.onrender.com/v1/prices?state=Maharashtra";
        if (dashboardMandiCrop !== "ALL") {
          url += `&commodity=${encodeURIComponent(dashboardMandiCrop)}`;
        }
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json && json.data && Array.isArray(json.data)) {
            const uniqueMarkets: any[] = [];
            const seen = new Set();
            for (const item of json.data) {
              const cleanMarket = item.market ? item.market.trim() : "";
              if (cleanMarket && !seen.has(cleanMarket)) {
                seen.add(cleanMarket);
                uniqueMarkets.push(item);
              }
            }
            setMandiRates(uniqueMarkets);
          }
        }
      } catch (err) {
        console.warn("Could not load live Mandi rates:", err);
      } finally {
        setMandiLoading(false);
      }
    }

    loadMandiPrices();
  }, [dashboardMandiCrop]);

  // Fetch live farmers and their real diary activities & crops from Firestore
  useEffect(() => {
    async function loadLiveData() {
      try {
        const liveFarmers = await fetchFarmersFromFirestore();
        if (liveFarmers && liveFarmers.length > 0) {
          setFarmers(liveFarmers);

          if (db) {
            const allActivities: any[] = [];
            const allCrops: any[] = [];

            for (const f of liveFarmers) {
              // Fetch activities subcollection
              try {
                const actSnap = await getDocs(collection(db, "farmers", f.id, "activities"));
                actSnap.forEach((d) => {
                  const data = d.data();
                  const locString = typeof data.location === "object" && data.location !== null
                    ? (data.location.placeName || `${data.location.latitude?.toFixed(4) || ""}, ${data.location.longitude?.toFixed(4) || ""}`.trim() || f.village || f.district || "Maharashtra")
                    : (typeof data.location === "string" ? data.location : f.village || f.district || "Maharashtra");

                  allActivities.push({
                    ...data,
                    id: d.id,
                    farmerId: f.id,
                    farmerName: f.name || "Farmer",
                    title: data.activityTitle || data.title || "Farm Activity",
                    description: data.aiSummary || data.notes || data.description || "Field Diary Record",
                    cropName: data.cropName || "General",
                    location: locString,
                    date: data.date || data.createdAt || new Date().toISOString(),
                    cost: Number(data.totalExpense) || 0,
                    hasAudio: Boolean(data.audioUri),
                    audioDuration: "Voice Note",
                  });
                });
              } catch (actErr) {
                console.warn(`Could not load activities for farmer ${f.id}:`, actErr);
              }

              // Fetch crops subcollection
              try {
                const cropSnap = await getDocs(collection(db, "farmers", f.id, "crops"));
                cropSnap.forEach((d) => {
                  allCrops.push({
                    id: d.id,
                    farmerId: f.id,
                    ...d.data(),
                  });
                });
              } catch (cropErr) {
                console.warn(`Could not load crops for farmer ${f.id}:`, cropErr);
              }
            }

            setActivities(allActivities);
            setCrops(allCrops);

            // Fetch live broadcasts from Firestore
            try {
              const bSnap = await getDocs(collection(db, "broadcasts"));
              const liveB: any[] = [];
              bSnap.forEach((doc) => {
                liveB.push({ id: doc.id, ...doc.data() });
              });
              if (liveB.length > 0) {
                const weatherB = liveB.find((b) => b.category === "weather") || liveB[0];
                setActiveAdvisory({
                  title: weatherB.title || "IMD Weather Alert: High Wind & Rain Surge",
                  message: weatherB.message || "Gusty winds forecast. Farmers are advised to provide propping support.",
                  category: weatherB.category || "weather",
                  severity: weatherB.severity || "warning",
                  targetDistrict: weatherB.targetDistrict || "Jalgaon & Khandesh Region",
                  date: weatherB.createdAt ? new Date(weatherB.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Active Today",
                  temp: "31°C",
                  humidity: "72%",
                  wind: "18 km/h",
                });
              }
            } catch (bErr) {
              console.warn("Could not load broadcasts from Firebase:", bErr);
            }
          }
        }
      } catch (err) {
        console.warn("Using live data fetch notice:", err);
      }
    }
    loadLiveData();
  }, []);

  // Compute metrics from live Firebase data
  const totalFarmers = farmers.length;

  const totalAcreage = farmers.reduce((acc, f: any) => {
    const val = Number(f.totalArea || f.totalAcreage);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const totalExpenses = activities.reduce((acc, a: any) => {
    const val = Number(a.totalExpense || a.cost);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const totalActivities = activities.length;

  // Distill locations & crop labels from Firebase
  const farmerLocations = Array.from(
    new Set(farmers.map((f: any) => f.district || f.taluka || f.village).filter(Boolean))
  ).join(", ");

  const registeredCrops = Array.from(
    new Set(crops.map((c: any) => c.name || c.cropName).filter(Boolean))
  ).join(", ");

  // Dynamically compute activity breakdown from live Firebase activities
  const activityCategories = useMemo(() => {
    const total = activities.length;

    const definitions = [
      {
        key: "fertilizer",
        label: "Fertilizer & Fertigation",
        color: "bg-teal-500",
        textColor: "text-teal-700",
        match: (a: any) =>
          a.activityType?.includes("fert") ||
          a.title?.toLowerCase().includes("fert") ||
          a.title?.includes("खत") ||
          a.description?.includes("खत"),
      },
      {
        key: "pesticide",
        label: "Fungicide & Pesticide Spraying",
        color: "bg-emerald-500",
        textColor: "text-emerald-700",
        match: (a: any) =>
          a.activityType?.includes("pest") ||
          a.activityType?.includes("spray") ||
          a.title?.toLowerCase().includes("spray") ||
          a.title?.includes("फवारणी") ||
          a.description?.includes("फवारणी"),
      },
      {
        key: "irrigation",
        label: "Irrigation & Water Management",
        color: "bg-blue-500",
        textColor: "text-blue-700",
        match: (a: any) =>
          a.activityType?.includes("irrig") ||
          a.activityType?.includes("water") ||
          a.title?.includes("पाणी") ||
          a.description?.includes("पाणी") ||
          a.description?.includes("ठिबक"),
      },
      {
        key: "harvesting",
        label: "Harvesting & Picking",
        color: "bg-amber-500",
        textColor: "text-amber-700",
        match: (a: any) =>
          a.activityType?.includes("harvest") ||
          a.activityType?.includes("pick") ||
          a.title?.includes("कापणी") ||
          a.description?.includes("तोडणी"),
      },
      {
        key: "expenses_tillage",
        label: "Farm Expenses & Soil Tillage",
        color: "bg-purple-500",
        textColor: "text-purple-700",
        match: (a: any) =>
          a.activityType?.includes("expense") ||
          a.activityType?.includes("tillage") ||
          a.activityType?.includes("weed") ||
          Number(a.cost) > 0 ||
          a.title?.includes("खर्च"),
      },
    ];

    if (total === 0) {
      return definitions.map((d) => ({
        ...d,
        count: 0,
        percent: 0,
        displayPercent: "Na",
      }));
    }

    return definitions.map((d) => {
      const count = activities.filter(d.match).length;
      const percent = Math.round((count / total) * 100);
      return {
        ...d,
        count,
        percent,
        displayPercent: `${percent}%`,
      };
    });
  }, [activities]);

  return (
    <DashboardShell
      title="Admin Dashboard"
      subtitle="Overview of registered farmers, farm plots, and AI diary activities"
    >
      {/* Top Active Weather Advisory Alert Banner */}
      <div className="mb-6 p-4 lg:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm backdrop-blur-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-950/20 mt-0.5">
            <CloudRain className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-extrabold text-amber-950 bg-amber-300/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-700 animate-ping" />
                Active Weather Advisory
              </span>
              <span className="text-xs font-bold text-amber-900 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-200">
                📍 {activeAdvisory.targetDistrict}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {activeAdvisory.date}
              </span>
            </div>
            <h4 className="text-sm lg:text-base font-extrabold text-slate-900">
              {activeAdvisory.title}
            </h4>
            <p className="text-xs text-slate-600 max-w-4xl leading-relaxed">
              {activeAdvisory.message}
            </p>
          </div>
        </div>

        {/* Live Weather Micro-Metrics & CTA */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/90 border border-amber-200/80 shadow-xs text-xs text-slate-700">
            <div className="flex items-center gap-1 text-amber-700 font-bold">
              <ThermometerSun className="w-3.5 h-3.5" />
              <span>{activeAdvisory.temp}</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <div className="flex items-center gap-1 text-sky-700 font-bold">
              <CloudRain className="w-3.5 h-3.5" />
              <span>{activeAdvisory.humidity}</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <div className="flex items-center gap-1 text-slate-700 font-bold">
              <Wind className="w-3.5 h-3.5" />
              <span>{activeAdvisory.wind}</span>
            </div>
          </div>

          <Link
            href="/broadcasts"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200/90 px-3.5 py-2 rounded-xl border border-amber-300/80 shadow-xs transition-colors shrink-0"
          >
            <Radio className="w-3.5 h-3.5 text-amber-700" />
            <span>Broadcast Alerts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 mb-8">
        {/* Total Farmers */}
        <div className="p-4 lg:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Farmers
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-900">
              {totalFarmers > 0 ? totalFarmers : "Na"}
            </span>
            {totalFarmers > 0 ? (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Registered
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-400">Na</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate" title={farmerLocations}>
            {farmerLocations || "Na"}
          </p>
        </div>

        {/* Total Acreage */}
        <div className="p-4 lg:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Cultivated Area
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Sprout className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-900">
              {totalAcreage > 0 ? totalAcreage.toFixed(1) : "Na"}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {totalAcreage > 0 ? (farmers[0]?.areaUnit || "Acres") : "Na"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate" title={registeredCrops}>
            {registeredCrops || (totalAcreage > 0 ? "Active farmland" : "Na")}
          </p>
        </div>

        {/* Total Diary Activities */}
        <div className="p-4 lg:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Diary Records
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-900">
              {totalActivities > 0 ? totalActivities : "Na"}
            </span>
            {totalActivities > 0 ? (
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                AI Voice
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-400">Na</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            {totalActivities > 0
              ? `${activities[0]?.cropName || "Crop"} • ${activities[0]?.activityType || "Field Log"}`
              : "Na"}
          </p>
        </div>

        {/* Recorded Farming Investment / Expenses */}
        <div className="p-4 lg:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Recorded Cost
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-900">
              {totalFarmers > 0 ? `₹${totalExpenses.toLocaleString("en-IN")}` : "Na"}
            </span>
            {totalFarmers > 0 && (
              <span className="text-xs text-slate-400 ml-1">Total</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {totalFarmers > 0 ? "Directly logged in farmer diary" : "Na"}
          </p>
        </div>
      </div>

      {/* Primary 50/50 Split Section: Live Diary Activities (Left 50%) + Farmland Geo-Telemetry GIS Map (Right 50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-start">
        {/* Left 50%: Activity Breakdown & Recent Live Activities */}
        <div className="space-y-6">
          {/* Activity Category Breakdown */}
          <div className="p-5 lg:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Activity Breakdown
                </h3>
                <p className="text-xs text-slate-500">Distribution of activities recorded in mobile diaries</p>
              </div>
              {activities.length > 0 ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {activities.length} Live Synced
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  Na
                </span>
              )}
            </div>

            {/* Visual Bar representation */}
            <div className="space-y-3.5">
              {activityCategories.map((category) => (
                <div key={category.key}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700">{category.label}</span>
                    <span className={category.count > 0 ? `${category.textColor} font-bold` : "text-slate-400 font-bold"}>
                      {category.displayPercent}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${category.count > 0 ? category.color : "bg-slate-300"} rounded-full transition-all duration-500`}
                      style={{ width: `${category.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Live Activity Stream */}
          <div className="p-5 lg:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Recent Farm Activities
                </h3>
                <p className="text-xs text-slate-500">Live farming updates recorded by farmers</p>
              </div>
              <Link
                href="/activities"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {activities.length > 0 ? (
                activities.slice(0, 4).map((act) => (
                  <div key={act.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{act.farmerName || "Na"}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {act.cropName || "Na"}
                        </span>
                        {act.hasAudio && (
                          <a
                            href={act.audioUri}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                            title="Play Voice Recording"
                          >
                            <Mic className="w-3 h-3 text-purple-600" />
                            Voice Note
                          </a>
                        )}
                        {act.photoUri && (
                          <a
                            href={act.photoUri}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                            title="View Field Photo"
                          >
                            📷 Field Photo
                          </a>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-800">{act.title || "Na"}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{act.description || "Na"}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {typeof act.location === "string" ? act.location : (act.location?.placeName || "Na")}
                        </span>
                        <span>•</span>
                        <span suppressHydrationWarning>{act.date ? new Date(act.date).toLocaleDateString("en-US") : "Na"}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 block">
                        {typeof act.cost === "number" ? `₹${act.cost.toLocaleString("en-IN")}` : "Na"}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1 uppercase">Cost</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-3 py-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3 border-b border-slate-100 last:border-0">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-600">Na</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                            Na
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-700">Na</p>
                        <p className="text-xs text-slate-400">Na</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            Na
                          </span>
                          <span>•</span>
                          <span>Na</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 block">
                          Na
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1 uppercase">Cost</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* APMC Mandi Rates Widget */}
          <div className="p-5 lg:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Live Mandi Rates
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    Maharashtra APMC
                  </span>
                </div>
                <p className="text-xs text-slate-500">Real-time market bidding rates (per Quintal)</p>
              </div>
              <Link
                href="/mandi"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
              >
                <span>Full Mandi Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Quick Crop Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs mb-3">
              {[
                { id: "Onion", label: "🧅 Onion" },
                { id: "Soyabean", label: "🫘 Soyabean" },
                { id: "Cotton", label: "☁️ Cotton" },
                { id: "Tomato", label: "🍅 Tomato" },
                { id: "Wheat", label: "🌾 Wheat" },
                { id: "Banana", label: "🍌 Banana" },
                { id: "ALL", label: "🌱 All Crops" }
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setDashboardMandiCrop(c.id);
                    setDashboardMandiDistrict("ALL");
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition-all cursor-pointer text-[11px] ${dashboardMandiCrop === c.id
                      ? "bg-emerald-600 text-white font-bold shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* District Filter Selector */}
            {mandiRates.length > 0 && (
              <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100 text-xs">
                <span className="text-slate-400 font-semibold text-[11px]">Filter District:</span>
                <select
                  value={dashboardMandiDistrict}
                  onChange={(e) => setDashboardMandiDistrict(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="ALL">All Districts</option>
                  {Array.from(new Set(mandiRates.map((r) => r.district).filter(Boolean))).sort().map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {mandiLoading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
                <span className="text-xs font-semibold text-slate-500">Loading live Mandi prices...</span>
              </div>
            ) : mandiRates.length > 0 ? (
              <div className="space-y-2.5">
                {mandiRates
                  .filter(
                    (r) =>
                      dashboardMandiDistrict === "ALL" ||
                      r.district?.toLowerCase() === dashboardMandiDistrict.toLowerCase()
                  )
                  .slice(0, 6)
                  .map((rate) => (
                    <div
                      key={rate.id}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-100 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {rate.market?.replace(/^APMC\s+/i, "").trim() || "Market"}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded shrink-0">
                            {rate.district}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {rate.commodity} • {rate.variety || "Local"} ({rate.grade || "FAQ"})
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs lg:text-sm font-extrabold text-emerald-700">
                          ₹{Number(rate.modal_price || 0).toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400">
                          ₹{rate.min_price} - ₹{rate.max_price} / Qtl
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-400">
                No active APMC rates found
              </div>
            )}
          </div>
        </div>

        {/* Right Column (50%): Farmland GIS Map & Quick Action Navigation */}
        <div className="space-y-6">
          <FarmlandCropMap />

          {/* Quick Action Navigation */}
          <div className="p-5 lg:p-6 mt-5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950 text-white shadow-md">
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Quick Actions
            </h4>
            <p className="text-xs text-emerald-200/80 mb-4">
              Send advisory alerts or inspect farmer crop records.
            </p>

            <div className="space-y-2.5">
              <Link
                href="/broadcasts"
                className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-between transition-colors shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  <span>Broadcast Advisory Alert</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/farmers"
                className="w-full py-2.5 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold flex items-center justify-between transition-colors border border-slate-700"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Inspect Farmers Directory</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
