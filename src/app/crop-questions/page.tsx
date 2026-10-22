"use client";

import React, { useState, useEffect, useRef } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import {
  CropQuestionDataset,
  CropQuestionItem,
  CropActivityConfig,
  SAMPLE_CROP_JSON_TEMPLATE,
  WHICH_PLANT_QUESTION_DATASET,
} from "@/lib/cropQuestionsData";
import {
  saveCropQuestionsToFirestore,
  fetchAllCropQuestionsFromFirestore,
  deleteCropQuestionsFromFirestore,
  clearAllCropQuestionsFromFirestore,
  saveSinglePlantingQuestionToFirestore,
} from "@/lib/cropQuestionsService";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  CloudUpload,
  RefreshCw,
  Search,
  Plus,
  Edit2,
  Trash2,
  Volume2,
  Download,
  Terminal,
  FileCode,
  Sprout,
  ShieldAlert,
  Layers,
  Scissors,
  Droplets,
  PackageCheck,
  Coins,
  X,
  Play,
  MessageSquareQuote,
  Check,
  Copy,
  AlertTriangle,
  FolderUp,
} from "lucide-react";

/**
 * Normalizes any uploaded JSON object into a valid CropQuestionDataset
 */
function normalizeDataset(raw: any, fallbackId: string): CropQuestionDataset {
  const cropId = String(raw.cropId || raw.id || fallbackId)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");

  // Localized name handling
  let cropName = { mr: cropId, hi: cropId, en: cropId };
  if (typeof raw.cropName === "string") {
    cropName = { mr: raw.cropName, hi: raw.cropName, en: raw.cropName };
  } else if (raw.cropName && typeof raw.cropName === "object") {
    cropName = {
      mr: raw.cropName.mr || raw.cropName.nameMr || cropId,
      hi: raw.cropName.hi || raw.cropName.nameHi || cropId,
      en: raw.cropName.en || raw.cropName.nameEn || cropId,
    };
  }

  // Activities handling
  const rawActivities = raw.activities || {};
  const activities: Record<string, CropActivityConfig> = {};

  Object.entries(rawActivities).forEach(([actKey, actVal]: [string, any]) => {
    if (!actVal || typeof actVal !== "object") return;

    let title = { mr: actKey, hi: actKey, en: actKey };
    if (typeof actVal.title === "string") {
      title = { mr: actVal.title, hi: actVal.title, en: actVal.title };
    } else if (actVal.title && typeof actVal.title === "object") {
      title = {
        mr: actVal.title.mr || actKey,
        hi: actVal.title.hi || actKey,
        en: actVal.title.en || actKey,
      };
    }

    const rawQuestions: any[] = Array.isArray(actVal.questions) ? actVal.questions : [];
    const questions: CropQuestionItem[] = rawQuestions.map((q: any, qIdx: number) => ({
      id: q.id || `${cropId}_${actKey}_${qIdx + 1}`,
      key: q.key || `field_${qIdx + 1}`,
      mr: q.mr || q.questionMr || q.question || "",
      hi: q.hi || q.questionHi || q.mr || "",
      en: q.en || q.questionEn || q.mr || "",
      hint: q.hint || "",
      required: q.required ?? true,
    }));

    activities[actKey] = {
      title,
      icon: actVal.icon || "Sprout",
      questions,
    };
  });

  return {
    cropId,
    cropName,
    aliases: Array.isArray(raw.aliases) && raw.aliases.length > 0 ? raw.aliases : [cropName.mr, cropName.en],
    category: raw.category || "Horticulture",
    iconEmoji: raw.iconEmoji || raw.emoji || "🌱",
    bannerGradient: raw.bannerGradient || "from-emerald-700 via-teal-700 to-cyan-800",
    activities,
    updatedAt: new Date().toISOString(),
    updatedBy: raw.updatedBy || "JSON Upload",
  };
}

export default function CropQuestionsPage() {
  const { adminUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crops catalog state - starts empty
  const [crops, setCrops] = useState<Record<string, CropQuestionDataset>>({});
  const [selectedCropId, setSelectedCropId] = useState<string>("");
  const [selectedActivity, setSelectedActivity] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });

  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);

  // Modals state
  const [editingQuestion, setEditingQuestion] = useState<{
    activityKey: string;
    question: CropQuestionItem;
    isNew: boolean;
  } | null>(null);

  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [showSimulator, setShowSimulator] = useState<boolean>(true);
  const [showAddCropModal, setShowAddCropModal] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Manual Add Crop State
  const [newCropForm, setNewCropForm] = useState({
    cropId: "",
    nameMr: "",
    nameHi: "",
    nameEn: "",
    category: "Horticulture",
    iconEmoji: "🌱",
    aliases: "",
  });

  // Voice Simulator state
  const [simInput, setSimInput] = useState<string>("मी आज पिकावर औषध फवारले");
  const [simOutput, setSimOutput] = useState<{
    cropDetected: string;
    activityDetected: string;
    questionMr: string;
    questionHi: string;
    questionEn: string;
    key: string;
    nextQuestion?: string;
  } | null>(null);

  const cropKeys = Object.keys(crops);
  const currentCrop = selectedCropId && crops[selectedCropId] ? crops[selectedCropId] : cropKeys.length > 0 ? crops[cropKeys[0]] : null;

  // Load all live crops from Firestore on mount
  const loadCropsFromDb = async () => {
    setLoading(true);
    try {
      const res = await fetchAllCropQuestionsFromFirestore();
      if (res && res.crops) {
        setCrops(res.crops);
        const keys = Object.keys(res.crops);
        if (keys.length > 0) {
          if (!selectedCropId || !res.crops[selectedCropId]) {
            setSelectedCropId(keys[0]);
          }
        } else {
          setSelectedCropId("");
        }
      }
    } catch (e) {
      console.warn("Could not load crop questions from Firestore:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCropsFromDb();
  }, []);

  // Text to Speech
  const speakText = (text: string, lang: "mr" | "hi" | "en", id: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Browser does not support Speech Synthesis");
      return;
    }

    if (activeSpeechId === id) {
      window.speechSynthesis.cancel();
      setActiveSpeechId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "mr" ? "mr-IN" : lang === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.95;

    utterance.onend = () => setActiveSpeechId(null);
    utterance.onerror = () => setActiveSpeechId(null);

    setActiveSpeechId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Upload JSON File Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Normalize into datasets
        const datasetsToProcess: CropQuestionDataset[] = [];

        if (Array.isArray(parsed)) {
          parsed.forEach((item, idx) => {
            if (item && typeof item === "object") {
              datasetsToProcess.push(normalizeDataset(item, `crop_${idx + 1}`));
            }
          });
        } else if (parsed && typeof parsed === "object") {
          if (parsed.cropId || parsed.activities || parsed.cropName) {
            datasetsToProcess.push(normalizeDataset(parsed, parsed.cropId || "custom_crop"));
          } else {
            Object.entries(parsed).forEach(([key, val]: [string, any]) => {
              if (val && typeof val === "object") {
                datasetsToProcess.push(normalizeDataset(val, key));
              }
            });
          }
        }

        if (datasetsToProcess.length === 0) {
          alert("The uploaded JSON file does not contain valid crop question structures.");
          return;
        }

        setIsSyncing(true);
        setSyncStatus({ type: "idle", message: `Uploading ${datasetsToProcess.length} crop(s) to Firestore...` });

        const updatedCrops = { ...crops };
        let lastId = "";
        let totalQ = 0;

        for (const ds of datasetsToProcess) {
          updatedCrops[ds.cropId] = ds;
          lastId = ds.cropId;
          const qCount = Object.values(ds.activities).reduce((acc, a) => acc + (a?.questions?.length || 0), 0);
          totalQ += qCount;
          await saveCropQuestionsToFirestore(ds, adminUser?.name || "Admin");
        }

        setCrops(updatedCrops);
        if (lastId) {
          setSelectedCropId(lastId);
        }

        setSyncStatus({
          type: "success",
          message: `Successfully uploaded ${datasetsToProcess.length} crop(s) with ${totalQ} questions from '${file.name}' to Firestore!`,
        });
      } catch (err: any) {
        console.error("JSON upload error:", err);
        setSyncStatus({
          type: "error",
          message: `Failed to parse or save JSON: ${err?.message || "Invalid JSON"}`,
        });
      } finally {
        setIsSyncing(false);
        if (e.target) e.target.value = "";
      }
    };

    reader.readAsText(file);
  };

  // Download Sample Template JSON
  const handleDownloadSampleJson = () => {
    const jsonStr = JSON.stringify(SAMPLE_CROP_JSON_TEMPLATE, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "crop_questions_sample_template.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Current or All Crops JSON
  const handleExportAllJson = () => {
    const jsonStr = JSON.stringify(crops, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `all_crop_questions_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Save current crop to Firestore
  const handleSaveCurrentCrop = async () => {
    if (!currentCrop) return;
    setIsSyncing(true);
    setSyncStatus({ type: "idle", message: "" });
    try {
      const res = await saveCropQuestionsToFirestore(
        currentCrop,
        adminUser?.name || "KrushiAR Admin"
      );
      if (res.success) {
        setSyncStatus({
          type: "success",
          message: `${currentCrop.cropName.mr} (${currentCrop.cropName.en}) questions saved to Firestore successfully!`,
        });
      } else {
        setSyncStatus({
          type: "error",
          message: `Save error: ${res.error || "Permission or network issue"}`,
        });
      }
    } catch (e: any) {
      setSyncStatus({
        type: "error",
        message: e?.message || "Failed to save to Firestore",
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus({ type: "idle", message: "" }), 6000);
    }
  };

  // Delete current selected crop
  const handleDeleteCurrentCrop = async () => {
    if (!currentCrop || !selectedCropId) return;
    const name = currentCrop.cropName.mr || selectedCropId;
    if (!confirm(`Are you sure you want to permanently delete '${name}' and all its questions from Firestore?`)) {
      return;
    }

    setIsSyncing(true);
    try {
      await deleteCropQuestionsFromFirestore(selectedCropId);
      const updated = { ...crops };
      delete updated[selectedCropId];
      setCrops(updated);
      const remKeys = Object.keys(updated);
      setSelectedCropId(remKeys.length > 0 ? remKeys[0] : "");
      setSyncStatus({
        type: "success",
        message: `Crop '${name}' was deleted successfully.`,
      });
    } catch (err: any) {
      setSyncStatus({
        type: "error",
        message: `Failed to delete: ${err?.message}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Clear all crop questions from Firestore
  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to delete ALL crop questions from Firestore and reset to empty?")) {
      return;
    }

    setIsSyncing(true);
    try {
      const res = await clearAllCropQuestionsFromFirestore();
      setCrops({});
      setSelectedCropId("");
      setSyncStatus({
        type: "success",
        message: `Cleared ${res.deletedCount} crops from Firestore. Ready for your custom JSON upload!`,
      });
    } catch (err: any) {
      setSyncStatus({
        type: "error",
        message: `Clear error: ${err?.message}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Add / Sync Planting Questions (Plant, Variety, Acres) to Firebase
  const handleAddSinglePlantingQuestion = async () => {
    setIsSyncing(true);
    setSyncStatus({
      type: "idle",
      message: "Saving Planting Questions (Plant, Variety, Acres) to Firebase...",
    });
    try {
      const res = await saveSinglePlantingQuestionToFirestore(
        adminUser?.name || "Crop AI Voice"
      );
      if (res.success) {
        setCrops((prev) => ({
          ...prev,
          [WHICH_PLANT_QUESTION_DATASET.cropId]: WHICH_PLANT_QUESTION_DATASET,
        }));
        setSelectedCropId(WHICH_PLANT_QUESTION_DATASET.cropId);
        setSyncStatus({
          type: "success",
          message:
            "Successfully saved Planting Questions (Plant, Variety, Acres) to Firebase Firestore under crop_questions/crop_planting!",
        });
      } else {
        setSyncStatus({
          type: "error",
          message: `Failed to save to Firebase: ${res.error}`,
        });
      }
    } catch (e: any) {
      setSyncStatus({
        type: "error",
        message: e?.message || "Failed to save question to Firebase",
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus({ type: "idle", message: "" }), 6000);
    }
  };

  // Delete question
  const handleDeleteQuestion = (activityKey: string, questionId: string) => {
    if (!confirm("Are you sure you want to remove this question?")) return;

    setCrops((prev) => {
      const crop = prev[selectedCropId];
      if (!crop || !crop.activities[activityKey]) return prev;

      const updatedQuestions = crop.activities[activityKey]!.questions.filter(
        (q) => q.id !== questionId
      );

      return {
        ...prev,
        [selectedCropId]: {
          ...crop,
          activities: {
            ...crop.activities,
            [activityKey]: {
              ...crop.activities[activityKey]!,
              questions: updatedQuestions,
            },
          },
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  // Save edited/new question
  const handleSaveQuestionModal = () => {
    if (!editingQuestion) return;
    const { activityKey, question, isNew } = editingQuestion;

    if (!question.mr || !question.key) {
      alert("Please provide the Marathi question and the extracted data key.");
      return;
    }

    setCrops((prev) => {
      const crop = prev[selectedCropId];
      if (!crop) return prev;

      const act = crop.activities[activityKey] || {
        title: { mr: activityKey, hi: activityKey, en: activityKey },
        questions: [],
      };

      let newQuestions = [...act.questions];
      if (isNew) {
        newQuestions.push(question);
      } else {
        newQuestions = newQuestions.map((q) => (q.id === question.id ? question : q));
      }

      return {
        ...prev,
        [selectedCropId]: {
          ...crop,
          activities: {
            ...crop.activities,
            [activityKey]: {
              ...act,
              questions: newQuestions,
            },
          },
          updatedAt: new Date().toISOString(),
        },
      };
    });

    setEditingQuestion(null);
  };

  // Create new crop manually
  const handleCreateCropManually = async () => {
    if (!newCropForm.cropId.trim() || !newCropForm.nameMr.trim()) {
      alert("Please enter a Crop ID (e.g. onion) and Marathi Name.");
      return;
    }

    const cropId = newCropForm.cropId.toLowerCase().trim().replace(/\s+/g, "_");
    const aliasesList = newCropForm.aliases
      ? newCropForm.aliases.split(",").map((s) => s.trim()).filter(Boolean)
      : [newCropForm.nameMr, newCropForm.nameEn || cropId];

    const newCrop: CropQuestionDataset = {
      cropId,
      cropName: {
        mr: newCropForm.nameMr,
        hi: newCropForm.nameHi || newCropForm.nameMr,
        en: newCropForm.nameEn || cropId,
      },
      aliases: aliasesList,
      category: newCropForm.category as any,
      iconEmoji: newCropForm.iconEmoji || "🌱",
      bannerGradient: "from-emerald-700 via-teal-700 to-cyan-800",
      activities: {
        planting: {
          title: { mr: "लागवड / पेरणी", hi: "रोपाई / बुवाई", en: "Planting / Sowing" },
          icon: "Sprout",
          questions: [],
        },
        pesticide: {
          title: { mr: "फवारणी", hi: "छिड़काव", en: "Spraying" },
          icon: "ShieldAlert",
          questions: [],
        },
      },
      updatedAt: new Date().toISOString(),
      updatedBy: adminUser?.name || "Admin",
    };

    setIsSyncing(true);
    await saveCropQuestionsToFirestore(newCrop, adminUser?.name || "Admin");
    setIsSyncing(false);

    setCrops((prev) => ({ ...prev, [cropId]: newCrop }));
    setSelectedCropId(cropId);
    setShowAddCropModal(false);
    setNewCropForm({
      cropId: "",
      nameMr: "",
      nameHi: "",
      nameEn: "",
      category: "Horticulture",
      iconEmoji: "🌱",
      aliases: "",
    });
  };

  // Voice AI Simulation logic
  const handleRunSimulation = (inputPhrase: string) => {
    const text = inputPhrase.toLowerCase();
    if (!cropKeys.length) return;

    // Detect crop
    let detectedCropKey = selectedCropId || cropKeys[0];
    for (const [key, crop] of Object.entries(crops)) {
      if (
        crop.aliases.some((alias) => text.includes(alias.toLowerCase())) ||
        crop.cropName.mr.includes(text) ||
        crop.cropName.en.toLowerCase().includes(text)
      ) {
        detectedCropKey = key;
        break;
      }
    }

    const cropObj = crops[detectedCropKey];
    if (!cropObj) return;

    // Detect activity
    let detectedActKey = "pesticide";
    if (text.includes("लागवड") || text.includes("पेरणी") || text.includes("रोपाई") || text.includes("जात")) {
      detectedActKey = "planting";
    } else if (text.includes("फवार") || text.includes("औषध") || text.includes("कीड") || text.includes("बुरशी") || text.includes("छिड़काव")) {
      detectedActKey = "pesticide";
    } else if (text.includes("खत") || text.includes("खाद") || text.includes("युरिया") || text.includes("डीएपी")) {
      detectedActKey = "fertilizer";
    } else if (text.includes("खुरपणी") || text.includes("तण") || text.includes("निराई")) {
      detectedActKey = "weeding";
    } else if (text.includes("पाणी") || text.includes("सिंचन") || text.includes("ठिबक") || text.includes("ड्रिप")) {
      detectedActKey = "irrigation";
    } else if (text.includes("काढणी") || text.includes("तोडणी") || text.includes("कापणी") || text.includes("गोणी") || text.includes("उत्पादन")) {
      detectedActKey = "harvesting";
    } else if (text.includes("विक्री") || text.includes("बाजार") || text.includes("भाव") || text.includes("मंडी") || text.includes("व्यापारी")) {
      detectedActKey = "sales";
    }

    const availableActKeys = Object.keys(cropObj.activities);
    const actConfig = cropObj.activities[detectedActKey] || (availableActKeys.length > 0 ? cropObj.activities[availableActKeys[0]] : undefined);
    const questions = actConfig?.questions || [];
    const firstQ = questions[0];
    const secondQ = questions[1];

    setSimOutput({
      cropDetected: `${cropObj.iconEmoji} ${cropObj.cropName.mr} (${cropObj.cropName.en})`,
      activityDetected: actConfig ? actConfig.title.mr : detectedActKey,
      questionMr: firstQ?.mr || "कोणते काम केले आणि किती खर्च झाला?",
      questionHi: firstQ?.hi || "कौन सा कार्य किया?",
      questionEn: firstQ?.en || "What work was done?",
      key: firstQ?.key || "details",
      nextQuestion: secondQ?.mr,
    });
  };

  // Activity icon helper
  const getActivityIcon = (actKey: string) => {
    switch (actKey) {
      case "planting":
        return Sprout;
      case "pesticide":
        return ShieldAlert;
      case "fertilizer":
        return Layers;
      case "weeding":
        return Scissors;
      case "irrigation":
        return Droplets;
      case "harvesting":
        return PackageCheck;
      case "sales":
        return Coins;
      default:
        return Sprout;
    }
  };

  const currentActivities = currentCrop?.activities || {};
  const currentActivityKeys = Object.keys(currentActivities);

  const displayedActivities = Object.entries(currentActivities).filter(
    ([key]) => selectedActivity === "ALL" || key === selectedActivity
  );

  const totalQuestions = currentCrop
    ? Object.values(currentCrop.activities).reduce((acc, a) => acc + (a?.questions?.length || 0), 0)
    : 0;

  const totalActivities = currentActivityKeys.length;

  return (
    <DashboardShell
      title="Crop AI Voice Question Engine"
      subtitle="Upload custom JSON files to configure multi-lingual voice questions for farmer diary entries"
    >
      {/* Hidden File Input for JSON Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* 1. Sync & Notification Alerts */}
      {syncStatus.message && (
        <div
          className={`p-4 rounded-2xl mb-6 flex items-center justify-between text-xs font-semibold shadow-sm transition-all ${syncStatus.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
        >
          <div className="flex items-center gap-2.5">
            {syncStatus.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{syncStatus.message}</span>
          </div>
          <button
            onClick={() => setSyncStatus({ type: "idle", message: "" })}
            className="text-slate-400 hover:text-slate-600 cursor-pointer ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Top Header & Action Controls */}
      <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900">
              Crop Questionnaires ({cropKeys.length} Configured)
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Firestore: crop_questions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload your own JSON dataset to dynamically configure voice questions for any crop.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Add 1 Question: Which plant are you planting */}
          <button
            onClick={handleAddSinglePlantingQuestion}
            disabled={isSyncing}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-900/25 transition-all cursor-pointer disabled:opacity-50"
            title="Save Planting Questions (Which plant, Which variety, How many acres) to Firebase"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>+ Add Planting Questions (3 Qs)</span>
          </button>

          {/* Upload JSON Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-50"
            title="Upload a custom .json file to add crop questions"
          >
            <FolderUp className="w-4 h-4" />
            <span>Upload JSON File</span>
          </button>

          {/* Download Sample JSON */}
          <button
            onClick={handleDownloadSampleJson}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition-all cursor-pointer"
            title="Download sample crop questions JSON template"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Sample JSON</span>
          </button>

          {/* Add Crop Manually */}
          <button
            onClick={() => setShowAddCropModal(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Crop</span>
          </button>

          {/* Export All JSON */}
          {cropKeys.length > 0 && (
            <button
              onClick={handleExportAllJson}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition-all cursor-pointer"
              title="Download all configured crops as JSON backup"
            >
              <FileCode className="w-3.5 h-3.5 text-slate-500" />
              <span>Export All</span>
            </button>
          )}

          {/* Clear All */}
          {cropKeys.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={isSyncing}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition-all cursor-pointer disabled:opacity-50"
              title="Wipe all questions from database"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={loadCropsFromDb}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh from Firestore"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* 3. Empty State (When no crops exist) */}
      {loading ? (
        <div className="py-24 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Loading Crop Questions from Firestore...</h3>
        </div>
      ) : cropKeys.length === 0 ? (
        <div className="p-12 lg:p-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 shadow-xs space-y-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
            <CloudUpload className="w-10 h-10" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-extrabold text-slate-900">
              No Crop AI Voice Questions Configured
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              All pre-seeded questions have been removed. You can now upload your own custom JSON file containing voice questions for any crop, or download our sample template.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
            >
              <FolderUp className="w-4 h-4" />
              <span>Upload Crop Questions JSON</span>
            </button>
            <button
              onClick={handleDownloadSampleJson}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Sample JSON Template</span>
            </button>
            <button
              onClick={handleAddSinglePlantingQuestion}
              disabled={isSyncing}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>+ Add Planting Questions (3 Qs)</span>
            </button>
            <button
              onClick={() => setShowAddCropModal(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Crop Manually</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 4. Crop Selector Tabs (Generated Dynamically from Uploaded Crops) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Select Crop (पीक निवडा)
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                  {cropKeys.length} Available
                </span>
              </div>
              <span className="text-xs text-emerald-700 font-semibold hidden sm:inline">
                ✨ Click on any crop to manage its voice questionnaires
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.values(crops).map((crop) => {
                const isSelected = selectedCropId === crop.cropId;
                const qCount = Object.values(crop.activities).reduce(
                  (acc, a) => acc + (a?.questions?.length || 0),
                  0
                );

                return (
                  <button
                    key={crop.cropId}
                    onClick={() => {
                      setSelectedCropId(crop.cropId);
                      setSelectedActivity("ALL");
                    }}
                    className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden group ${isSelected
                        ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20 scale-[1.02]"
                        : "bg-white border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 text-slate-800"
                      }`}
                  >
                    <div className="text-2xl mb-1.5">{crop.iconEmoji}</div>
                    <div className="font-extrabold text-sm tracking-tight truncate">
                      {crop.cropName.mr}
                    </div>
                    <div
                      className={`text-[11px] truncate font-medium ${isSelected ? "text-slate-300" : "text-slate-500"
                        }`}
                    >
                      {crop.cropName.en}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span
                        className={`font-semibold ${isSelected ? "text-emerald-400" : "text-emerald-700"
                          }`}
                      >
                        {qCount} Questions
                      </span>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded ${isSelected ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"
                          }`}
                      >
                        {crop.category}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {currentCrop && (
            <>
              {/* 5. Active Crop Banner & Aliases */}
              <div
                className={`p-5 lg:p-6 rounded-2xl bg-gradient-to-r ${currentCrop.bannerGradient || "from-emerald-700 to-teal-800"
                  } text-white mb-6 shadow-md`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl shadow-inner border border-white/20">
                      {currentCrop.iconEmoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
                          {currentCrop.cropName.mr} ({currentCrop.cropName.en})
                        </h2>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                          {currentCrop.cropName.hi}
                        </span>
                      </div>
                      <p className="text-xs text-white/80 mt-1 max-w-xl">
                        Configured for voice activity recognition. Contains {totalQuestions} agronomy questions covering {totalActivities} crop stages.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <div className="bg-black/20 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-xs">
                      <span className="text-white/60 block text-[10px] uppercase font-bold">
                        Voice Aliases Trigger:
                      </span>
                      <span className="font-mono text-emerald-200 font-semibold">
                        {(currentCrop.aliases || []).join(", ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveCurrentCrop}
                        disabled={isSyncing}
                        className="px-3.5 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 shadow-md transition-all cursor-pointer shrink-0 disabled:opacity-50"
                        title="Save changes to Firestore"
                      >
                        {isSyncing ? "Saving..." : "Save to Firestore"}
                      </button>

                      <button
                        onClick={handleDeleteCurrentCrop}
                        disabled={isSyncing}
                        className="p-2 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer shrink-0"
                        title="Delete this crop and questions"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Voice AI Simulator (Sandbox) */}
              <div className="mb-6 bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
                <div className="bg-emerald-900 text-white px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                      <MessageSquareQuote className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight">
                        Farmer Voice Diary AI Simulator
                      </h3>
                      <p className="text-[11px] text-emerald-300">
                        Test how the voice engine parses farmer speech using your uploaded questions
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSimulator(!showSimulator)}
                    className="text-xs text-emerald-200 hover:text-white px-2.5 py-1 rounded-lg bg-emerald-800/80 cursor-pointer"
                  >
                    {showSimulator ? "Hide Sandbox" : "Show Sandbox"}
                  </button>
                </div>

                {showSimulator && (
                  <div className="p-4 lg:p-6 bg-emerald-50/40">
                    <div className="flex gap-2 mb-4">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={simInput}
                          onChange={(e) => setSimInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleRunSimulation(simInput)}
                          placeholder="Type what farmer said in Marathi (e.g. मी पिकावर औषध फवारले)..."
                          className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium shadow-xs"
                        />
                      </div>
                      <button
                        onClick={() => handleRunSimulation(simInput)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Simulate AI</span>
                      </button>
                    </div>

                    {simOutput && (
                      <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-xs">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 pb-3 border-b border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              1. Detected Crop
                            </span>
                            <p className="text-xs font-bold text-slate-800 mt-0.5">
                              {simOutput.cropDetected}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              2. Classified Operation
                            </span>
                            <p className="text-xs font-bold text-emerald-700 mt-0.5">
                              {simOutput.activityDetected}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              3. Target Field Key
                            </span>
                            <p className="text-xs font-mono font-bold text-purple-700 mt-0.5">
                              {simOutput.key}
                            </p>
                          </div>
                        </div>

                        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                            Voice Prompt Generated for Farmer (मराठी):
                          </span>
                          <p className="text-sm font-extrabold text-slate-900">
                            &quot;{simOutput.questionMr}&quot;
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => speakText(simOutput.questionMr, "mr", "sim_mr")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Listen in Marathi</span>
                            </button>
                            <span className="text-[11px] text-slate-500">
                              (Hindi: {simOutput.questionHi})
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 7. Activity Tabs Filter */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                    <button
                      onClick={() => setSelectedActivity("ALL")}
                      className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all cursor-pointer ${selectedActivity === "ALL"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                      All Activities ({totalQuestions})
                    </button>
                    {currentActivityKeys.map((key) => {
                      const act = currentActivities[key];
                      if (!act) return null;
                      const Icon = getActivityIcon(key);
                      return (
                        <button
                          key={key}
                          onClick={() => setSelectedActivity(key)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer ${selectedActivity === key
                              ? "bg-emerald-600 text-white font-bold shadow-xs"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{act.title.mr}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedActivity === key ? "bg-emerald-800" : "bg-slate-200"
                              }`}
                          >
                            {act.questions.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative min-w-[220px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search questions or keys..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* 8. Questions List by Activity */}
              {displayedActivities.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  No activities configured for this crop.
                </div>
              ) : (
                <div className="space-y-6">
                  {displayedActivities.map(([actKey, actConfig]) => {
                    if (!actConfig) return null;
                    const Icon = getActivityIcon(actKey);

                    const filteredQuestions = actConfig.questions.filter((q) => {
                      const term = searchQuery.toLowerCase();
                      return (
                        !term ||
                        q.mr.toLowerCase().includes(term) ||
                        q.hi.toLowerCase().includes(term) ||
                        q.en.toLowerCase().includes(term) ||
                        q.key.toLowerCase().includes(term)
                      );
                    });

                    return (
                      <div
                        key={actKey}
                        className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
                      >
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900">
                                  {actConfig.title.mr}
                                </h3>
                                <span className="text-xs text-slate-500 font-medium">
                                  ({actConfig.title.en})
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">
                                activityKey: &quot;{actKey}&quot;
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              setEditingQuestion({
                                activityKey: actKey,
                                question: {
                                  id: `${currentCrop.cropId}_${actKey}_${Date.now()}`,
                                  key: "new_field",
                                  mr: "",
                                  hi: "",
                                  en: "",
                                  hint: "",
                                  required: true,
                                },
                                isNew: true,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Question</span>
                          </button>
                        </div>

                        <div className="p-4 lg:p-5">
                          {filteredQuestions.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">
                              No questions match your filter.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {filteredQuestions.map((q, idx) => (
                                <div
                                  key={q.id}
                                  className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
                                >
                                  <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                                        {idx + 1}
                                      </span>
                                      <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                        Key: {q.key}
                                      </span>
                                      {q.required ? (
                                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                          Mandatory
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                          Optional
                                        </span>
                                      )}
                                    </div>

                                    {/* Marathi Question */}
                                    <div className="flex items-start gap-2">
                                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded shrink-0">
                                        मराठी
                                      </span>
                                      <p className="text-xs font-extrabold text-slate-900 leading-relaxed">
                                        {q.mr}
                                      </p>
                                      <button
                                        onClick={() => speakText(q.mr, "mr", `${q.id}_mr`)}
                                        className="text-emerald-600 hover:text-emerald-800 cursor-pointer p-0.5"
                                        title="Play audio in Marathi"
                                      >
                                        <Volume2 className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {/* Hindi Question */}
                                    {q.hi && (
                                      <div className="flex items-start gap-2 text-slate-600">
                                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                                          हिंदी
                                        </span>
                                        <p className="text-xs font-medium">{q.hi}</p>
                                        <button
                                          onClick={() => speakText(q.hi, "hi", `${q.id}_hi`)}
                                          className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                                          title="Play audio in Hindi"
                                        >
                                          <Volume2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}

                                    {/* English Question */}
                                    {q.en && (
                                      <div className="flex items-start gap-2 text-slate-500">
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                                          EN
                                        </span>
                                        <p className="text-xs">{q.en}</p>
                                      </div>
                                    )}

                                    {/* Voice Hint */}
                                    {q.hint && (
                                      <p className="text-[11px] text-slate-400 italic">
                                        Voice Hint: {q.hint}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0 pt-1 md:pt-0">
                                    <button
                                      onClick={() =>
                                        setEditingQuestion({
                                          activityKey: actKey,
                                          question: q,
                                          isNew: false,
                                        })
                                      }
                                      className="p-2 rounded-xl text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                      title="Edit question"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteQuestion(actKey, q.id)}
                                      className="p-2 rounded-xl text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Delete question"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Edit / Add Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingQuestion.isNew ? "Add New Voice Question" : "Edit Voice Question"}
              </h3>
              <button
                onClick={() => setEditingQuestion(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Extracted Data Key (JSON Property Name) *
                </label>
                <input
                  type="text"
                  value={editingQuestion.question.key}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, key: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. variety, chemical_name, cost..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Marathi Voice Question (मराठी) *
                </label>
                <textarea
                  rows={2}
                  value={editingQuestion.question.mr}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, mr: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="उदा. कोणती जात लावली?..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Hindi Voice Question (हिंदी)
                </label>
                <textarea
                  rows={2}
                  value={editingQuestion.question.hi}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, hi: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="उदा. कौन सी किस्म लगाई?..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  English Voice Question (Optional)
                </label>
                <textarea
                  rows={2}
                  value={editingQuestion.question.en}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, en: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Which variety was planted?..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Voice Hint / Examples
                </label>
                <input
                  type="text"
                  value={editingQuestion.question.hint || ""}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, hint: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="उदा. संकरित जात / देशी जात..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="requiredCheck"
                  checked={editingQuestion.question.required || false}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, required: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="requiredCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Mandatory question (Voice AI will prompt farmer if missing)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
              <button
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuestionModal}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all cursor-pointer"
              >
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Crop Modal */}
      {showAddCropModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-extrabold text-slate-900">Add New Crop</h3>
              <button
                onClick={() => setShowAddCropModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Crop ID (English, lowercase, no spaces) *
                </label>
                <input
                  type="text"
                  value={newCropForm.cropId}
                  onChange={(e) => setNewCropForm({ ...newCropForm, cropId: e.target.value })}
                  placeholder="e.g. onion, cotton, banana..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Crop Name in Marathi (मराठी नाव) *
                </label>
                <input
                  type="text"
                  value={newCropForm.nameMr}
                  onChange={(e) => setNewCropForm({ ...newCropForm, nameMr: e.target.value })}
                  placeholder="उदा. कांदा, कापूस, केळी..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Crop Name in English
                </label>
                <input
                  type="text"
                  value={newCropForm.nameEn}
                  onChange={(e) => setNewCropForm({ ...newCropForm, nameEn: e.target.value })}
                  placeholder="e.g. Onion, Cotton, Banana..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Emoji Icon
                  </label>
                  <input
                    type="text"
                    value={newCropForm.iconEmoji}
                    onChange={(e) => setNewCropForm({ ...newCropForm, iconEmoji: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-center text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Category
                  </label>
                  <select
                    value={newCropForm.category}
                    onChange={(e) => setNewCropForm({ ...newCropForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Horticulture">Horticulture</option>
                    <option value="Cash Crop">Cash Crop</option>
                    <option value="Oilseeds">Oilseeds</option>
                    <option value="Cereals">Cereals</option>
                    <option value="Pulses">Pulses</option>
                    <option value="Vegetables">Vegetables</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Voice Aliases (Comma separated)
                </label>
                <input
                  type="text"
                  value={newCropForm.aliases}
                  onChange={(e) => setNewCropForm({ ...newCropForm, aliases: e.target.value })}
                  placeholder="उदा. कांदा, कांदे, onion, kanda..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowAddCropModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCropManually}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer"
              >
                Create Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
