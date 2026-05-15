"use client";

import { useState } from "react";
import type { EndpointResponse } from "@/types";
import { getStatusColor, formatBytes, formatDuration, cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";

interface ResponsePanelProps {
  response: EndpointResponse | undefined;
  isLoading: boolean;
}

type ResponseTab = "body" | "headers";

export function ResponsePanel({ response, isLoading }: ResponsePanelProps) {
  const [tab, setTab] = useState<ResponseTab>("body");
  const [copied, setCopied] = useState(false);

  function copyBody() {
    if (!response) return;
    const text =
      typeof response.body === "string"
        ? response.body
        : JSON.stringify(response.body, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-(--text-muted)">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 rounded-full border-2 border-(--accent) opacity-20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-(--accent) animate-spin" />
        </div>
        <span className="text-sm">Sending request…</span>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-8">
        <div className="text-4xl mb-2 opacity-40">📭</div>
        <p className="text-sm text-(--text-secondary)">No response yet</p>
        <p className="text-xs text-(--text-muted)">Send a request to see the response here</p>
      </div>
    );
  }

  const bodyText =
    typeof response.body === "string"
      ? response.body
      : JSON.stringify(response.body, null, 2);

  const headerEntries = Object.entries(response.headers ?? {});

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-b border-(--border) bg-(--bg-surface)">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-bold font-mono", getStatusColor(response.status))}>
            {response.status}
          </span>
          <span className="text-xs text-(--text-muted)">{response.statusText}</span>
        </div>
        <div className="h-3 w-px bg-(--border)" />
        <span className="text-xs text-(--text-muted)">
          {formatDuration(response.durationMs)}
        </span>
        <div className="h-3 w-px bg-(--border)" />
        <span className="text-xs text-(--text-muted)">
          {formatBytes(response.size)}
        </span>

        <div className="ml-auto flex items-center gap-1">
          {/* Tabs */}
          {(["body", "headers"] as ResponseTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize",
                tab === t
                  ? "bg-(--bg-overlay) text-(--text-primary)"
                  : "text-(--text-muted) hover:text-(--text-primary)"
              )}
            >
              {t}
              {t === "headers" && (
                <span className="ml-1 text-[10px] text-(--text-muted)">
                  ({headerEntries.length})
                </span>
              )}
            </button>
          ))}

          <button
            onClick={copyBody}
            className="ml-1 p-1.5 rounded-md text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-overlay) transition-colors"
            title="Copy response"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      {tab === "body" && (
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-xs font-mono text-(--text-primary) leading-relaxed whitespace-pre-wrap break-all">
            {bodyText || <span className="text-(--text-muted)">(empty body)</span>}
          </pre>
        </div>
      )}

      {/* Headers */}
      {tab === "headers" && (
        <div className="flex-1 overflow-auto p-4">
          {headerEntries.length === 0 ? (
            <p className="text-xs text-(--text-muted)">No headers</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-(--border)">
                  <th className="text-left py-1 pr-4 text-(--text-muted) font-semibold uppercase tracking-wider text-[10px]">
                    Key
                  </th>
                  <th className="text-left py-1 text-(--text-muted) font-semibold uppercase tracking-wider text-[10px]">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {headerEntries.map(([k, v]) => (
                  <tr key={k} className="border-b border-(--border) last:border-0">
                    <td className="py-1.5 pr-4 font-mono text-(--accent) font-medium align-top">
                      {k}
                    </td>
                    <td className="py-1.5 font-mono text-(--text-secondary) break-all">
                      {v}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
