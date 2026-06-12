"use client";

import { useAppStore } from "@/store/useAppStore";
import { User as UserIcon, Mail, Shield, Bell, Loader2, Check, Edit2, X } from "lucide-react";
import { useProfileSync } from "@/lib/hooks/useProfileSync";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { auth } = useAppStore();
  const { updateProfile, isUpdating } = useProfileSync();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (auth.user?.name) {
      setName(auth.user.name);
    }
  }, [auth.user?.name]);

  const handleUpdate = () => {
    if (!name.trim() || name === auth.user?.name) {
      setIsEditing(false);
      return;
    }
    updateProfile(name, {
      onSuccess: () => setIsEditing(false),
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-(--text-primary)">Settings</h1>
          <p className="text-(--text-muted) text-sm mt-1">Manage your account and application preferences</p>
        </div>

        {/* Profile Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-(--border) pb-2">
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-(--accent)" />
              <h2 className="font-semibold text-(--text-primary)">Profile</h2>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-semibold text-(--accent) hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setIsEditing(false); setName(auth.user?.name || ""); }}
                  className="text-xs font-semibold text-(--text-muted) hover:text-(--text-primary) flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating || !name.trim()}
                  className="text-xs font-semibold text-(--accent) hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Save Changes
                </button>
              </div>
            )}
          </div>
          
          <div className="grid gap-4 bg-(--bg-surface) p-6 rounded-2xl border border-(--border)">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-(--text-muted) uppercase tracking-wider">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full max-w-md px-3 py-2 rounded-xl bg-(--bg-elevated) border border-(--border) text-sm text-(--text-primary) outline-none focus:border-(--accent) transition-all"
                  placeholder="Enter your name"
                  autoFocus
                />
              ) : (
                <span className="text-(--text-primary) font-medium">{auth.user?.name || "N/A"}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-(--text-muted) uppercase tracking-wider">Email Address</span>
              <span className="text-(--text-primary)">{auth.user?.email || "N/A"}</span>
              <p className="text-[10px] text-(--text-muted)">Email address cannot be changed.</p>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-(--border)">
            <Shield className="w-5 h-5 text-(--accent)" />
            <h2 className="font-semibold text-(--text-primary)">Security</h2>
          </div>
          <div className="bg-(--bg-surface) p-6 rounded-2xl border border-(--border)">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-sm font-medium text-(--text-primary)">API Key</span>
                <p className="text-xs text-(--text-muted)">Your personal API key for programmatic access</p>
              </div>
              <code className="px-3 py-1.5 rounded-lg bg-(--bg-elevated) border border-(--border) text-xs font-mono text-(--accent)">
                {auth.user?.user_api_key ? `••••••••${auth.user.user_api_key.slice(-4)}` : "Not available"}
              </code>
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-(--border)">
            <Bell className="w-5 h-5 text-(--accent)" />
            <h2 className="font-semibold text-(--text-primary)">Notifications</h2>
          </div>
          <div className="bg-(--bg-surface) p-6 rounded-2xl border border-(--border)">
            <p className="text-sm text-(--text-muted)">Notification settings coming soon.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
