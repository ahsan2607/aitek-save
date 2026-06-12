"use client";

import { useCallback, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { 
  Trash2, Copy, Plus, X, ChevronDown, ChevronRight, Type, Braces,
  Settings2, Activity, BarChart3
} from "lucide-react";
import type { Endpoint, EndpointField, FieldType, FieldLocation, InputCategory } from "@/types";
import { slugify, endpointFullUrl, makeField, PROTOCOLS } from "@/types";
import toast from "react-hot-toast";
import { HistoryPanel } from "./HistoryPanel";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { useEndpointSync } from "@/lib/hooks/useEndpointSync";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELD_TYPES: FieldType[] = [
  "string", "number", "boolean", "object", "array",
  "date", "email", "url", "uuid", "any",
];

const FIELD_LOCATIONS: { value: FieldLocation; label: string }[] = [
  { value: "body",  label: "Body" },
  { value: "query", label: "Query" },
  { value: "path",  label: "Path" },
];

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
 * Render a styled native select input.
 */
function NativeSelect({
  value, onChange, options, className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none px-2.5 py-1.5 pr-7 rounded-lg bg-(--bg-surface) border border-(--border) text-xs text-(--text-primary) outline-none focus:border-(--accent) transition-colors cursor-pointer"
      >
        {options.map((o, index) => (
          <option key={index} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-(--text-muted) pointer-events-none" />
    </div>
  );
}

/**
 * Render a recursive field editor row.
 */
function FieldRow({
  field,
  depth,
  onUpdate,
  onDelete,
}: {
  field: EndpointField;
  depth: number;
  onUpdate: (updated: EndpointField) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const set = <K extends keyof EndpointField>(key: K, value: EndpointField[K]) =>
    onUpdate({ ...field, [key]: value });

  const hasChildren = field.type === "object" || field.type === "array";
  const supportsEnum = field.type === "string" || field.type === "email" || field.type === "url";
  const indentPx = depth * 20;

  function addChild() {
    const child = makeField({ location: field.location });
    set("children", [...field.children, child]);
  }

  function updateChild(id: string, updated: EndpointField) {
    set("children", field.children.map((c) => (c.id === id ? updated : c)));
  }

  function deleteChild(id: string) {
    set("children", field.children.filter((c) => c.id !== id));
  }

  return (
    <div style={{ marginLeft: indentPx }}>
      <div className="group rounded-xl border border-(--border) bg-(--bg-surface) p-3 space-y-2.5 hover:border-(--border-strong) transition-colors">
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

          <input
            type="text"
            value={field.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="field_name"
            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-(--bg-elevated) border border-(--border) text-sm font-mono text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent) transition-colors"
          />

          <NativeSelect
            value={field.type}
            onChange={(v) => set("type", v as FieldType)}
            options={FIELD_TYPES.map((t) => ({ value: t, label: t }))}
            className="w-28"
          />

          {depth === 0 && (
            <NativeSelect
              value={field.location}
              onChange={(v) => set("location", v as FieldLocation)}
              options={FIELD_LOCATIONS}
              className="w-24"
            />
          )}

          {field.type === "array" && (
            <NativeSelect
              value={field.itemType}
              onChange={(v) => set("itemType", v as FieldType | "object")}
              options={[
                ...FIELD_TYPES.map((t) => ({ value: t, label: `${t}[]` })),
                { value: "object", label: "object[]" },
              ]}
              className="w-28"
            />
          )}

          <button
            type="button"
            onClick={() => set("required", !field.required)}
            className={cn(
              "px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors shrink-0",
              field.required
                ? "bg-red-400/10 border-red-400/30 text-red-400"
                : "bg-(--bg-elevated) border-(--border) text-(--text-muted) hover:text-(--text-primary)"
            )}
          >
            {field.required ? "required" : "optional"}
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-(--text-muted) hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <input
          type="text"
          value={field.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Describe this field…"
          className="w-full px-2.5 py-1.5 rounded-lg bg-(--bg-elevated) border border-(--border) text-xs text-(--text-secondary) placeholder:text-(--text-muted) outline-none focus:border-(--accent) transition-colors"
        />

        {supportsEnum && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[10px] text-(--text-muted) mb-1 uppercase tracking-wider">
                Allowed values <span className="normal-case font-normal">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={field.allowedValues.join(", ")}
                onChange={(e) =>
                  set("allowedValues", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
                }
                placeholder="admin, user, guest"
                className="w-full px-2.5 py-1.5 rounded-lg bg-(--bg-elevated) border border-(--border) text-xs font-mono text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent) transition-colors"
              />
            </div>
            <div className="w-36">
              <label className="block text-[10px] text-(--text-muted) mb-1 uppercase tracking-wider">
                Default value
              </label>
              <input
                type="text"
                value={field.defaultValue}
                onChange={(e) => set("defaultValue", e.target.value)}
                placeholder="(none)"
                className="w-full px-2.5 py-1.5 rounded-lg bg-(--bg-elevated) border border-(--border) text-xs font-mono text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent) transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="mt-2 space-y-2 border-l-2 border-(--border) pl-3">
          {field.children.map((child) => (
            <FieldRow
              key={child.id}
              field={child}
              depth={depth + 1}
              onUpdate={(updated) => updateChild(child.id, updated)}
              onDelete={() => deleteChild(child.id)}
            />
          ))}
          <button
            type="button"
            onClick={addChild}
            className="flex items-center gap-1.5 text-xs text-(--text-muted) hover:text-(--accent) transition-colors py-1"
          >
            <Plus className="w-3 h-3" />
            Add {field.type === "array" ? "item field" : "nested field"}
          </button>
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
  const { updateEndpoint, deleteEndpoint } = useEndpointSync(endpoint.projectId);
  const [activeTab, setActiveTab] = useState<"config" | "history" | "analytics">("config");

  const project = projects[endpoint.projectId];
  const fullUrl = project
    ? endpointFullUrl(project.name, endpoint.name)
    : `https://aitek.save/my-project/${slugify(endpoint.name) || "endpoint"}`;

  const update = useCallback(
    <K extends keyof Endpoint>(field: K, value: Endpoint[K]) => {
      // API integration for updating validation rules or schema mode
      if (field === "inputCategory" || field === "fields") {
        const schema_mode = field === "inputCategory" ? (value === "structured" ? "restricted" : "free") : (endpoint.inputCategory === "structured" ? "restricted" : "free");
        const validation_rules = field === "fields" ? { fields: value } : (endpoint.fields ? { fields: endpoint.fields } : {});

        updateEndpoint({ id: endpoint.id, schema_mode, validation_rules });
      } else {
        // For other fields, we just use the store temporarily or ignore if not supported by API
        // In this architecture, we should probably update the API.
      }
    },
    [endpoint.id, endpoint.inputCategory, endpoint.fields, updateEndpoint]
  );


  function addField() {
    update("fields", [...(endpoint.fields ?? []), makeField()]);
  }

  function updateField(id: string, updated: EndpointField) {
    update("fields", (endpoint.fields ?? []).map((f) => (f.id === id ? updated : f)));
  }

  function deleteField(id: string) {
    update("fields", (endpoint.fields ?? []).filter((f) => f.id !== id));
  }

  function handleDelete() {
    if (!confirm(`Delete endpoint "${endpoint.name}"?`)) return;
    deleteEndpoint(endpoint.id);
    toast.success("Endpoint deleted");
  }

  function handleNameBlur() {
    const cleaned = slugify(endpoint.name) || "new-endpoint";
    if (cleaned !== endpoint.name) update("name", cleaned);
  }

  const fields = endpoint.fields ?? [];
  const inputCategory: InputCategory = endpoint.inputCategory ?? "free-text";
  const bodyFields  = fields.filter((f) => f.location === "body");
  const queryFields = fields.filter((f) => f.location === "query");
  const pathFields  = fields.filter((f) => f.location === "path");

  return (
    <div className="flex flex-col h-full">
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
          <input
            type="text"
            value={endpoint.name}
            onChange={(e) => update("name", e.target.value)}
            onBlur={handleNameBlur}
            placeholder="endpoint-name"
            className="flex-1 min-w-0 bg-transparent text-sm font-mono font-semibold text-(--text-primary) outline-none placeholder:text-(--text-muted)"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {PROTOCOLS.map((p) => (
            <span key={p} className={cn("px-2 py-0.5 rounded border text-[11px] font-mono font-bold", PROTOCOL_COLORS[p])}>{p}</span>
          ))}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => { duplicateEndpoint(endpoint.id); toast.success("Duplicated"); }} className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-overlay) transition-colors"><Copy className="w-3.5 h-3.5" /></button>
          <button onClick={handleDelete} className="p-1.5 rounded-lg text-(--text-muted) hover:text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="px-5 py-1.5 border-b border-(--border) bg-(--bg-surface)">
        <span className="text-[11px] font-mono text-(--text-muted) select-all">{fullUrl}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "history" ? (
          <HistoryPanel endpointId={endpoint.id} />
        ) : activeTab === "analytics" ? (
          <AnalyticsPanel endpointId={endpoint.id} />
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
            <div>
              <label className="block text-xs font-semibold text-(--text-muted) uppercase tracking-wider mb-2">Endpoint Name</label>
              <input
                type="text"
                value={endpoint.name}
                onChange={(e) => update("name", e.target.value)}
                onBlur={handleNameBlur}
                className="w-full px-3 py-2.5 rounded-xl bg-(--bg-surface) border border-(--border) text-sm font-mono text-(--text-primary) outline-none focus:border-(--accent) transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-(--text-muted) uppercase tracking-wider mb-2">Description</label>
              <textarea
                value={endpoint.description}
                onChange={(e) => update("description", e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-(--bg-surface) border border-(--border) text-sm text-(--text-primary) outline-none focus:border-(--accent) resize-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-(--text-muted) uppercase tracking-wider mb-3">Input Category</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => update("inputCategory", "free-text")} className={cn("flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all", inputCategory === "free-text" ? "border-(--accent) bg-(--accent-glow)" : "border-(--border) bg-(--bg-surface) hover:border-(--border-strong)")}>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", inputCategory === "free-text" ? "bg-(--accent)" : "bg-(--bg-elevated)")}><Type className={cn("w-4 h-4", inputCategory === "free-text" ? "text-white" : "text-(--text-muted)")} /></div>
                  <div><div className={cn("text-sm font-semibold", inputCategory === "free-text" ? "text-(--accent)" : "text-(--text-primary)")}>Free Text</div><div className="text-xs text-(--text-muted) mt-0.5 leading-relaxed">No schema enforced.</div></div>
                </button>
                <button onClick={() => update("inputCategory", "structured")} className={cn("flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all", inputCategory === "structured" ? "border-(--accent) bg-(--accent-glow)" : "border-(--border) bg-(--bg-surface) hover:border-(--border-strong)")}>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", inputCategory === "structured" ? "bg-(--accent)" : "bg-(--bg-elevated)")}><Braces className={cn("w-4 h-4", inputCategory === "structured" ? "text-white" : "text-(--text-muted)")} /></div>
                  <div><div className={cn("text-sm font-semibold", inputCategory === "structured" ? "text-(--accent)" : "text-(--text-primary)")}>Structured</div><div className="text-xs text-(--text-muted) mt-0.5 leading-relaxed">Typed field schema.</div></div>
                </button>
              </div>
            </div>

            {inputCategory === "structured" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-semibold text-(--text-muted) uppercase tracking-wider">Schema Fields</label>
                  <button onClick={addField} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--accent) text-white text-xs font-semibold hover:bg-teal-400 transition-colors"><Plus className="w-3 h-3" /> Add Field</button>
                </div>
                {fields.length === 0 ? (
                  <button onClick={addField} className="w-full flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-(--border) hover:border-(--accent) hover:bg-(--accent-glow) transition-colors group">
                    <Plus className="w-6 h-6 text-(--text-muted) group-hover:text-(--accent) mb-2" /><p className="text-sm text-(--text-muted) group-hover:text-(--text-primary)">Add your first field</p>
                  </button>
                ) : (
                  <div className="space-y-4">
                    {[ { label: "Body", group: bodyFields }, { label: "Query Parameters", group: queryFields }, { label: "Path Parameters", group: pathFields } ].map(({ label, group }) => group.length > 0 ? (
                      <div key={label}>
                        <div className="flex items-center gap-2 mb-2"><span className="text-[10px] font-semibold text-(--text-muted) uppercase tracking-widest">{label}</span><div className="flex-1 h-px bg-(--border)" /></div>
                        <div className="space-y-2">{group.map((field) => <FieldRow key={field.id} field={field} depth={0} onUpdate={(updated) => updateField(field.id, updated)} onDelete={() => deleteField(field.id)} />)}</div>
                      </div>
                    ) : null)}
                    <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                      <div className="text-xs font-semibold text-(--text-muted) uppercase tracking-wider mb-3">Schema Preview</div>
                      <SchemaPreview fields={fields} indent={0} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SchemaPreview({ fields, indent }: { fields: EndpointField[]; indent: number }) {
  return (
    <div className="font-mono text-xs space-y-0.5" style={{ paddingLeft: indent * 16 }}>
      {fields.map((f) => (
        <div key={f.id}>
          <div className="flex items-center gap-2 py-0.5">
            <span className="text-(--text-secondary)">{f.name || "unnamed"}</span>
            <span className={cn("px-1.5 py-0 rounded border text-[10px]", TYPE_COLORS[f.type] || "text-zinc-400")}>{f.type === "array" ? `${f.itemType}[]` : f.type}</span>
            {f.required && <span className="text-red-400 text-[10px]">*</span>}
          </div>
          {(f.type === "object" || f.type === "array") && f.children.length > 0 && <SchemaPreview fields={f.children} indent={indent + 1} />}
        </div>
      ))}
    </div>
  );
}
