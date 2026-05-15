"use client";

import { useEffect, useRef } from "react";
import { Copy, Trash2 } from "lucide-react";

interface EndpointContextMenuProps {
  endpointId: string;
  x: number;
  y: number;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function EndpointContextMenu({
  x, y, onDuplicate, onDelete, onClose,
}: EndpointContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Adjust position to stay within viewport
  const adjustedX = Math.min(x, window.innerWidth - 160);
  const adjustedY = Math.min(y, window.innerHeight - 100);

  return (
    <div
      ref={ref}
      style={{ position: "fixed", left: adjustedX, top: adjustedY, zIndex: 9999 }}
      className="w-40 rounded-xl border border-(--border-strong) bg-(--bg-overlay) shadow-2xl overflow-hidden animate-fade-in"
    >
      <button
        onClick={onDuplicate}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-(--text-secondary) hover:bg-(--bg-elevated) hover:text-(--text-primary) transition-colors"
      >
        <Copy className="w-3.5 h-3.5" />
        Duplicate
      </button>
      <div className="h-px bg-(--border) mx-2" />
      <button
        onClick={onDelete}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-400/10 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>
    </div>
  );
}
