"use client";

import { useCallback, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { Trash2, Copy, Plus, X, ChevronDown, ChevronRight, Type, Braces } from "lucide-react";
import type { Endpoint, EndpointField, FieldType, FieldLocation, InputCategory } from "@/types";
import { slugify, endpointFullUrl, makeField, PROTOCOLS } from "@/types";
import toast from "react-hot-toast";

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

// ─── Small shared components ──────────────────────────────────────────────────

// function TypeBadge({ type }: { type: FieldType }) {
//   return (
//     <span className={cn("px-2 py-0.5 rounded text-[11px] font-mono font-semibold border shrink-0", TYPE_COLORS[type])}>
//       {type}
//     </span>
//   );
// }

/**
 * Render a styled native select input.
 * Input: current value, change handler, options. Final state: select element.
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

// ─── Recursive field row ──────────────────────────────────────────────────────

/**
 * Render a recursive field editor row.
 * Input: field data and update/delete callbacks. Final state: editable field row UI.
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

        {/* ── Row 1: expand toggle · name · type · location · required · delete ── */}
        <div className="flex items-center gap-2">
          {/* Expand toggle — only for object/array */}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="p-0.5 rounded text-(--text-muted) hover:text-(--text-primary) shrink-0"
            >
              {expanded
                ? <ChevronDown className="w-3.5 h-3.5" />
                : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          {/* Name */}
          <input
            type="text"
            value={field.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="field_name"
            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-(--bg-elevated) border border-(--border) text-sm font-mono text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent) transition-colors"
          />

          {/* Type */}
          <NativeSelect
            value={field.type}
            onChange={(v) => set("type", v as FieldType)}
            options={FIELD_TYPES.map((t) => ({ value: t, label: t }))}
            className="w-28"
          />

          {/* Location — only top-level (depth 0) */}
          {depth === 0 && (
            <NativeSelect
              value={field.location}
              onChange={(v) => set("location", v as FieldLocation)}
              options={FIELD_LOCATIONS}
              className="w-24"
            />
          )}

          {/* Array item type */}
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

          {/* Required */}
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

          {/* Delete */}
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-(--text-muted) hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Row 2: description ── */}
        <input
          type="text"
          value={field.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Describe this field…"
          className="w-full px-2.5 py-1.5 rounded-lg bg-(--bg-elevated) border border-(--border) text-xs text-(--text-secondary) placeholder:text-(--text-muted) outline-none focus:border-(--accent) transition-colors"
        />

        {/* ── Row 3: enum values + default (string types only) ── */}
        {supportsEnum && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[10px] text-(--text-muted) mb-1 uppercase tracking-wider">
                Allowed values{" "}
                <span className="normal-case font-normal">(comma-separated, empty = free text)</span>
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

        {/* Enum badge preview */}
        {field.allowedValues.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {field.allowedValues.map((v) => (
              <span key={v} className="px-2 py-0.5 rounded-md bg-(--bg-overlay) border border-(--border) text-[11px] font-mono text-(--text-secondary)">
                {v}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Children (nested) ── */}
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

/**
 * Main editor for an endpoint.
 * Input: endpoint object. Final state: endpoint configuration UI and update handlers.
 */
export function EndpointEditor({ endpoint }: EndpointEditorProps) {
  const { updateEndpoint, deleteEndpoint, duplicateEndpoint, projects } = useAppStore();

  const project = projects[endpoint.projectId];
  const fullUrl = project
    ? endpointFullUrl(project.name, endpoint.name)
    : `https://aitek.save/my-project/${slugify(endpoint.name) || "endpoint"}`;

  const update = useCallback(
    <K extends keyof Endpoint>(field: K, value: Endpoint[K]) => {
      updateEndpoint(endpoint.id, { [field]: value } as Partial<Endpoint>);
    },
    [endpoint.id, updateEndpoint]
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

      {/* ── Top bar: URL slug + actions ── */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-(--border) bg-(--bg-surface) shrink-0">
        {/* Slug */}
        <div className="flex items-baseline gap-0 flex-1 min-w-0">
          {project && (
            <span className="text-sm font-mono text-(--text-muted) shrink-0 select-none">
              /{slugify(project.name)}/
            </span>
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

        {/* Protocol badges — read-only */}
        <div className="flex items-center gap-1 shrink-0">
          {PROTOCOLS.map((p) => (
            <span
              key={p}
              className={cn("px-2 py-0.5 rounded border text-[11px] font-mono font-bold", PROTOCOL_COLORS[p])}
            >
              {p}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => { duplicateEndpoint(endpoint.id); toast.success("Duplicated"); }}
            className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-overlay) transition-colors"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-(--text-muted) hover:text-red-400 hover:bg-red-400/10 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Full URL preview */}
      <div className="px-5 py-1.5 border-b border-(--border) bg-(--bg-surface)">
        <span className="text-[11px] font-mono text-(--text-muted) select-all">{fullUrl}</span>
      </div>

      {/* ── Scrollable form body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">

          {/* Endpoint name (display label, not the slug) */}
          <div>
            <label className="block text-xs font-semibold text-(--text-muted) uppercase tracking-wider mb-2">
              Endpoint Name
            </label>
            <input
              type="text"
              value={endpoint.name}
              onChange={(e) => update("name", e.target.value)}
              onBlur={handleNameBlur}
              placeholder="e.g. get-user-profile"
              className="w-full px-3 py-2.5 rounded-xl bg-(--bg-surface) border border-(--border) text-sm font-mono text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent) transition-colors"
            />
            <p className="text-[11px] text-(--text-muted) mt-1">
              Used as the URL slug — auto-cleaned to lowercase with dashes
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-(--text-muted) uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={endpoint.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="What does this endpoint do? Who should use it and when?"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-(--bg-surface) border border-(--border) text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent) resize-none transition-colors leading-relaxed"
            />
          </div>

          {/* ── Input Category picker ── */}
          <div>
            <label className="block text-xs font-semibold text-(--text-muted) uppercase tracking-wider mb-3">
              Input Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Free text */}
              <button
                type="button"
                onClick={() => update("inputCategory", "free-text")}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                  inputCategory === "free-text"
                    ? "border-(--accent) bg-(--accent-glow)"
                    : "border-(--border) bg-(--bg-surface) hover:border-(--border-strong)"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                  inputCategory === "free-text" ? "bg-(--accent)" : "bg-(--bg-elevated)"
                )}>
                  <Type className={cn("w-4 h-4", inputCategory === "free-text" ? "text-white" : "text-(--text-muted)")} />
                </div>
                <div>
                  <div className={cn("text-sm font-semibold", inputCategory === "free-text" ? "text-(--accent)" : "text-(--text-primary)")}>
                    Free Text
                  </div>
                  <div className="text-xs text-(--text-muted) mt-0.5 leading-relaxed">
                    Accepts any string or blob. No schema enforced — the caller sends whatever they want.
                  </div>
                </div>
              </button>

              {/* Structured */}
              <button
                type="button"
                onClick={() => update("inputCategory", "structured")}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                  inputCategory === "structured"
                    ? "border-(--accent) bg-(--accent-glow)"
                    : "border-(--border) bg-(--bg-surface) hover:border-(--border-strong)"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                  inputCategory === "structured" ? "bg-(--accent)" : "bg-(--bg-elevated)"
                )}>
                  <Braces className={cn("w-4 h-4", inputCategory === "structured" ? "text-white" : "text-(--text-muted)")} />
                </div>
                <div>
                  <div className={cn("text-sm font-semibold", inputCategory === "structured" ? "text-(--accent)" : "text-(--text-primary)")}>
                    Structured
                  </div>
                  <div className="text-xs text-(--text-muted) mt-0.5 leading-relaxed">
                    Define a typed field schema. Supports nesting, arrays, enums, and required rules.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* ── Schema builder — only when structured ── */}
          {inputCategory === "structured" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="block text-xs font-semibold text-(--text-muted) uppercase tracking-wider">
                    Schema Fields
                  </label>
                  <p className="text-[11px] text-(--text-muted) mt-0.5">
                    Use <span className="font-mono">object</span> or <span className="font-mono">array</span> types to nest fields
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addField}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--accent) text-white text-xs font-semibold hover:bg-teal-400 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Field
                </button>
              </div>

              {fields.length === 0 ? (
                <button
                  type="button"
                  onClick={addField}
                  className="w-full flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-(--border) hover:border-(--accent) hover:bg-(--accent-glow) transition-colors group"
                >
                  <Plus className="w-6 h-6 text-(--text-muted) group-hover:text-(--accent) mb-2 transition-colors" />
                  <p className="text-sm text-(--text-muted) group-hover:text-(--text-primary) transition-colors">
                    Add your first field
                  </p>
                  <p className="text-xs text-(--text-muted) mt-0.5">
                    Fields can be nested inside object and array types
                  </p>
                </button>
              ) : (
                <div className="space-y-4">
                  {/* Grouped by location */}
                  {([
                    { label: "Body",             group: bodyFields },
                    { label: "Query Parameters", group: queryFields },
                    { label: "Path Parameters",  group: pathFields },
                  ] as { label: string; group: EndpointField[] }[]).map(({ label, group }) =>
                    group.length > 0 ? (
                      <div key={label}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-semibold text-(--text-muted) uppercase tracking-widest">
                            {label}
                          </span>
                          <div className="flex-1 h-px bg-(--border)" />
                          <span className="text-[10px] text-(--text-muted)">{group.length}</span>
                        </div>
                        <div className="space-y-2">
                          {group.map((field) => (
                            <FieldRow
                              key={field.id}
                              field={field}
                              depth={0}
                              onUpdate={(updated) => updateField(field.id, updated)}
                              onDelete={() => deleteField(field.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}

                  <button
                    type="button"
                    onClick={addField}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-(--border) text-xs text-(--text-muted) hover:text-(--accent) hover:border-(--accent) hover:bg-(--accent-glow) transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add another field
                  </button>

                  {/* Schema summary */}
                  <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4">
                    <div className="text-xs font-semibold text-(--text-muted) uppercase tracking-wider mb-3">
                      Schema Preview
                    </div>
                    <SchemaPreview fields={fields} indent={0} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Free-text note */}
          {inputCategory === "free-text" && (
            <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-4 text-center">
              <p className="text-sm text-(--text-secondary)">
                This endpoint accepts free-form text input.
              </p>
              <p className="text-xs text-(--text-muted) mt-1">
                Switch to <strong className="text-(--text-secondary)">Structured</strong> to define a typed schema.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Schema preview (read-only tree) ─────────────────────────────────────────

/**
 * Render a read-only preview of the current schema fields.
 * Input: schema fields list. Final state: nested display tree.
 */
function SchemaPreview({ fields, indent }: { fields: EndpointField[]; indent: number }) {
  return (
    <div className="font-mono text-xs space-y-0.5" style={{ paddingLeft: indent * 16 }}>
      {fields.map((f) => (
        <div key={f.id}>
          <div className="flex items-center gap-2 py-0.5">
            <span className="text-(--text-secondary)">{f.name || "unnamed"}</span>
            <span className={cn("px-1.5 py-0 rounded border text-[10px]",
              TYPE_COLORS[f.type] ?? "text-zinc-400 bg-zinc-400/10 border-zinc-400/20"
            )}>
              {f.type === "array" ? `${f.itemType}[]` : f.type}
            </span>
            {f.required && <span className="text-red-400 text-[10px]">*</span>}
            {f.allowedValues.length > 0 && (
              <span className="text-(--text-muted)">enum({f.allowedValues.join(" | ")})</span>
            )}
            {f.description && (
              <span className="text-(--text-muted) truncate max-w-50">{f.description}</span>
            )}
          </div>
          {(f.type === "object" || f.type === "array") && f.children.length > 0 && (
            <SchemaPreview fields={f.children} indent={indent + 1} />
          )}
        </div>
      ))}
    </div>
  );
}
