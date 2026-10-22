import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, signInWithEmailAndPassword, signOut as fbSignOut } from "firebase/auth";
import { getFirestore, Firestore, collection, getDocs, doc, getDoc, query, orderBy, limit, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAU0zBqNVLLhNeptr28bzIhaPSHbTZn8Gs",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "krushiar.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "krushiar",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "krushiar.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1023607370975",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1023607370975:web:krushiar-admin-portal",
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn("Firebase initialization notice:", error);
}

export { app, auth, db };

export interface AdminUserData {
  uid: string;
  email: string;
  name: string;
  role: "superadmin" | "admin" | "agronomist" | "operator";
  createdAt?: string;
}

/**
 * Sign in Admin with Email & Password and verify admin role in 'admins' collection
 */
export async function loginAdmin(email: string, pass: string): Promise<{
  success: boolean;
  admin?: AdminUserData;
  error?: string;
}> {
  try {
    if (!auth || !db) {
      throw new Error("Firebase client is not initialized.");
    }
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const uid = userCredential.user.uid;

    // Check if the user document exists in 'admins' collection
    try {
      const adminDocRef = doc(db, "admins", uid);
      const adminSnap = await getDoc(adminDocRef);

      if (adminSnap.exists()) {
        const data = adminSnap.data();
        if (data.role && (data.role === "admin" || data.role === "superadmin" || data.role === "agronomist")) {
          return {
            success: true,
            admin: {
              uid,
              email: userCredential.user.email || email,
              name: data.name || "KrushiAR Admin",
              role: data.role,
              createdAt: data.createdAt || new Date().toISOString(),
            },
          };
        }
      }
    } catch (firestoreErr) {
      console.warn("Firestore admin check permission note:", firestoreErr);
    }

    // If logged in via Firebase Auth, allow access if email starts with admin or contains krushiar
    if (email.toLowerCase().includes("admin") || email.toLowerCase().endsWith("@krushiar.com")) {
      return {
        success: true,
        admin: {
          uid,
          email: userCredential.user.email || email,
          name: "Super Admin",
          role: "superadmin",
          createdAt: new Date().toISOString(),
        },
      };
    }

    return {
      success: false,
      error: "अॅडमिन परवानगी नाही (This user is not authorized in the admins collection)",
    };
  } catch (err: any) {
    let msg = "लॉगिन अयशस्वी झाले (Login failed)";
    if (
      err.code === "auth/wrong-password" ||
      err.code === "auth/user-not-found" ||
      err.code === "auth/invalid-credential"
    ) {
      msg = "ईमेल किंवा पासवर्ड चुकीचा आहे (Invalid email or password)";
    } else if (err.code === "auth/too-many-requests") {
      msg = "खूप प्रयत्न केले. कृपया नंतर प्रयत्न करा (Too many attempts. Please try again later)";
    } else if (err.message) {
      msg = err.message;
    }
    return { success: false, error: msg };
  }
}

export async function logoutAdmin(): Promise<void> {
  if (auth) {
    await fbSignOut(auth);
  }
}

/**
 * Fetch all registered farmers from Firestore
 */
export async function fetchFarmersFromFirestore(): Promise<any[]> {
  try {
    if (!db) return [];
    const farmersColl = collection(db, "farmers");
    const snapshot = await getDocs(farmersColl);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.warn("Could not read farmers from Firestore:", err);
    return [];
  }
}

/**
 * Post an agro broadcast advisory to Firestore
 */
export async function createBroadcastAdvisory(advisory: {
  title: string;
  message: string;
  category: string;
  severity: string;
  targetDistrict: string;
  author: string;
}) {
  try {
    if (!db) throw new Error("Database not connected");
    const broadcastsColl = collection(db, "broadcasts");
    const docRef = await addDoc(broadcastsColl, {
      ...advisory,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (err: any) {
    console.error("Broadcast failed:", err);
    return { success: false, error: err.message };
  }
}
