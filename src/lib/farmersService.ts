import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import type { Farmer, FarmerPlot, FarmerCrop, FarmActivity } from "@/lib/mockData";

/**
 * Format date string safely
 */
function formatDateSafe(val?: any): string {
  if (!val) return "Recent";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(val);
  }
}

/**
 * Extract location display string
 */
function formatLocation(loc?: any, fallbackVillage?: string, fallbackDistrict?: string): string {
  if (!loc) {
    return [fallbackVillage, fallbackDistrict].filter(Boolean).join(", ") || "Maharashtra";
  }
  if (typeof loc === "string") return loc;
  if (typeof loc === "object") {
    if (loc.placeName) return loc.placeName;
    if (loc.latitude && loc.longitude) {
      return `${Number(loc.latitude).toFixed(4)}, ${Number(loc.longitude).toFixed(4)}`;
    }
  }
  return [fallbackVillage, fallbackDistrict].filter(Boolean).join(", ") || "Maharashtra";
}

/**
 * Fetches all farmers from Firestore with their subcollections (crops, plots, activities)
 */
export async function fetchLiveFarmers(): Promise<Farmer[]> {
  if (!db) return [];

  try {
    const farmersColl = collection(db, "farmers");
    const snapshot = await getDocs(farmersColl);

    const farmersList: Farmer[] = [];

    for (const fDoc of snapshot.docs) {
      const data = fDoc.data();
      const farmerId = fDoc.id;

      // Fetch crops subcollection
      const crops: FarmerCrop[] = [];
      try {
        const cropSnap = await getDocs(collection(db, "farmers", farmerId, "crops"));
        cropSnap.forEach((cDoc) => {
          const cData = cDoc.data();
          crops.push({
            id: cDoc.id,
            name: cData.name || cData.cropName || "Crop",
            variety: cData.variety || "Standard",
            plotName: cData.plotName || "Main Field",
            areaAcre: Number(cData.area || cData.areaAcre || 0),
            sowingDate: formatDateSafe(cData.sowingDate),
            status: cData.status || "growing",
          });
        });
      } catch (err) {
        console.warn(`Could not load crops for ${farmerId}:`, err);
      }

      // Fetch plots subcollection
      const plots: FarmerPlot[] = [];
      try {
        const plotSnap = await getDocs(collection(db, "farmers", farmerId, "plots"));
        plotSnap.forEach((pDoc) => {
          const pData = pDoc.data();
          plots.push({
            id: pDoc.id,
            name: pData.name || "Plot",
            acreage: Number(pData.area || pData.acreage || 0),
            soilType: pData.soilType || "काळी कसदार जमीन (Fertile Soil)",
            irrigationSource: pData.irrigationType || pData.irrigationSource || "ठिबक सिंचन (Drip)",
          });
        });
      } catch (err) {
        console.warn(`Could not load plots for ${farmerId}:`, err);
      }

      // Fetch activities subcollection
      let activitiesCount = 0;
      let totalExpenses = 0;
      try {
        const actSnap = await getDocs(collection(db, "farmers", farmerId, "activities"));
        activitiesCount = actSnap.size;
        actSnap.forEach((aDoc) => {
          const aData = aDoc.data();
          const cost = Number(aData.totalExpense || aData.cost || 0);
          totalExpenses += isNaN(cost) ? 0 : cost;
        });
      } catch (err) {
        console.warn(`Could not load activities for ${farmerId}:`, err);
      }

      const totalAcreage =
        Number(data.totalArea || data.totalAcreage) ||
        plots.reduce((sum, p) => sum + p.acreage, 0) ||
        crops.reduce((sum, c) => sum + c.areaAcre, 0);

      farmersList.push({
        id: farmerId,
        fullName: data.name || data.fullName || "Field Farmer",
        phoneNumber: data.phone || data.phoneNumber || "N/A",
        village: data.village || "N/A",
        taluka: data.taluka || "",
        district: data.district || "Maharashtra",
        totalAcreage: totalAcreage || 0,
        plots,
        crops,
        avatarUrl: data.avatarUri || data.photoUrl,
        registeredAt: formatDateSafe(data.createdDate || data.createdAt),
        totalExpenses,
        activitiesCount,
        email: data.email,
        dob: data.dob,
        state: data.state,
        pincode: data.pincode,
        gender: data.gender,
      });
    }

    return farmersList;
  } catch (error) {
    console.error("Error fetching live farmers from Firestore:", error);
    return [];
  }
}

/**
 * Fetches a single farmer by ID from Firestore with all their subcollections
 */
export async function fetchLiveFarmerById(farmerId: string): Promise<{
  farmer: Farmer;
  activities: FarmActivity[];
  crops: FarmerCrop[];
  plots: FarmerPlot[];
} | null> {
  if (!db || !farmerId) return null;

  try {
    const farmerRef = doc(db, "farmers", farmerId);
    const farmerSnap = await getDoc(farmerRef);

    if (!farmerSnap.exists()) {
      return null;
    }

    const data = farmerSnap.data();

    // Fetch crops
    const crops: FarmerCrop[] = [];
    try {
      const cropSnap = await getDocs(collection(db, "farmers", farmerId, "crops"));
      cropSnap.forEach((cDoc) => {
        const cData = cDoc.data();
        crops.push({
          id: cDoc.id,
          name: cData.name || cData.cropName || "Crop",
          variety: cData.variety || "Standard",
          plotName: cData.plotName || "Main Field",
          areaAcre: Number(cData.area || cData.areaAcre || 0),
          sowingDate: formatDateSafe(cData.sowingDate),
          status: cData.status || "growing",
        });
      });
    } catch (err) {
      console.warn(`Could not load crops for ${farmerId}:`, err);
    }

    // Fetch plots
    const plots: FarmerPlot[] = [];
    try {
      const plotSnap = await getDocs(collection(db, "farmers", farmerId, "plots"));
      plotSnap.forEach((pDoc) => {
        const pData = pDoc.data();
        plots.push({
          id: pDoc.id,
          name: pData.name || "Plot",
          acreage: Number(pData.area || pData.acreage || 0),
          soilType: pData.soilType || "काळी कसदार जमीन",
          irrigationSource: pData.irrigationType || pData.irrigationSource || "ठिबक सिंचन",
        });
      });
    } catch (err) {
      console.warn(`Could not load plots for ${farmerId}:`, err);
    }

    // Fetch activities
    const activities: FarmActivity[] = [];
    let totalExpenses = 0;
    try {
      const actSnap = await getDocs(collection(db, "farmers", farmerId, "activities"));
      actSnap.forEach((aDoc) => {
        const aData = aDoc.data();
        const cost = Number(aData.totalExpense || aData.cost || 0);
        totalExpenses += isNaN(cost) ? 0 : cost;

        const locStr = formatLocation(aData.location, data.village, data.district);

        // Inputs used extraction
        let inputsUsed: string[] = [];
        if (Array.isArray(aData.expenses) && aData.expenses.length > 0) {
          inputsUsed = aData.expenses.map((e: any) => `${e.title || e.category} (₹${e.amount})`);
        } else if (Array.isArray(aData.inputsUsed)) {
          inputsUsed = aData.inputsUsed;
        }

        activities.push({
          id: aDoc.id,
          farmerId,
          farmerName: data.name || data.fullName || "Farmer",
          farmerPhone: data.phone || data.phoneNumber || "N/A",
          cropName: aData.cropName || "General",
          plotName: aData.plotName || "Field",
          activityType: aData.activityType || "other",
          title: aData.activityTitle || aData.title || "Farm Activity",
          description:
            aData.aiSummary ||
            aData.notes ||
            aData.voiceTranscript ||
            aData.description ||
            "Field Record",
          cost,
          date: aData.date || aData.createdAt || new Date().toISOString(),
          photoUrl: aData.photoUri || aData.photoUrl,
          audioDuration: aData.audioDuration || "0:30",
          hasAudio: Boolean(aData.audioUri),
          audioUri: aData.audioUri,
          location: locStr,
          inputsUsed: inputsUsed.length > 0 ? inputsUsed : undefined,
          dosage: aData.dosage,
          voiceTranscript: aData.voiceTranscript,
          aiSummary: aData.aiSummary,
        });
      });
    } catch (err) {
      console.warn(`Could not load activities for ${farmerId}:`, err);
    }

    // Sort activities latest first
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalAcreage =
      Number(data.totalArea || data.totalAcreage) ||
      plots.reduce((sum, p) => sum + p.acreage, 0) ||
      crops.reduce((sum, c) => sum + c.areaAcre, 0);

    const farmer: Farmer = {
      id: farmerId,
      fullName: data.name || data.fullName || "Field Farmer",
      phoneNumber: data.phone || data.phoneNumber || "N/A",
      village: data.village || "N/A",
      taluka: data.taluka || "",
      district: data.district || "Maharashtra",
      totalAcreage: totalAcreage || 0,
      plots,
      crops,
      avatarUrl: data.avatarUri || data.photoUrl,
      registeredAt: formatDateSafe(data.createdDate || data.createdAt),
      totalExpenses,
      activitiesCount: activities.length,
      email: data.email,
      dob: data.dob,
      state: data.state,
      pincode: data.pincode,
      gender: data.gender,
    };

    return {
      farmer,
      activities,
      crops,
      plots,
    };
  } catch (err) {
    console.error(`Error loading farmer ${farmerId} from Firestore:`, err);
    return null;
  }
}

/**
 * Fetch all activities across all live farmers from Firestore
 */
export async function fetchLiveAllActivities(): Promise<{
  activities: FarmActivity[];
  farmers: Farmer[];
}> {
  if (!db) return { activities: [], farmers: [] };

  try {
    const farmers = await fetchLiveFarmers();
    const allActivities: FarmActivity[] = [];

    for (const f of farmers) {
      try {
        const actSnap = await getDocs(collection(db, "farmers", f.id, "activities"));
        actSnap.forEach((aDoc) => {
          const aData = aDoc.data();
          const cost = Number(aData.totalExpense || aData.cost || 0);

          let inputsUsed: string[] = [];
          if (Array.isArray(aData.expenses) && aData.expenses.length > 0) {
            inputsUsed = aData.expenses.map((e: any) => `${e.title || e.category} (₹${e.amount})`);
          } else if (Array.isArray(aData.inputsUsed)) {
            inputsUsed = aData.inputsUsed;
          }

          allActivities.push({
            id: aDoc.id,
            farmerId: f.id,
            farmerName: f.fullName,
            farmerPhone: f.phoneNumber,
            cropName: aData.cropName || "General",
            plotName: aData.plotName || "Field",
            activityType: aData.activityType || "other",
            title: aData.activityTitle || aData.title || "Farm Activity",
            description:
              aData.aiSummary ||
              aData.notes ||
              aData.voiceTranscript ||
              aData.description ||
              "Field Record",
            cost: isNaN(cost) ? 0 : cost,
            date: aData.date || aData.createdAt || new Date().toISOString(),
            photoUrl: aData.photoUri || aData.photoUrl,
            audioDuration: aData.audioDuration || "0:30",
            hasAudio: Boolean(aData.audioUri),
            audioUri: aData.audioUri,
            location: formatLocation(aData.location, f.village, f.district),
            inputsUsed: inputsUsed.length > 0 ? inputsUsed : undefined,
            dosage: aData.dosage,
            voiceTranscript: aData.voiceTranscript,
            aiSummary: aData.aiSummary,
          });
        });
      } catch (err) {
        console.warn(`Could not load activities for farmer ${f.id}:`, err);
      }
    }

    allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      activities: allActivities,
      farmers,
    };
  } catch (err) {
    console.error("Error fetching all live activities:", err);
    return { activities: [], farmers: [] };
  }
}
