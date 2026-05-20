import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { HttpMethod, KeyValuePair } from "@/types";

/**
 * Merge Tailwind class names and deduplicate conflicts.
 * Input: class values. Final state: normalized class string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Map HTTP methods to color classes.
 */
export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  POST: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  PUT: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  PATCH: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  DELETE: "text-red-400 bg-red-400/10 border-red-400/20",
  HEAD: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  OPTIONS: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
};

export const METHOD_DOT_COLORS: Record<HttpMethod, string> = {
  GET: "bg-emerald-400",
  POST: "bg-blue-400",
  PUT: "bg-amber-400",
  PATCH: "bg-violet-400",
  DELETE: "bg-red-400",
  HEAD: "bg-pink-400",
  OPTIONS: "bg-cyan-400",
};

export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return "text-emerald-400";
  if (status >= 300 && status < 400) return "text-blue-400";
  if (status >= 400 && status < 500) return "text-amber-400";
  if (status >= 500) return "text-red-400";
  return "text-zinc-400";
}

/**
 * Format a byte count into human-readable units.
 * Input: bytes. Final state: string like "1.2 KB".
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Convert enabled key/value pairs into a record.
 * Input: array of KeyValuePair. Final state: plain object.
 */
export function kvToRecord(pairs: KeyValuePair[]): Record<string, string> {
  return pairs
    .filter((p) => p.enabled && p.key.trim() !== "")
    .reduce<Record<string, string>>((acc, p) => {
      acc[p.key] = p.value;
      return acc;
    }, {});
}

/**
 * Replace {{VAR}} placeholders with values.
 * Input: template string and vars map. Final state: interpolated string.
 */
export function interpolateVariables(
  str: string,
  vars: Record<string, string>
): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export const PROJECT_COLORS = [
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#ef4444", // red
  "#10b981", // emerald
  "#6366f1", // indigo
  "#f97316", // orange
  "#06b6d4", // cyan
];

export const PROJECT_ICONS = [
  "🚀", "⚡", "🔮", "🛡️", "🔑", "📡", "🧬", "🌐", "🔧", "🎯",
  "💎", "🔥", "🌊", "🎲", "🦋",
];

export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
