import { db, auth } from "./firebase";
import { signInAnonymously } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import {
  CropQuestionDataset,
  DEFAULT_CROP_DATASETS,
  ONION_QUESTIONS_DATASET,
  WHICH_PLANT_QUESTION_DATASET,
} from "./cropQuestionsData";

const COLLECTION_NAME = "crop_questions";

/**
 * Ensure user has an active Firebase Auth session before Firestore write
 */
async function ensureAuthSession(): Promise<void> {
  try {
    if (auth && !auth.currentUser) {
      await signInAnonymously(auth);
      console.log("KrushiAR: Signed in anonymously for Firestore write");
    }
  } catch (err) {
    console.warn("KrushiAR: Anonymous sign-in attempt notice:", err);
  }
}

/**
 * Save or update a single crop's question catalog into Firestore:
 * Path: crop_questions/{cropId}
 */
export async function saveCropQuestionsToFirestore(
  dataset: CropQuestionDataset,
  adminName: string = "Admin"
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!db) {
      throw new Error("Firebase Firestore is not initialized.");
    }

    await ensureAuthSession();

    const docRef = doc(db, COLLECTION_NAME, dataset.cropId);
    
    // Deep clone to remove any undefined values which Firestore rejects
    const rawActivities = JSON.parse(JSON.stringify(dataset.activities || {}));

    const cleanPayload = {
      cropId: dataset.cropId,
      cropName: dataset.cropName,
      aliases: dataset.aliases || [],
      category: dataset.category || "Horticulture",
      iconEmoji: dataset.iconEmoji || "🌾",
      bannerGradient: dataset.bannerGradient || "from-emerald-600 to-teal-700",
      activities: rawActivities,
      updatedAt: new Date().toISOString(),
      updatedBy: adminName,
    };

    await setDoc(docRef, cleanPayload, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to save ${dataset.cropId} to Firestore:`, error);
    let msg = error?.message || "Failed to write document to Firestore";
    if (msg.includes("permission") || msg.includes("permissions") || error?.code === "permission-denied") {
      msg = "Missing or insufficient permissions in Firebase Firestore Rules. Please allow write on /crop_questions/{cropId}.";
    }
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Save specifically the Onion question catalog into Firestore
 */
export async function saveOnionQuestionsToFirestore(
  adminName: string = "KrushiAR Agronomy Team"
): Promise<{ success: boolean; error?: string }> {
  return saveCropQuestionsToFirestore(ONION_QUESTIONS_DATASET, adminName);
}

/**
 * Save the single question "Which plant are you planting?" into Firestore
 * Path: crop_questions/crop_planting
 */
export async function saveSinglePlantingQuestionToFirestore(
  adminName: string = "Crop AI Voice"
): Promise<{ success: boolean; error?: string }> {
  return saveCropQuestionsToFirestore(WHICH_PLANT_QUESTION_DATASET, adminName);
}

/**
 * Fetch a specific crop's questions from Firestore:
 * Path: crop_questions/{cropId}
 */
export async function fetchCropQuestionsFromFirestore(
  cropId: string
): Promise<{ data: CropQuestionDataset | null; fromFirestore: boolean; error?: string }> {
  try {
    if (!db) {
      return {
        data: null,
        fromFirestore: false,
      };
    }

    const docRef = doc(db, COLLECTION_NAME, cropId);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      const docData = snapshot.data();
      const merged: CropQuestionDataset = {
        cropId: docData.cropId || cropId,
        cropName: docData.cropName || { mr: cropId, hi: cropId, en: cropId },
        aliases: docData.aliases || [],
        category: docData.category || "Horticulture",
        iconEmoji: docData.iconEmoji || "🌾",
        bannerGradient: docData.bannerGradient || "from-emerald-600 to-teal-700",
        activities: docData.activities || {},
        updatedAt: docData.updatedAt || new Date().toISOString(),
        updatedBy: docData.updatedBy || "Firestore",
      };
      return { data: merged, fromFirestore: true };
    }

    return {
      data: null,
      fromFirestore: false,
    };
  } catch (err: any) {
    console.warn(`Could not read crop_questions/${cropId} from Firestore:`, err);
    return {
      data: null,
      fromFirestore: false,
      error: err?.message,
    };
  }
}

/**
 * Fetch all available crop question documents from Firestore.
 */
export async function fetchAllCropQuestionsFromFirestore(): Promise<{
  crops: Record<string, CropQuestionDataset>;
  loadedCount: number;
  fromFirestore: boolean;
}> {
  const result: Record<string, CropQuestionDataset> = {};
  let liveCount = 0;

  try {
    if (!db) {
      return { crops: result, loadedCount: 0, fromFirestore: false };
    }

    const colRef = collection(db, COLLECTION_NAME);
    const querySnapshot = await getDocs(colRef);

    querySnapshot.forEach((docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        liveCount++;
        result[docSnap.id] = {
          cropId: docSnap.id,
          cropName: d.cropName || { mr: docSnap.id, hi: docSnap.id, en: docSnap.id },
          aliases: d.aliases || [],
          category: d.category || "Horticulture",
          iconEmoji: d.iconEmoji || "🌾",
          bannerGradient: d.bannerGradient || "from-emerald-600 to-teal-700",
          activities: d.activities || {},
          updatedAt: d.updatedAt || new Date().toISOString(),
          updatedBy: d.updatedBy || "Admin",
        };
      }
    });

    return {
      crops: result,
      loadedCount: liveCount,
      fromFirestore: liveCount > 0,
    };
  } catch (err) {
    console.warn("Could not list all crop_questions from Firestore:", err);
    return { crops: result, loadedCount: 0, fromFirestore: false };
  }
}

/**
 * Delete a single crop questions document from Firestore:
 * Path: crop_questions/{cropId}
 */
export async function deleteCropQuestionsFromFirestore(
  cropId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!db) {
      throw new Error("Firestore not initialized");
    }
    await ensureAuthSession();
    const docRef = doc(db, COLLECTION_NAME, cropId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to delete crop_questions/${cropId}:`, error);
    return { success: false, error: error?.message || "Failed to delete" };
  }
}

/**
 * Delete all crop questions documents from Firestore
 */
export async function clearAllCropQuestionsFromFirestore(): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> {
  try {
    if (!db) return { success: false, deletedCount: 0 };
    await ensureAuthSession();
    const colRef = collection(db, COLLECTION_NAME);
    const snap = await getDocs(colRef);
    let count = 0;
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
      count++;
    }
    return { success: true, deletedCount: count };
  } catch (err: any) {
    return { success: false, deletedCount: 0, error: err?.message };
  }
}

/**
 * Bulk seed default crops into Firestore
 */
export async function seedAllDefaultCropsToFirestore(
  adminName: string = "Admin"
): Promise<{ success: boolean; seededCount: number; errors: string[] }> {
  const cropKeys = Object.keys(DEFAULT_CROP_DATASETS);
  let seededCount = 0;
  const errors: string[] = [];

  for (const cropKey of cropKeys) {
    const dataset = DEFAULT_CROP_DATASETS[cropKey];
    const res = await saveCropQuestionsToFirestore(dataset, adminName);
    if (res.success) {
      seededCount++;
    } else {
      errors.push(`${cropKey}: ${res.error}`);
    }
  }

  return {
    success: errors.length === 0,
    seededCount,
    errors,
  };
}
