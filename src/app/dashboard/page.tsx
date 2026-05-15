"use client";

import { Toaster } from "react-hot-toast";
import { Sidebar } from "@/components/layout/Sidebar";
import { MainPanel } from "@/components/layout/MainPanel";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function DashboardPage() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen w-screen overflow-hidden bg-(--bg-base)">
        <Sidebar />
        <MainPanel />
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--bg-overlay)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-strong)",
            borderRadius: "10px",
            fontSize: "13px",
            fontFamily: "Space Grotesk, sans-serif",
          },
        }}
      />
    </QueryClientProvider>
  );
}
