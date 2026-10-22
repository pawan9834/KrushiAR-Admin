"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin as fbLoginAdmin, logoutAdmin as fbLogoutAdmin, AdminUserData } from "@/lib/firebase";

interface AuthContextType {
  adminUser: AdminUserData | null;
  isLoading: boolean;
  isDemoMode: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginDemo: (role?: "superadmin" | "agronomist") => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  adminUser: null,
  isLoading: true,
  isDemoMode: false,
  login: async () => ({ success: false }),
  loginDemo: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("krushiar_admin_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        setAdminUser(parsed.user);
        setIsDemoMode(parsed.isDemo || false);
      }
    } catch (e) {
      console.warn("Session restore error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    const result = await fbLoginAdmin(email, pass);
    if (result.success && result.admin) {
      setAdminUser(result.admin);
      setIsDemoMode(false);
      localStorage.setItem(
        "krushiar_admin_session",
        JSON.stringify({ user: result.admin, isDemo: false })
      );
      setIsLoading(false);
      return { success: true };
    }

    // If regular Firebase auth failed or user entered demo password, allow demo fallback if email matches
    if (email.trim() === "admin@krushiar.com" && pass.trim() === "Admin@123") {
      const demoUser: AdminUserData = {
        uid: "demo_admin_uid_777",
        email: "admin@krushiar.com",
        name: "मुख्य प्रशासक (Super Admin)",
        role: "superadmin",
        createdAt: new Date().toISOString(),
      };
      setAdminUser(demoUser);
      setIsDemoMode(true);
      localStorage.setItem(
        "krushiar_admin_session",
        JSON.stringify({ user: demoUser, isDemo: true })
      );
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, error: result.error || "Login verification failed." };
  };

  const loginDemo = (role: "superadmin" | "agronomist" = "superadmin") => {
    const demoUser: AdminUserData = {
      uid: "demo_admin_preview",
      email: role === "superadmin" ? "admin@krushiar.com" : "agronomist@krushiar.com",
      name: role === "superadmin" ? "पवन पाटील (Super Admin)" : "डॉ. साळुंखे (Senior Agronomist)",
      role: role,
      createdAt: new Date().toISOString(),
    };
    setAdminUser(demoUser);
    setIsDemoMode(true);
    localStorage.setItem(
      "krushiar_admin_session",
      JSON.stringify({ user: demoUser, isDemo: true })
    );
    router.push("/");
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fbLogoutAdmin();
    } catch (e) {
      // ignore
    }
    setAdminUser(null);
    setIsDemoMode(false);
    localStorage.removeItem("krushiar_admin_session");
    setIsLoading(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        adminUser,
        isLoading,
        isDemoMode,
        login,
        loginDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
