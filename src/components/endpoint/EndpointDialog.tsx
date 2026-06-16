"use client";

import { useState } from "react";
import { X, Plus, Trash2, Braces, Type, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useEndpointSync } from "@/lib/hooks/useEndpointSync";
import { makeField } from "@/types";
import type { EndpointField, FieldType, FieldLocation } from "@/types";

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
 * Render a recursive field editor row for the creation dialog.
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
  const indentPx = depth * 16;

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
      <div className="group rounded-xl border border-(--border) bg-(--bg-base) p-3 space-y-2 hover:border-(--border-strong) transition-colors">
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
            className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-(--bg-surface) border border-(--border) text-xs font-mono text-(--text-primary) outline-none focus:border-(--accent)"
          />

          <NativeSelect
            value={field.type}
            onChange={(v) => set("type", v as FieldType)}
            options={FIELD_TYPES.map((t) => ({ value: t, label: t }))}
            className="w-24"
          />

          {field.type === "array" && (
            <NativeSelect
              value={field.itemType}
              onChange={(v) => set("itemType", v as FieldType | "object")}
              options={[
                ...FIELD_TYPES.map((t) => ({ value: t, label: `${t}[]` })),
                { value: "object", label: "object[]" },
              ]}
              className="w-24"
            />
          )}

          <button
            type="button"
            onClick={() => set("required", !field.required)}
            className={cn(
              "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors shrink-0",
              field.required
                ? "bg-red-400/10 border-red-400/30 text-red-400"
                : "bg-(--bg-surface) border-(--border) text-(--text-muted) hover:text-(--text-primary)"
            )}
          >
            {field.required ? "Req" : "Opt"}
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded-lg text-(--text-muted) hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="mt-1.5 space-y-1.5 border-l border-(--border) ml-2 pl-3">
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
            className="flex items-center gap-1.5 text-[10px] font-semibold text-(--text-muted) hover:text-(--accent) transition-colors py-1"
          >
            <Plus className="w-2.5 h-2.5" />
            Add {field.type === "array" ? "item field" : "nested field"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface EndpointDialogProps {
  projectId: string;
  onClose: () => void;
}

export function EndpointDialog({ projectId, onClose }: EndpointDialogProps) {
  const { createEndpoint } = useEndpointSync(projectId);
  const [schemaMode, setSchemaMode] = useState<"free" | "restricted">("free");
  const [isPending, setIsPending] = useState(false);
  const [fields, setFields] = useState<EndpointField[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function addField() {
    setFields([...fields, makeField()]);
  }

  function updateField(id: string, updated: EndpointField) {
    setFields(fields.map((f) => (f.id === id ? updated : f)));
  }

  function deleteField(id: string) {
    setFields(fields.filter((f) => f.id !== id));
  }

  function buildStructure(fields: EndpointField[]) {
    const obj: any = {};
    fields.forEach(f => {
      const key = f.name.trim();
      if (!key) return;

      if (f.type === "object") {
        obj[key] = buildStructure(f.children);
      } else if (f.type === "array") {
        if (f.itemType === "object") {
          obj[key] = [buildStructure(f.children)];
        } else {
          obj[key] = [f.itemType];
        }
      } else {
        obj[key] = f.type;
      }
    });
    return obj;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);

    let validation_rules = null;
    if (schemaMode === "restricted") {
      validation_rules = buildStructure(fields);
    }

    try {
      await createEndpoint({
        project_id: projectId,
        schema_mode: schemaMode,
        validation_rules
      });
      onClose();
    } catch (err) {
      // Error handled by mutation toast
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl mx-4 rounded-2xl border border-(--border-strong) bg-(--bg-elevated) shadow-2xl animate-slide-in overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-(--border) shrink-0">
          <div>
            <h2 className="font-semibold text-(--text-primary)">Add New Endpoint</h2>
            <p className="text-[10px] text-(--text-muted) uppercase tracking-wider mt-0.5">Project ID: {projectId.slice(0, 8)}...</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-overlay)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Schema Mode Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-(--text-muted) uppercase tracking-wider">
              Schema Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSchemaMode("free")}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                  schemaMode === "free"
                    ? "border-(--accent) bg-(--accent-glow)"
                    : "border-(--border) bg-(--bg-surface) hover:border-(--border-strong)"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                  schemaMode === "free" ? "bg-(--accent)" : "bg-(--bg-elevated)"
                )}>
                  <Type className={cn("w-4 h-4", schemaMode === "free" ? "text-white" : "text-(--text-muted)")} />
                </div>
                <div>
                  <div className={cn("text-sm font-semibold", schemaMode === "free" ? "text-(--accent)" : "text-(--text-primary)")}>Free Text</div>
                  <div className="text-[11px] text-(--text-muted) mt-0.5 leading-relaxed">No schema enforced. Validation rules will be null.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSchemaMode("restricted")}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                  schemaMode === "restricted"
                    ? "border-(--accent) bg-(--accent-glow)"
                    : "border-(--border) bg-(--bg-surface) hover:border-(--border-strong)"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                  schemaMode === "restricted" ? "bg-(--accent)" : "bg-(--bg-elevated)"
                )}>
                  <Braces className={cn("w-4 h-4", schemaMode === "restricted" ? "text-white" : "text-(--text-muted)")} />
                </div>
                <div>
                  <div className={cn("text-sm font-semibold", schemaMode === "restricted" ? "text-(--accent)" : "text-(--text-primary)")}>Structured</div>
                  <div className="text-[11px] text-(--text-muted) mt-0.5 leading-relaxed">Strict schema. Define required fields in validation rules.</div>
                </div>
              </button>
            </div>
          </div>

          {/* Validation Rules (Restricted Only) */}
          {schemaMode === "restricted" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-(--text-muted) uppercase tracking-wider">
                  Validation Rules (Fields)
                </label>
                <button
                  type="button"
                  onClick={addField}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--accent) text-white text-[10px] font-bold hover:bg-teal-400 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> ADD FIELD
                </button>
              </div>
              
              <div className="space-y-3">
                {fields.length === 0 && (
                  <div className="py-12 text-center border-2 border-dashed border-(--border) rounded-2xl bg-(--bg-surface)">
                    <p className="text-xs text-(--text-muted)">No fields defined yet. Click "Add Field" to begin defining your schema.</p>
                  </div>
                )}
                {fields.map((field) => (
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
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-(--border) bg-(--bg-surface) shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-(--border) text-sm text-(--text-secondary) hover:bg-(--bg-overlay) hover:text-(--text-primary) transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-(--accent) text-white text-sm font-semibold hover:bg-teal-400 transition-colors shadow-(--accent-glow) flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Endpoint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
