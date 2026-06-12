"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { Loader2, RefreshCcw, Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryPanelProps {
  endpointId: string;
}

export function HistoryPanel({ endpointId }: HistoryPanelProps) {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["telemetry-history", endpointId],
    queryFn: async () => {
      // Fetch last 50 records from the past 24 hours as default
      const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      return api.get<{ data: any[] }>(
        `/api/v1/telemetry/${endpointId}/history?start_time=${startTime}&limit=50`
      );
    },
  });

  const history = data?.data || [];

  return (
    <div className="flex flex-col h-full bg-(--bg-base)">
      <div className="flex items-center justify-between px-6 py-4 border-b border-(--border) bg-(--bg-surface)">
        <div>
          <h3 className="text-sm font-semibold text-(--text-primary)">Telemetry History</h3>
          <p className="text-[11px] text-(--text-muted)">Latest 50 data points from the last 24h</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 rounded-lg text-(--text-muted) hover:text-(--accent) hover:bg-(--accent-glow) transition-all disabled:opacity-50"
        >
          <RefreshCcw className={cn("w-4 h-4", isFetching && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-(--text-muted) gap-3">
            <Loader2 className="w-8 h-8 animate-spin opacity-50" />
            <p className="text-xs">Fetching telemetry data...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-full text-red-400 gap-3">
            <Database className="w-8 h-8 opacity-50" />
            <p className="text-xs">Failed to load history</p>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-(--text-muted) gap-3">
            <Database className="w-8 h-8 opacity-20" />
            <p className="text-xs">No telemetry data found for this device</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((entry, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-(--border) bg-(--bg-surface) space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-(--text-muted)">
                    {format(new Date(entry.timestamp), "yyyy-MM-dd HH:mm:ss")}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-400 text-[10px] font-bold border border-emerald-400/20">
                    RECEIVED
                  </span>
                </div>
                <pre className="text-xs font-mono text-(--text-secondary) bg-(--bg-elevated) p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(entry.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
