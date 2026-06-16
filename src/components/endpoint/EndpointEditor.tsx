"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { 
  Trash2, Copy, ChevronDown, ChevronRight, 
  Settings2, Activity, BarChart3, Globe, Lock
} from "lucide-react";
import type { Endpoint, EndpointField, FieldType, FieldLocation } from "@/types";
import { slugify, endpointFullUrl, PROTOCOLS } from "@/types";
import toast from "react-hot-toast";
import { HistoryPanel } from "./HistoryPanel";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { useEndpointSync } from "@/lib/hooks/useEndpointSync";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<FieldType, string> = {
  string:  "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  number:  "text-blue-400 bg-blue-400/10 border-blue-400/20",
  boolean: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  object:  "text-amber-400 bg-amber-400/10 border-amber-400/20",
  array:   "text-orange-400 bg-orange-400/10 border-orange-400/20",
  date:    "text-pink-400 bg-pink-400/10 border-pink-400/20",
  email:   "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  url:     "text-teal-400 bg-teal-400/10 border-teal-400/20",
  uuid:    "text-rose-400 bg-rose-400/10 border-rose-400/20",
  any:     "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
};

const PROTOCOL_COLORS: Record<string, string> = {
  GET:    "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  POST:   "text-blue-400 bg-blue-400/10 border-blue-400/20",
  DETAIL: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  UPDATE: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  DELETE: "text-red-400 bg-red-400/10 border-red-400/20",
};

/**
 * Render a read-only recursive field row.
 */
function ReadOnlyFieldRow({
  field,
  depth,
}: {
  field: EndpointField;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = (field.type === "object" || field.type === "array") && field.children.length > 0;
  const indentPx = depth * 16;

  return (
    <div style={{ marginLeft: indentPx }}>
      <div className="group rounded-xl border border-(--border) bg-(--bg-base) p-3 space-y-2 transition-colors">
        <div className="flex items-center gap-2">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="p-0.5 rounded text-(--text-muted) hover:text-(--text-primary) shrink-0"
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          <div className="flex-1 font-mono text-xs text-(--text-primary)">
            {field.name || <span className="italic opacity-50">unnamed</span>}
          </div>

          <span className={cn("px-1.5 py-0.5 rounded border text-[10px] font-medium", TYPE_COLORS[field.type])}>
            {field.type === "array" ? `${field.itemType}[]` : field.type}
          </span>

          <span className="text-[10px] text-(--text-muted) uppercase tracking-widest font-semibold px-2">
            {field.location}
          </span>

          {field.required && (
            <span className="px-1.5 py-0.5 rounded bg-red-400/10 text-red-400 text-[10px] font-bold uppercase tracking-wider">
              Required
            </span>
          )}
        </div>

        {field.description && (
          <p className="text-[11px] text-(--text-muted) pl-6">
            {field.description}
          </p>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="mt-1.5 space-y-1.5 border-l border-(--border) ml-2 pl-3">
          {field.children.map((child) => (
            <ReadOnlyFieldRow
              key={child.id}
              field={child}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface EndpointEditorProps {
  endpoint: Endpoint;
}

export function EndpointEditor({ endpoint }: EndpointEditorProps) {
  const { duplicateEndpoint, projects } = useAppStore();
  const { deleteEndpoint } = useEndpointSync(endpoint.projectId);
  const [activeTab, setActiveTab] = useState<"config" | "history" | "analytics">("config");

  const project = projects[endpoint.projectId];
  const fullUrl = project
    ? endpointFullUrl(project.name, endpoint.id)
    : `https://aitek.save/my-project/${slugify(endpoint.id) || "endpoint"}`;

  function handleDelete() {
    if (!confirm(`Delete endpoint "${endpoint.id}"?`)) return;
    deleteEndpoint(endpoint.id);
    toast.success("Endpoint deleted");
  }

  const validationRules = endpoint.validationRules ?? [];
  const schemaMode = endpoint.schemaMode;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-(--border) bg-(--bg-surface) shrink-0">
        <div className="flex items-center gap-1 p-1 bg-(--bg-base) rounded-xl border border-(--border) mr-2">
          <button
            onClick={() => setActiveTab("config")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              activeTab === "config" ? "bg-(--bg-surface) text-(--text-primary) shadow-sm" : "text-(--text-muted) hover:text-(--text-primary)"
            )}
          >
            <Settings2 className="w-3.5 h-3.5" /> Configuration
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              activeTab === "history" ? "bg-(--bg-surface) text-(--text-primary) shadow-sm" : "text-(--text-muted) hover:text-(--text-primary)"
            )}
          >
            <Activity className="w-3.5 h-3.5" /> Live History
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              activeTab === "analytics" ? "bg-(--bg-surface) text-(--text-primary) shadow-sm" : "text-(--text-muted) hover:text-(--text-primary)"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Analytics
          </button>
        </div>

        <div className="flex items-baseline gap-0 flex-1 min-w-0">
          {project && (
            <Link 
              href={`/dashboard/projects/${endpoint.projectId}`}
              className="text-sm font-mono text-(--text-muted) shrink-0 select-none hover:text-(--accent) transition-colors"
            >
              /{slugify(project.name)}/
            </Link>
          )}
          <span className="text-sm font-mono font-semibold text-(--text-primary) truncate">
            {endpoint.id}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {PROTOCOLS.map((p) => (
            <span key={p} className={cn("px-2 py-0.5 rounded border text-[11px] font-mono font-bold", PROTOCOL_COLORS[p])}>{p}</span>
          ))}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2 pl-2 border-l border-(--border)">
          <button 
            onClick={() => { duplicateEndpoint(endpoint.id); toast.success("Duplicated (locally)"); }} 
            className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-overlay) transition-colors"
            title="Duplicate Endpoint"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={handleDelete} 
            className="p-1.5 rounded-lg text-(--text-muted) hover:text-red-400 hover:bg-red-400/10 transition-colors"
            title="Delete Endpoint"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* URL Banner */}
      <div className="px-5 py-2 border-b border-(--border) bg-(--bg-surface) flex items-center gap-2">
        <Globe className="w-3 h-3 text-(--text-muted)" />
        <span className="text-[11px] font-mono text-(--text-muted) select-all flex-1">{fullUrl}</span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-(--bg-base) border border-(--border) text-[10px] font-semibold text-(--text-muted)">
          <Lock className="w-2.5 h-2.5" /> READ ONLY
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "history" ? (
          <HistoryPanel endpointId={endpoint.id} />
        ) : activeTab === "analytics" ? (
          <AnalyticsPanel endpointId={endpoint.id} />
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
            {/* Info Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-(--border)">
                <h2 className="text-xs font-bold text-(--text-primary) uppercase tracking-widest">General Information</h2>
              </div>
              <div className="grid gap-4 bg-(--bg-surface) p-6 rounded-2xl border border-(--border)">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">Endpoint Name</span>
                  <span className="text-sm font-mono text-(--text-primary)">{endpoint.id}</span>
                </div>
                {/* {endpoint.description && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">Description</span>
                    <span className="text-sm text-(--text-secondary)">{endpoint.description}</span>
                  </div>
                )} */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">Schema Mode</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      schemaMode === "restricted" ? "text-amber-400 border-amber-400/20 bg-amber-400/5" : "text-emerald-400 border-emerald-400/20 bg-emerald-400/5"
                    )}>
                      {schemaMode}
                    </span>
                    <span className="text-[11px] text-(--text-muted)">
                      {schemaMode === "restricted" ? "Enforced data validation" : "No schema validation"}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Schema Section */}
            {schemaMode === "restricted" && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-(--border)">
                  <h2 className="text-xs font-bold text-(--text-primary) uppercase tracking-widest">Data Schema</h2>
                </div>
                {/* <div className="space-y-3 pl-4 border-l border-(--border)">
                  {fields.length === 0 ? (
                    <div className="p-8 text-center bg-(--bg-surface) rounded-2xl border border-(--border) border-dashed">
                      <p className="text-xs text-(--text-muted)">No fields defined for this schema.</p>
                    </div>
                  ) : (
                    fields.map((field) => (
                      <ReadOnlyFieldRow key={field.id} field={field} depth={0} />
                    ))
                  )}
                </div> */}
                <pre>{JSON.stringify(validationRules, null, 2)}</pre>
              </section>
            )}

            {/* Note */}
            <div className="p-4 rounded-xl bg-amber-400/5 border border-amber-400/10 text-center">
              <p className="text-[11px] text-amber-400/80 font-medium">
                This endpoint was finalized at creation. Properties and schema cannot be modified.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
