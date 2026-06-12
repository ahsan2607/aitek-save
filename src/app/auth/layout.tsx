"use client";

import { Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-(--bg-base) p-6">
      <div className="w-full max-w-100 space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-(--accent) flex items-center justify-center shadow-(--accent-glow)">
            <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div className="text-2xl font-bold text-(--text-primary) tracking-tight">
            Aitek<span className="text-(--accent)">Save</span>
          </div>
          <p className="text-sm text-(--text-muted) text-center">
            Backend API untuk Sistem IoT AITEK SAVE
          </p>
        </div>

        <div className="bg-(--bg-surface) border border-(--border) rounded-2xl p-8 shadow-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
