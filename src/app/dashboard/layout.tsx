"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "next/navigation";
import { useProfileSync } from "@/lib/hooks/useProfileSync";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { auth, hasHydrated } = useAppStore();
  const router = useRouter();
  
  // Keep profile data fresh
  useProfileSync();

  useEffect(() => {
    if (hasHydrated && !auth.isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [hasHydrated, auth.isAuthenticated, router]);

  if (!hasHydrated || !auth.isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-(--bg-base)">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-(--bg-surface) border border-(--border) flex items-center justify-center shadow-xl">
            <div className="w-6 h-6 rounded-full border-2 border-(--accent) border-t-transparent animate-spin" />
          </div>
          <p className="text-xs font-medium text-(--text-muted) animate-pulse">Initializing workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-(--bg-base)">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
