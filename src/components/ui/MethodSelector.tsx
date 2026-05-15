"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import type { HttpMethod } from "@/types";
import { METHOD_COLORS, cn } from "@/lib/utils";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

interface MethodSelectorProps {
  value: HttpMethod;
  onChange: (method: HttpMethod) => void;
}

export function MethodSelector({ value, onChange }: MethodSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1 px-3 py-2 rounded-l-xl border-r-0 border rounded-r-none text-sm font-bold font-mono transition-colors",
          METHOD_COLORS[value]
        )}
      >
        {value}
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-32 rounded-xl border border-(--border-strong) bg-(--bg-overlay) shadow-xl overflow-hidden z-50 animate-fade-in">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { onChange(m); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold hover:bg-(--bg-elevated) transition-colors",
                METHOD_COLORS[m],
                m === value && "bg-(--bg-elevated)"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
