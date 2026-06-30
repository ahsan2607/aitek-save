"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { Loader2, RefreshCcw, Database, ChevronRight, ChevronDown, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

import { TelemetryHistory } from "@/types";

interface HistoryPanelProps {
  endpointId: string;
}

export function HistoryPanel({ endpointId }: HistoryPanelProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["telemetry-history", endpointId],
    queryFn: async () => {
      // Fetch last 50 records from the past 24 hours as default
      const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      return api.get<{ data: TelemetryHistory[] }>(
        `/api/v1/telemetry/${endpointId}/history?start_time=${startTime}&limit=50`
      );
    },
  });

  const history = data?.data || [];

  // Determine dynamic columns from history[].data.data
  const dynamicColumns = React.useMemo(() => {
    const keys = new Set<string>();
    history.forEach((entry) => {
      const responseData = entry.data?.data;
      if (Array.isArray(responseData)) {
        responseData.forEach((obj) => {
          if (typeof obj === "object" && obj !== null) {
            Object.keys(obj).forEach((key) => keys.add(key));
          }
        });
      }
    });
    return Array.from(keys);
  }, [history]);

  const toggleRow = (idx: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedRows(newExpanded);
  };

  const getPayloadPreview = (payload: any) => {
    try {
      const keys = Object.keys(payload);
      if (keys.length === 0) return "{}";
      const previewKeys = keys.slice(0, 3);
      const hasMore = keys.length > 3;
      
      const preview = previewKeys.map(k => {
        const val = payload[k];
        const displayVal = typeof val === 'object' ? '{...}' : JSON.stringify(val);
        return `${k}: ${displayVal}`;
      }).join(", ");

      return `{ ${preview}${hasMore ? ", ..." : ""} }`;
    } catch (e) {
      return "Invalid data";
    }
  };

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

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-(--text-muted) gap-3">
            <Loader2 className="w-8 h-8 animate-spin opacity-50" />
            <p className="text-xs">Fetching telemetry data...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-400 gap-3">
            <Database className="w-8 h-8 opacity-50" />
            <p className="text-xs">Failed to load history</p>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-(--text-muted) gap-3">
            <Database className="w-8 h-8 opacity-20" />
            <p className="text-xs">No telemetry data found for this device</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-(--bg-surface) border-b border-(--border)">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">Timestamp</th>
                <th className="px-4 py-3 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">Status</th>
                {dynamicColumns.map((col) => (
                  <th key={col} className="px-4 py-3 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">
                    {col}
                  </th>
                ))}
                {dynamicColumns.length === 0 && (
                  <th className="px-4 py-3 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">Payload Preview</th>
                )}
                <th className="w-20 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border)">
              {history.map((entry, idx) => {
                const isExpanded = expandedRows.has(idx);
                const responseStatus = entry.data?.status;
                const firstDataItem = entry.data?.data?.[0];

                return (
                  <React.Fragment key={idx}>
                    <tr 
                      onClick={() => toggleRow(idx)}
                      className={cn(
                        "group cursor-pointer hover:bg-(--bg-overlay) transition-colors",
                        isExpanded && "bg-(--bg-surface)"
                      )}
                    >
                      <td className="px-4 py-3 text-center">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-(--text-muted)" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-(--text-muted)" />
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-mono text-(--text-secondary)">
                          {format(new Date(entry.timestamp), "yyyy-MM-dd HH:mm:ss")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border",
                          responseStatus >= 200 && responseStatus < 300 
                            ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                            : responseStatus 
                              ? "bg-red-400/10 text-red-400 border-red-400/20"
                              : "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                        )}>
                          {responseStatus || "RECEIVED"}
                        </span>
                      </td>
                      {dynamicColumns.map((col) => {
                        const val = firstDataItem?.[col];
                        return (
                          <td key={col} className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs font-mono text-(--text-muted)">
                              {val !== undefined ? (typeof val === 'object' ? JSON.stringify(val) : String(val)) : "-"}
                            </span>
                          </td>
                        );
                      })}
                      {dynamicColumns.length === 0 && (
                        <td className="px-4 py-3 max-w-md truncate">
                          <span className="text-xs font-mono text-(--text-muted)">
                            {getPayloadPreview(entry.data)}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3 text-right">
                        <button className="p-1 rounded-md text-(--text-muted) group-hover:text-(--accent) transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-(--bg-surface)">
                        <td colSpan={(dynamicColumns.length || 1) + 4} className="px-8 py-4 border-t border-(--border)/50">
                          <div className="relative">
                            <div className="absolute top-2 right-2 text-[10px] font-bold text-(--text-muted) uppercase">Full Payload</div>
                            <pre className="text-xs font-mono text-(--text-secondary) bg-(--bg-elevated) p-4 rounded-xl border border-(--border) overflow-x-auto">
                              {JSON.stringify(entry.data, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
