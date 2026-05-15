"use client";

import { Plus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import type { KeyValuePair } from "@/types";
import { cn } from "@/lib/utils";

interface KeyValueEditorProps {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  label?: string;
}

export function KeyValueEditor({
  pairs, onChange, keyPlaceholder = "Key", valuePlaceholder = "Value", label,
}: KeyValueEditorProps) {
  function addRow() {
    onChange([...pairs, { id: uuidv4(), key: "", value: "", enabled: true }]);
  }

  function updateRow(id: string, field: keyof KeyValuePair, value: string | boolean) {
    onChange(pairs.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  function removeRow(id: string) {
    onChange(pairs.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-2">
      {label && (
        <div className="text-xs font-medium text-(--text-muted) uppercase tracking-wider">
          {label}
        </div>
      )}

      {pairs.length === 0 ? (
        <div className="text-xs text-(--text-muted) py-3 text-center border border-dashed border-(--border) rounded-lg">
          No {label?.toLowerCase() ?? "items"} yet
        </div>
      ) : (
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-[20px_1fr_1fr_28px] gap-2 px-1 mb-1">
            <div />
            <div className="text-[10px] font-semibold text-(--text-muted) uppercase tracking-wider">Key</div>
            <div className="text-[10px] font-semibold text-(--text-muted) uppercase tracking-wider">Value</div>
            <div />
          </div>

          {pairs.map((pair) => (
            <div
              key={pair.id}
              className={cn(
                "grid grid-cols-[20px_1fr_1fr_28px] gap-2 items-center",
                !pair.enabled && "opacity-40"
              )}
            >
              {/* Toggle */}
              <button
                type="button"
                onClick={() => updateRow(pair.id, "enabled", !pair.enabled)}
                className={cn(
                  "w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-colors",
                  pair.enabled
                    ? "border-(--accent) bg-(--accent)"
                    : "border-(--border) bg-transparent"
                )}
              />

              {/* Key */}
              <input
                type="text"
                value={pair.key}
                onChange={(e) => updateRow(pair.id, "key", e.target.value)}
                placeholder={keyPlaceholder}
                className="w-full px-2 py-1.5 rounded-md bg-(--bg-surface) border border-(--border) text-xs text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent) font-mono transition-colors"
              />

              {/* Value */}
              <input
                type="text"
                value={pair.value}
                onChange={(e) => updateRow(pair.id, "value", e.target.value)}
                placeholder={valuePlaceholder}
                className="w-full px-2 py-1.5 rounded-md bg-(--bg-surface) border border-(--border) text-xs text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent) font-mono transition-colors"
              />

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeRow(pair.id)}
                className="p-1 rounded-md text-(--text-muted) hover:text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs text-(--text-muted) hover:text-(--accent) transition-colors mt-1"
      >
        <Plus className="w-3 h-3" />
        Add {label ? label.slice(0, -1) : "item"}
      </button>
    </div>
  );
}
