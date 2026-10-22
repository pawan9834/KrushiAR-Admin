"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { fetchFarmersFromFirestore, db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  MapPin,
  Upload,
  Plus,
  Filter,
  Layers,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Maximize2,
  Minimize2,
  Compass,
  Sprout,
  Users,
  Copy,
  Check,
  Phone,
  ExternalLink,
  Volume2,
  Image as ImageIcon,
  Droplets,
  Radio,
  Navigation,
  Eye,
  Calendar
} from "lucide-react";

export interface PlottedCropPlot {
  id: string;
  lat: number;
  lng: number;
  cropName: string;
  variety: string;
  acreage: number;
  farmerName: string;
  farmerPhone: string;
  farmerPhoto?: string;
  village: string;
  taluka: string;
  district: string;
  status: "growing" | "flowering" | "harvesting" | "sown";
  source: "system" | "notes_upload";
  soilType?: string;
  irrigationType?: string;
  audioUri?: string;
  photoUri?: string;
  notes?: string;
  date?: string;
}

// Farmland plots start empty
const INITIAL_PLOTS: PlottedCropPlot[] = [];

// Crop visual themes & colors
const CROP_COLORS: Record<string, { bg: string; text: string; hex: string; icon: string }> = {
  Onion: { bg: "bg-purple-100", text: "text-purple-800", hex: "#9333ea", icon: "🧅" },
  Tomato: { bg: "bg-rose-100", text: "text-rose-800", hex: "#e11d48", icon: "🍅" },
  "Table Grapes": { bg: "bg-indigo-100", text: "text-indigo-800", hex: "#4f46e5", icon: "🍇" },
  Grapes: { bg: "bg-indigo-100", text: "text-indigo-800", hex: "#4f46e5", icon: "🍇" },
  Soybean: { bg: "bg-amber-100", text: "text-amber-800", hex: "#d97706", icon: "🫘" },
  Sugarcane: { bg: "bg-emerald-100", text: "text-emerald-800", hex: "#059669", icon: "🎋" },
  Ginger: { bg: "bg-orange-100", text: "text-orange-800", hex: "#ea580c", icon: "🫚" },
  Pomegranate: { bg: "bg-red-100", text: "text-red-800", hex: "#dc2626", icon: "🍎" },
  Banana: { bg: "bg-yellow-100", text: "text-yellow-800", hex: "#ca8a04", icon: "🍌" },
  केळी: { bg: "bg-yellow-100", text: "text-yellow-800", hex: "#ca8a04", icon: "🍌" },
  Cotton: { bg: "bg-sky-100", text: "text-sky-800", hex: "#0284c7", icon: "☁️" },
  Turmeric: { bg: "bg-amber-100", text: "text-amber-900", hex: "#b45309", icon: "🌿" },
  Wheat: { bg: "bg-yellow-100", text: "text-yellow-800", hex: "#eab308", icon: "🌾" },
};

export default function FarmlandCropMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const [plots, setPlots] = useState<PlottedCropPlot[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<PlottedCropPlot | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [notesInput, setNotesInput] = useState<string>("");
  const [defaultCrop, setDefaultCrop] = useState<string>("Soybean");
  const [defaultFarmer, setDefaultFarmer] = useState<string>("Field Farmer");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [mapType, setMapType] = useState<"satellite" | "street">("satellite");
  const tileLayerRef = useRef<any>(null);

  // Fetch real farmer locations and activity coordinates from Firebase
  useEffect(() => {
    async function loadFirebaseTelemetry() {
      try {
        const liveFarmers = await fetchFarmersFromFirestore();
        if (!liveFarmers || liveFarmers.length === 0) return;

        const livePlots: PlottedCropPlot[] = [];

        for (const f of liveFarmers) {
          let foundActivityWithGps = false;

          if (db) {
            try {
              const actSnap = await getDocs(collection(db, "farmers", f.id, "activities"));
              actSnap.forEach((doc) => {
                const data = doc.data();
                if (data.location && typeof data.location === "object" && data.location.latitude && data.location.longitude) {
                  foundActivityWithGps = true;
                  livePlots.push({
                    id: `act_${doc.id}`,
                    lat: Number(data.location.latitude),
                    lng: Number(data.location.longitude),
                    cropName: data.cropName || "केळी",
                    variety: data.cropName === "केळी" ? "गुजर" : "Active Crop",
                    acreage: Number(f.totalArea) || 4.0,
                    farmerName: f.name || "Pawan patil",
                    farmerPhone: f.phone || "9834175818",
                    farmerPhoto: f.avatarUri || f.photoUrl,
                    village: data.location.placeName || f.village || "Adgaon",
                    taluka: f.taluka || "Chopda",
                    district: f.district || "Jalgaon",
                    status: "growing",
                    source: "notes_upload",
                    soilType: f.soilType || "काळी कसदार जमीन",
                    irrigationType: f.irrigationType || "ठिबक सिंचन",
                    audioUri: data.audioUri,
                    photoUri: data.photoUri,
                    notes: data.aiSummary || data.notes || data.description || data.activityTitle,
                    date: data.date || data.createdAt,
                  });
                }
              });
            } catch (actErr) {
              console.warn("Could not load activity GPS telemetry:", actErr);
            }
          }

          // Fallback to known farmer coordinates if no GPS in activities
          if (!foundActivityWithGps && (f.taluka?.toLowerCase().includes("chopda") || f.district?.toLowerCase().includes("jalgaon"))) {
            livePlots.push({
              id: `farmer_${f.id}`,
              lat: 21.238645,
              lng: 75.3060503,
              cropName: "केळी",
              variety: "गुजर",
              acreage: Number(f.totalArea) || 10.0,
              farmerName: f.name || "Pawan patil",
              farmerPhone: f.phone || "9834175818",
              farmerPhoto: f.avatarUri || f.photoUrl,
              village: f.village || "Adgaon",
              taluka: f.taluka || "Chopda",
              district: f.district || "Jalgaon",
              status: "growing",
              source: "system",
              soilType: f.soilType || "काळी कसदार जमीन",
              irrigationType: f.irrigationType || "ठिबक सिंचन",
            });
          }
        }

        if (livePlots.length > 0) {
          setPlots(livePlots);
          setSelectedPlot(livePlots[0]);
        }
      } catch (err) {
        console.warn("Error loading live farm coordinates from Firebase:", err);
      }
    }

    loadFirebaseTelemetry();
  }, []);

  // Distill crop types & districts for filters
  const cropTypes = useMemo(() => {
    const list = new Set<string>();
    plots.forEach((p) => list.add(p.cropName));
    return Array.from(list).sort();
  }, [plots]);

  const districts = useMemo(() => {
    const list = new Set<string>();
    plots.forEach((p) => {
      if (p.district) list.add(p.district);
    });
    return Array.from(list).sort();
  }, [plots]);

  // Filtered plots
  const filteredPlots = useMemo(() => {
    return plots.filter((p) => {
      const matchCrop = selectedCrop === "ALL" || p.cropName.toLowerCase() === selectedCrop.toLowerCase();
      const matchDistrict = selectedDistrict === "ALL" || p.district.toLowerCase() === selectedDistrict.toLowerCase();
      const matchSearch =
        !searchQuery ||
        p.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.district.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCrop && matchDistrict && matchSearch;
    });
  }, [plots, selectedCrop, selectedDistrict, searchQuery]);

  // Initialize Leaflet map safely client-side
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous Leaflet instance if present on the DOM container (Fast Refresh / Strict Mode)
      if ((mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }

      // Base map centered on Maharashtra
      const map = L.map(mapContainerRef.current, {
        center: [19.25, 75.3],
        zoom: 7,
        zoomControl: false,
      });

      if (!isMounted) {
        map.remove();
        return;
      }

      L.control.zoom({ position: "topright" }).addTo(map);

      // Google Hybrid Satellite Tiles (Default: Real Farmland Satellite Imagery with Road & Village Overlays)
      const initialLayer = L.tileLayer(
        "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
        {
          subdomains: ["0", "1", "2", "3"],
          maxZoom: 20,
          attribution: "&copy; Google Maps Satellite",
        }
      ).addTo(map);
      tileLayerRef.current = initialLayer;

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      renderMarkers(filteredPlots, L, map, markersGroup);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }
    };
  }, []);

  // Switch between Google Satellite and Clean Map
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import("leaflet").then((leafletModule) => {
      const L = leafletModule.default || leafletModule;
      if (tileLayerRef.current) {
        mapInstanceRef.current.removeLayer(tileLayerRef.current);
      }
      let newLayer;
      if (mapType === "satellite") {
        newLayer = L.tileLayer(
          "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
          {
            subdomains: ["0", "1", "2", "3"],
            maxZoom: 20,
            attribution: "&copy; Google Maps Satellite",
          }
        );
      } else {
        newLayer = L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          {
            subdomains: "abcd",
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          }
        );
      }
      newLayer.addTo(mapInstanceRef.current);
      tileLayerRef.current = newLayer;
    });
  }, [mapType]);

  // Update map markers when filtered plots change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    import("leaflet").then((leafletModule) => {
      const L = leafletModule.default || leafletModule;
      renderMarkers(filteredPlots, L, mapInstanceRef.current, markersLayerRef.current);
    });
  }, [filteredPlots]);

  function renderMarkers(items: PlottedCropPlot[], L: any, map: any, group: any) {
    group.clearLayers();

    items.forEach((plot) => {
      const cropStyle = CROP_COLORS[plot.cropName] || {
        bg: "bg-emerald-100",
        text: "text-emerald-800",
        hex: "#059669",
        icon: "🌱",
      };

      const isUserUploaded = plot.source === "notes_upload";

      // Custom animated HTML pin marker
      const customIcon = L.divIcon({
        className: "custom-crop-pin",
        html: `
          <div class="relative flex items-center justify-center group cursor-pointer" style="width: 38px; height: 38px;">
            ${
              isUserUploaded
                ? `<div class="absolute inset-0 rounded-full animate-ping opacity-75" style="background-color: ${cropStyle.hex}"></div>`
                : ""
            }
            <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm shadow-lg border-2 border-white transition-transform group-hover:scale-125" style="background-color: ${
              cropStyle.hex
            }; color: white;">
              ${cropStyle.icon}
            </div>
            <div class="absolute -bottom-1 w-2 h-2 rounded-full border border-white" style="background-color: ${
              cropStyle.hex
            }"></div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([plot.lat, plot.lng], { icon: customIcon });

      // Rich formatted popup
      const popupContent = `
        <div style="font-family: inherit; min-width: 210px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 9999px; background: ${
              cropStyle.hex
            }20; color: ${cropStyle.hex};">
              ${cropStyle.icon} ${plot.cropName}
            </span>
            ${
              isUserUploaded
                ? '<span style="font-size: 9px; font-weight: 700; background: #ecfdf5; color: #047857; padding: 1px 6px; border-radius: 4px; border: 1px solid #a7f3d0;">Notes Sync</span>'
                : ""
            }
          </div>
          
          <h4 style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 2px 0;">
            ${plot.variety || plot.cropName}
          </h4>
          <p style="font-size: 12px; font-weight: 600; color: #334155; margin: 0 0 6px 0;">
            Farmer: ${plot.farmerName}
          </p>

          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px; border-top: 1px solid #f1f5f9; padding-top: 6px;">
            <div><strong>Location:</strong> ${plot.village}, ${plot.district}</div>
            <div><strong>Farmland:</strong> <span style="font-weight: 700; color: #059669;">${plot.acreage} Acres</span> (${plot.status})</div>
            <div style="font-family: monospace; font-size: 10px; color: #94a3b8; margin-top: 2px;">
              Lat: ${plot.lat.toFixed(4)}, Lng: ${plot.lng.toFixed(4)}
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on("click", () => {
        setSelectedPlot(plot);
        if (map) {
          map.flyTo([plot.lat, plot.lng], 13, { duration: 0.8 });
        }
      });
      group.addLayer(marker);
    });

    if (items.length > 0 && map) {
      try {
        if (items.length === 1) {
          map.setView([items[0].lat, items[0].lng], 12);
        } else {
          const bounds = L.latLngBounds(items.map((p: any) => [p.lat, p.lng]));
          map.fitBounds(bounds.pad(0.2));
        }
      } catch (e) {
        // Safe navigation fallback
      }
    }
  }

  // Parse notes text into coordinates and crop metadata
  const parsedFromNotes = useMemo(() => {
    if (!notesInput.trim()) return [];

    const results: PlottedCropPlot[] = [];
    const lines = notesInput.split(/\r?\n/);

    // Regex for DMS formats like: 21°17'17.0"N 75°20'28.2"E or 21°17'17"N, 75°20'28"E
    const dmsRegex = /(\d+)[°\s]+(\d+)['\s]+([\d.]+)?["\s]*([NSns])[\s,;]+(\d+)[°\s]+(\d+)['\s]+([\d.]+)?["\s]*([EWew])/i;

    // Regex to match decimal coordinates (Lat, Lng)
    const coordRegex = /([-+]?([1-8]?\d(\.\d+)?|90(\.0+)?))[\s,;:|]+([-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?))/;

    // Crop keywords detector
    const cropKeywords = [
      "Soybean",
      "Cotton",
      "Sugarcane",
      "Onion",
      "Tomato",
      "Grapes",
      "Table Grapes",
      "Banana",
      "Pomegranate",
      "Ginger",
      "Turmeric",
      "Wheat",
      "Jowar",
      "Maize",
      "Chilli",
    ];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let lat: number | null = null;
      let lng: number | null = null;

      // 1. Try DMS format first: 21°17'17.0"N 75°20'28.2"E
      const dmsMatch = trimmed.match(dmsRegex);
      if (dmsMatch) {
        const latDeg = parseFloat(dmsMatch[1]);
        const latMin = parseFloat(dmsMatch[2]);
        const latSec = parseFloat(dmsMatch[3] || "0");
        const latDir = dmsMatch[4].toUpperCase();

        const lngDeg = parseFloat(dmsMatch[5]);
        const lngMin = parseFloat(dmsMatch[6]);
        const lngSec = parseFloat(dmsMatch[7] || "0");
        const lngDir = dmsMatch[8].toUpperCase();

        lat = latDeg + latMin / 60 + latSec / 3600;
        if (latDir === "S") lat = -lat;

        lng = lngDeg + lngMin / 60 + lngSec / 3600;
        if (lngDir === "W") lng = -lng;
      } else {
        // 2. Try decimal degrees: 21.288056, 75.341167
        const decMatch = trimmed.match(coordRegex);
        if (decMatch) {
          lat = parseFloat(decMatch[1]);
          lng = parseFloat(decMatch[5]);
        }
      }

      // Validate India/Maharashtra bounds
      if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && lat >= 8 && lat <= 36 && lng >= 68 && lng <= 98) {
        // Detect crop from text or fallback
        let detectedCrop = defaultCrop;
        for (const c of cropKeywords) {
          if (new RegExp(`\\b${c}\\b`, "i").test(trimmed)) {
            detectedCrop = c;
            break;
          }
        }

        // Detect acreage like "5.5 acre" or "3 ac"
        const acreMatch = trimmed.match(/(\d+(\.\d+)?)\s*(acre|acres|ac)\b/i);
        const acreage = acreMatch ? parseFloat(acreMatch[1]) : 2.5;

        // Detect farmer name if provided like "Farmer: Dinesh Patil"
        const farmerMatch = trimmed.match(/(farmer|name|user)[:\s]+([a-zA-Z\s]+?)([,-]|$)/i);
        const farmerName = farmerMatch ? farmerMatch[2].trim() : `${defaultFarmer} #${index + 1}`;

        // Detect district/village if mentioned
        let village = "Survey Plot";
        let district = "Maharashtra";
        districts.forEach((d) => {
          if (new RegExp(`\\b${d}\\b`, "i").test(trimmed)) {
            district = d;
          }
        });

        results.push({
          id: `note_plot_${Date.now()}_${index}`,
          lat,
          lng,
          cropName: detectedCrop,
          variety: `${detectedCrop} Crop`,
          acreage,
          farmerName,
          farmerPhone: "Survey Entry",
          village,
          taluka: district,
          district,
          status: "growing",
          source: "notes_upload",
          soilType: "Verified GPS Coordinates",
        });
      }
    });

    return results;
  }, [notesInput, defaultCrop, defaultFarmer, districts]);

  // Handle uploading notes file (.txt / .csv / .json)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setNotesInput(content);
      }
    };
    reader.readAsText(file);
  };

  // Populate sample GPS notes for testing
  const handleInsertSample = () => {
    setNotesInput(
      `21°17'17.0"N 75°20'28.2"E - Banana - 5.5 Acres - Farmer: Dinesh Patil, Chopda Jalgaon\n` +
      `19.0345, 74.0125 - Soybean (JS 335) - 3.5 Acres - Farmer: Rahul Gaikwad, Ambegaon Pune\n` +
      `20.1250, 74.2400 - Table Grapes - 4.2 Acres - Farmer: Sachin Jadhav, Niphad Nashik\n` +
      `16.8520, 74.6200 - Sugarcane (Co 86032) - 5.0 Acres - Farmer: Maruti Patil, Shirol Kolhapur\n` +
      `18.3560, 75.2890 - Pomegranate - 2.8 Acres - Farmer: Balasaheb Shinde, Karmala Solapur`
    );
  };

  // Commit parsed coordinates to the live map
  const handlePlotOnMap = () => {
    if (parsedFromNotes.length === 0) return;

    setPlots((prev) => [...parsedFromNotes, ...prev]);
    setIsModalOpen(false);

    // Fly to first new plot
    if (mapInstanceRef.current && parsedFromNotes[0]) {
      mapInstanceRef.current.flyTo(
        [parsedFromNotes[0].lat, parsedFromNotes[0].lng],
        11,
        { duration: 1.5 }
      );
    }

    setToastMessage(`Mapped ${parsedFromNotes.length} new farm plots from your notes!`);
    setTimeout(() => setToastMessage(null), 4000);
    setNotesInput("");
  };

  const copyCoordinates = (lat: number, lng: number, id: string) => {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalMappedAcres = useMemo(() => {
    return filteredPlots.reduce((acc, p) => acc + p.acreage, 0).toFixed(1);
  }, [filteredPlots]);

  return (
    <div
      className={`rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden transition-all ${
        isFullscreen ? "fixed inset-4 z-50 shadow-2xl flex flex-col" : "mb-0"
      }`}
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-between animate-fade-in shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)}>
            <X className="w-3.5 h-3.5 hover:text-emerald-200" />
          </button>
        </div>
      )}

      {/* Map Header Card */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm lg:text-base font-extrabold text-slate-900 leading-tight">
                Farmland Geo-Telemetry GIS
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {plots.length > 0 ? `${filteredPlots.length} Plots • ${totalMappedAcres} Acres Mapped` : "GPS mapped crop fields"}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Satellite / Street Switcher */}
          <div className="flex items-center rounded-xl bg-slate-200/70 p-0.5 border border-slate-200">
            <button
              onClick={() => setMapType("satellite")}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                mapType === "satellite"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Google Satellite Hybrid"
            >
              <span>🛰️</span>
              <span className="hidden sm:inline">Satellite</span>
            </button>
            <button
              onClick={() => setMapType("street")}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                mapType === "street"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Carto Clean Street Map"
            >
              <span>🗺️</span>
              <span className="hidden sm:inline">Clean</span>
            </button>
          </div>

          {/* Upload Notes Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-[11px] shadow-sm transition-all cursor-pointer"
            title="Import GPS coordinates from notes"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Notes</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-slate-200 bg-white transition-all cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="px-4 py-2 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Crop Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Crop:
          </span>
          {plots.length > 0 ? (
            <>
              <button
                onClick={() => setSelectedCrop("ALL")}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedCrop === "ALL"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All ({plots.length})
              </button>

              {cropTypes.map((crop) => {
                const isSelected = selectedCrop === crop;
                const style = CROP_COLORS[crop] || { bg: "bg-slate-100", text: "text-slate-700", icon: "🌱" };
                return (
                  <button
                    key={crop}
                    onClick={() => setSelectedCrop(crop)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                        : `${style.bg} ${style.text} border-transparent hover:border-slate-300`
                    }`}
                  >
                    <span>{style.icon}</span>
                    <span>{crop}</span>
                  </button>
                );
              })}
            </>
          ) : (
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-400">
              Na
            </span>
          )}
        </div>

        {/* District Selector & Search */}
        <div className="flex items-center gap-1.5 ml-auto">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">{districts.length > 0 ? "All Districts" : "All (Na)"}</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plot..."
              className="pl-6 pr-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-28 lg:w-36 text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Quick Jump Farm Chips */}
      {filteredPlots.length > 0 && (
        <div className="px-4 py-1.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Farmlands:
          </span>
          {filteredPlots.map((p) => {
            const isSelected = selectedPlot?.id === p.id;
            const cStyle = CROP_COLORS[p.cropName] || { icon: "🌱" };
            return (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPlot(p);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([p.lat, p.lng], 13, { duration: 0.8 });
                  }
                }}
                className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all border cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                <span>{cStyle.icon}</span>
                <span className="font-bold">{p.farmerName}</span>
                <span className="text-[10px] opacity-75">({p.acreage} Ac)</span>
              </button>
            );
          })}
        </div>
      )}

      {/* The Interactive Leaflet Map Container with Live Plot Detail Drawer */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className={`w-full relative z-10 bg-slate-100 ${
            isFullscreen ? "flex-1 min-h-[460px]" : "h-[420px] lg:h-[450px]"
          }`}
        />

        {/* Top-Left Status Pill */}
        {plots.length === 0 ? (
          <div className="absolute top-2.5 left-2.5 z-20 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs flex items-center gap-2">
            <span className="font-bold text-slate-700">Plot Telemetry:</span>
            <span className="font-bold text-slate-400">Na</span>
          </div>
        ) : (
          <div className="absolute top-2.5 left-2.5 z-20 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-200 shadow-sm text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-800">Live GPS:</span>
            <span className="font-semibold text-emerald-700">
              {plots[0]?.farmerName} • {plots[0]?.cropName} ({plots[0]?.district})
            </span>
          </div>
        )}

        {/* Interactive Slide-out Live Plot Detail Drawer */}
        {selectedPlot && (
          <div className="absolute top-2 right-2 bottom-2 z-30 w-72 sm:w-80 max-w-[calc(100%-16px)] bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-xl flex flex-col overflow-hidden animate-fade-in">
            {/* Drawer Header */}
            <div className="p-2.5 border-b border-slate-100 bg-slate-50/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {CROP_COLORS[selectedPlot.cropName]?.icon || "🌱"}
                </span>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                    {selectedPlot.cropName} ({selectedPlot.variety || "Active"})
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {selectedPlot.status === "growing" ? "Active Growing" : selectedPlot.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlot(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body - Scrollable */}
            <div className="p-3 space-y-2.5 overflow-y-auto text-xs flex-1">
              {/* Farmer Profile Card */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {selectedPlot.farmerPhoto ? (
                    <img
                      src={selectedPlot.farmerPhoto}
                      alt={selectedPlot.farmerName}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xs shrink-0 border border-emerald-200">
                      {selectedPlot.farmerName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-extrabold text-slate-900 leading-tight">
                      {selectedPlot.farmerName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {selectedPlot.village}, {selectedPlot.taluka}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400">
                      {selectedPlot.district}
                    </p>
                  </div>
                </div>

                {selectedPlot.farmerPhone && (
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={`tel:${selectedPlot.farmerPhone}`}
                      className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500 shadow-xs transition-colors"
                      title="Call Farmer"
                    >
                      <Phone className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Telemetry & Soil Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-medium">Cultivated Area</span>
                  <span className="font-extrabold text-slate-900 text-xs">{selectedPlot.acreage} Acres</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-medium">Soil Classification</span>
                  <span className="font-extrabold text-slate-900 text-xs truncate block" title={selectedPlot.soilType || "काळी कसदार जमीन"}>
                    {selectedPlot.soilType || "काळी कसदार जमीन"}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium">Irrigation Method</span>
                    <span className="font-extrabold text-slate-800 text-xs">{selectedPlot.irrigationType || "ठिबक सिंचन"}</span>
                  </div>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    Drip System
                  </span>
                </div>
              </div>

              {/* Farmer Audio Voice Note if present */}
              {selectedPlot.audioUri && (
                <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-purple-900 font-bold text-[11px] flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                      Farmer Voice Diary Note
                    </span>
                    <span className="text-[9px] font-bold bg-purple-200/70 text-purple-800 px-1.5 py-0.5 rounded">
                      Audio
                    </span>
                  </div>
                  <audio controls className="w-full h-8 rounded-lg" src={selectedPlot.audioUri} />
                </div>
              )}

              {/* Field Photo if present */}
              {selectedPlot.photoUri && (
                <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-blue-900 font-bold text-[11px] flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      Field Photo
                    </span>
                    <a
                      href={selectedPlot.photoUri}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-blue-700 hover:underline inline-flex items-center gap-0.5"
                    >
                      View <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <a href={selectedPlot.photoUri} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-blue-200 group">
                    <img
                      src={selectedPlot.photoUri}
                      alt="Field Snapshot"
                      className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </a>
                </div>
              )}

              {/* Activity Note Summary if present */}
              {selectedPlot.notes && (
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] block font-medium">Field Record Note</span>
                  <p className="text-slate-700 text-xs font-medium mt-0.5 line-clamp-3">{selectedPlot.notes}</p>
                </div>
              )}

              {/* Verified Coordinates & Google Maps */}
              <div className="p-2 rounded-xl bg-slate-100/70 border border-slate-200">
                <div className="flex items-center justify-between mb-1 text-[10px] text-slate-500 font-medium">
                  <span>GPS Telemetry:</span>
                  <button
                    onClick={() => copyCoordinates(selectedPlot.lat, selectedPlot.lng, selectedPlot.id)}
                    className="text-emerald-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    {copiedId === selectedPlot.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="font-mono text-[11px] font-bold text-slate-800">
                  {selectedPlot.lat.toFixed(6)}, {selectedPlot.lng.toFixed(6)}
                </p>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-2.5 border-t border-slate-100 bg-slate-50/80 flex items-center gap-2">
              <button
                onClick={() => {
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([selectedPlot.lat, selectedPlot.lng], 14, { duration: 0.8 });
                  }
                }}
                className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Center Plot</span>
              </button>
              <a
                href={`https://www.google.com/maps?q=${selectedPlot.lat},${selectedPlot.lng}`}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Maps</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Map Legend Footer */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Legend:</span>
          {Object.entries(CROP_COLORS)
            .slice(0, 6)
            .map(([crop, style]) => (
              <div key={crop} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: style.hex }}
                />
                <span className="text-slate-700 font-medium text-[11px]">
                  {style.icon} {crop}
                </span>
              </div>
            ))}
        </div>
        <div className="text-[10px] text-slate-400">
          Showing verified GPS plots synced with KrushiAR database
        </div>
      </div>

      {/* =========================================================================
          MODAL: UPLOAD COORDINATES FROM NOTES
      ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Upload Coordinates from Field Notes
                  </h3>
                  <p className="text-xs text-slate-500">
                    Paste raw notes, surveyor entries, or upload a .txt / .csv file
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Quick Sample Button & Format Guide */}
              <div className="flex items-center justify-between bg-emerald-50/80 p-3 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-900 font-medium text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Supports formats like: <code>19.0144, 73.8567 - Soybean - 2.5 Acres - Farmer: Patil</code>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleInsertSample}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-500 shrink-0 cursor-pointer shadow-xs"
                >
                  Insert Sample Notes
                </button>
              </div>

              {/* Textarea for Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Paste Field Notes / GPS Logs:
                </label>
                <textarea
                  rows={6}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder={`Example:\n19.0144, 73.9422 - Onion - 2.5 Acres - Farmer: Pawan Patil\n20.0760, 74.1120, Table Grapes, 4.0 Acres\n16.7320, 74.5960 | Sugarcane | 6 Acres | Kolhapur`}
                  className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>

              {/* File Upload Selector */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100/60 transition-colors">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-bold text-slate-800">Or Select a Notes File</p>
                    <p className="text-[10px] text-slate-400">Accepts .txt, .csv, .log</p>
                  </div>
                </div>
                <label className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer shadow-xs">
                  Browse File
                  <input
                    type="file"
                    accept=".txt,.csv,.json,.log"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Parsing Detection Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-700">
                    Detected Farmlands ({parsedFromNotes.length}):
                  </span>
                  {parsedFromNotes.length > 0 ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Ready to Plot
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      Paste coordinates to see live preview
                    </span>
                  )}
                </div>

                {parsedFromNotes.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                    {parsedFromNotes.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs shadow-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <span className="font-bold text-slate-900">{p.cropName}</span>
                            <span className="text-slate-500 text-[11px] ml-1">
                              ({p.acreage} Ac) — {p.farmerName}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 shrink-0 ml-2">
                          {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center text-slate-400 text-xs">
                    No valid latitude and longitude coordinates found in input yet.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePlotOnMap}
                disabled={parsedFromNotes.length === 0}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer ${
                  parsedFromNotes.length > 0
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20 active:scale-95"
                    : "bg-slate-300 cursor-not-allowed"
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Plot {parsedFromNotes.length} Farmlands on Map</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
