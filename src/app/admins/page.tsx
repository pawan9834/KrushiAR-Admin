"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/context/AuthContext";
import {
  UserPlus,
  CheckCircle2,
  Copy,
  Check,
  Shield
} from "lucide-react";

interface AdminMember {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "agronomist" | "operator";
  createdAt: string;
}

const INITIAL_ADMINS: AdminMember[] = [
  {
    id: "adm_01",
    name: "Pawan Patil",
    email: "admin@krushiar.com",
    role: "superadmin",
    createdAt: "2026-10-14T11:00:00Z",
  },
  {
    id: "adm_02",
    name: "Dr. A. B. Salunkhe",
    email: "agronomist@krushiar.com",
    role: "agronomist",
    createdAt: "2026-10-10T14:30:00Z",
  },
];

export default function AdminsPage() {
  const { adminUser } = useAuth();
  const [admins, setAdmins] = useState<AdminMember[]>(INITIAL_ADMINS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // New admin form
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"superadmin" | "agronomist" | "operator">("agronomist");

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) return;

    const newMember: AdminMember = {
      id: `adm_${Date.now()}`,
      name: newName,
      email: newEmail,
      role: newRole,
      createdAt: new Date().toISOString(),
    };

    setAdmins([...admins, newMember]);
    setNewEmail("");
    setNewName("");
    setShowAddModal(false);
  };

  const copyRuleCode = () => {
    const rules = `// Firestore Security Rules for Admins
match /admins/{adminId} {
  allow read, write: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}
match /farmers/{userId} {
  allow read, write: if request.auth != null && (request.auth.uid == userId || exists(/databases/$(database)/documents/admins/$(request.auth.uid)));
}`;
    navigator.clipboard.writeText(rules);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <DashboardShell
      title="Admin Team & Access Control"
      subtitle="Manage staff access, email/password permissions and Firestore roles"
    >
      <div className="space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-slate-900">Authorized Administrators</h3>
            <p className="text-xs text-slate-500">
              Only UIDs listed with role: &apos;admin&apos; in Cloud Firestore &apos;admins&apos; collection have access.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Admin</span>
          </button>
        </div>

        {/* Admins Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Added Date</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admins.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        {member.name.charAt(0)}
                      </div>
                      <span>{member.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{member.email}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          member.role === "superadmin"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : member.role === "agronomist"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-blue-100 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500" suppressHydrationWarning>
                      {new Date(member.createdAt).toLocaleDateString("en-US")}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cloud Firestore Security Rules Reference Card */}
        <div className="p-5 lg:p-6 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">Firestore Security Rules Configuration</h4>
            </div>
            <button
              onClick={copyRuleCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-mono transition-colors cursor-pointer border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Rules"}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            These rules restrict read and write access to the <code className="text-emerald-300">admins</code> and <code className="text-emerald-300">farmers</code> collections so only verified administrators have access across the web portal.
          </p>
          <pre className="p-3.5 rounded-xl bg-slate-950 font-mono text-[11px] text-emerald-300/90 overflow-x-auto border border-slate-800">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    match /admins/{adminId} {
      allow read, write: if isAdmin();
    }
    match /farmers/{userId} {
      allow read, write: if request.auth != null && (request.auth.uid == userId || isAdmin());
      match /{allChildren=**} {
        allow read, write: if request.auth != null && (request.auth.uid == userId || isAdmin());
      }
    }
  }
}`}
          </pre>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Administrator</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter email address and assign appropriate role.
            </p>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rahul Jadhav"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="rahul@krushiar.com"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="superadmin">Super Admin (Full Access)</option>
                  <option value="agronomist">Agronomist (Advisories & Crop Expert)</option>
                  <option value="operator">Field Operator (Farmer Support)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Save Admin
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
