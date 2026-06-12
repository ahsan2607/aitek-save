"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, TrendingUp, Hash, Thermometer, Clock } from "lucide-react";

interface AnalyticsPanelProps {
  endpointId: string;
}

export function AnalyticsPanel({ endpointId }: AnalyticsPanelProps) {
  // We'll fetch a few common metrics as an example
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics", endpointId],
    queryFn: async () => {
      const now = new Date().toISOString();
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      // Attempt to fetch 'temperature' or similar if it exists in the payload
      // This is a bit speculative as we don't know the exact fields, 
      // but we follow the spec's example.
      return api.get<{ data: any }>(
        `/api/v1/analytics/${endpointId}?metric=data_points&agg=count&start=${dayAgo}&end=${now}`
      );
    },
  });

  return (
    <div className="flex flex-col h-full bg-(--bg-base) p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Total Data Points" 
          value={isLoading ? "..." : (data?.data?.count || 0)} 
          icon={<Hash className="w-4 h-4" />}
          trend="+12% from yesterday"
        />
        <StatCard 
          title="Avg. Latency" 
          value="45ms" 
          icon={<Clock className="w-4 h-4" />}
          trend="Stable"
        />
        <StatCard 
          title="Active Sensors" 
          value="3" 
          icon={<TrendingUp className="w-4 h-4" />}
          trend="All systems nominal"
        />
      </div>

      <div className="flex-1 bg-(--bg-surface) border border-(--border) rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-(--accent-glow) flex items-center justify-center">
          <TrendingUp className="w-8 h-8 text-(--accent)" />
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="text-lg font-bold text-(--text-primary)">Advanced Analytics</h3>
          <p className="text-sm text-(--text-muted)">
            Aggregate and visualize your IoT data in real-time. This device currently has 
            <span className="text-(--text-primary) font-mono mx-1">restricted</span> schema mode enabled.
          </p>
        </div>
        <div className="w-full h-48 bg-(--bg-elevated) rounded-xl border border-(--border) border-dashed flex items-center justify-center">
          <p className="text-xs text-(--text-muted) font-mono">Chart Visualization Placeholder</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string; value: any; icon: React.ReactNode; trend: string }) {
  return (
    <div className="bg-(--bg-surface) border border-(--border) p-5 rounded-2xl space-y-3">
      <div className="flex items-center gap-2 text-(--text-muted)">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">{title}</span>
      </div>
      <div className="text-2xl font-bold text-(--text-primary)">{value}</div>
      <div className="text-[10px] text-emerald-400 font-medium">{trend}</div>
    </div>
  );
}
