"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { PROJECT_COLORS, PROJECT_ICONS, cn } from "@/lib/utils";
import { X, Check } from "lucide-react";
import toast from "react-hot-toast";
import { slugify } from "@/types";

interface ProjectDialogProps {
  onClose: () => void;
  projectId?: string;
}

export function ProjectDialog({ onClose, projectId }: ProjectDialogProps) {
  const { projects, createProject, updateProject } = useAppStore();
  const existing = projectId ? projects[projectId] : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [color, setColor] = useState(existing?.color ?? PROJECT_COLORS[0]);
  const [icon, setIcon] = useState(existing?.icon ?? PROJECT_ICONS[0]);

  const derivedSlug = slugify(name) || "my-project";
  const derivedBaseUrl = `https://aitek.save/${derivedSlug}/`;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    if (existing && projectId) {
      updateProject(projectId, { name: name.trim(), description, color, icon });
      toast.success("Project updated");
    } else {
      createProject({ name: name.trim(), description, color, icon, envVars: [] });
      toast.success("Project created");
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md mx-4 rounded-2xl border border-(--border-strong) bg-(--bg-elevated) shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-(--border)">
          <h2 className="font-semibold text-(--text-primary)">
            {existing ? "Edit Project" : "New Project"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-overlay)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Icon + Color picker */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-(--text-secondary) mb-2">Icon</label>
              <div className="grid grid-cols-5 gap-1.5 p-2 rounded-xl bg-(--bg-surface) border border-(--border)">
                {PROJECT_ICONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={cn(
                      "text-lg p-1 rounded-lg transition-all",
                      icon === i ? "bg-(--accent-glow) scale-110" : "hover:bg-(--bg-overlay)"
                    )}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-medium text-(--text-secondary) mb-2">Color</label>
              <div className="grid grid-cols-5 gap-1.5 p-2 rounded-xl bg-(--bg-surface) border border-(--border)">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-(--bg-surface) border border-(--border)">
            <span className="text-2xl">{icon}</span>
            <div>
              <div className="font-semibold text-sm" style={{ color }}>
                {name || "Project name"}
              </div>
              <div className="text-xs text-(--text-muted)">{description || "No description"}</div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-(--text-secondary) mb-1.5">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My API Project"
              autoFocus
              className="w-full px-3 py-2 rounded-lg bg-(--bg-surface) border border-(--border) text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent) transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-(--text-secondary) mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project for?"
              className="w-full px-3 py-2 rounded-lg bg-(--bg-surface) border border-(--border) text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent) transition-colors"
            />
          </div>

          {/* Auto-generated base URL preview */}
          <div>
            <label className="block text-xs font-medium text-(--text-secondary) mb-1.5">
              Base URL{" "}
              <span className="text-(--text-muted) font-normal">(auto-generated)</span>
            </label>
            <div className="px-3 py-2 rounded-lg bg-(--bg-surface) border border-(--border) font-mono text-xs text-(--text-muted) select-all cursor-text">
              {derivedBaseUrl}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-(--border) text-sm text-(--text-secondary) hover:bg-(--bg-overlay) hover:text-(--text-primary) transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-(--accent) text-white text-sm font-semibold hover:bg-teal-400 transition-colors shadow-(--accent-glow)"
            >
              {existing ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
