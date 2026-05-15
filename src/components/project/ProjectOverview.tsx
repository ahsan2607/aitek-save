"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { METHOD_COLORS, timeAgo, cn } from "@/lib/utils";
import {
  Plus, Edit2, Trash2, Globe, Clock, Layers,
  ExternalLink,
} from "lucide-react";
import type { HttpMethod } from "@/types";
import { ProjectDialog } from "./ProjectDialog";
import toast from "react-hot-toast";

interface ProjectOverviewProps {
  projectId: string;
}

export function ProjectOverview({ projectId }: ProjectOverviewProps) {
  const { projects, endpoints, createEndpoint, deleteProject, setActiveEndpoint } = useAppStore();
  const project = projects[projectId];
  const [showEditDialog, setShowEditDialog] = useState(false);

  if (!project) return null;

  const eps = project.endpointIds.map((id) => endpoints[id]).filter(Boolean);

  function handleDeleteProject() {
    if (!confirm(`Delete project "${project.name}" and all its endpoints?`)) return;
    deleteProject(projectId);
    toast.success("Project deleted");
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-(--border) bg-(--bg-surface)">
          <span className="text-3xl">{project.icon}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-(--text-primary) truncate" style={{ color: project.color }}>
              {project.name}
            </h1>
            {project.description && (
              <p className="text-sm text-(--text-secondary) truncate">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditDialog(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-(--text-secondary) hover:bg-(--bg-overlay) hover:text-(--text-primary) border border-(--border) transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
            <button
              onClick={handleDeleteProject}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-400/10 border border-red-400/20 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex gap-6 px-6 py-4 border-b border-(--border)">
          <div className="flex items-center gap-2 text-sm text-(--text-secondary)">
            <Layers className="w-4 h-4 text-(--accent)" />
            <span>{eps.length} endpoint{eps.length !== 1 ? "s" : ""}</span>
          </div>
          {project.baseUrl && (
            <div className="flex items-center gap-2 text-sm text-(--text-secondary)">
              <Globe className="w-4 h-4 text-(--accent)" />
              <span className="font-mono text-xs truncate max-w-xs">{project.baseUrl}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-(--text-secondary)">
            <Clock className="w-4 h-4 text-(--accent)" />
            <span>Updated {timeAgo(project.updatedAt)}</span>
          </div>
        </div>

        {/* Endpoints grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {eps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-(--bg-elevated) border border-(--border) flex items-center justify-center mb-4 text-3xl">
                📡
              </div>
              <h3 className="font-semibold text-(--text-primary) mb-1">No endpoints yet</h3>
              <p className="text-sm text-(--text-muted) mb-6">
                Create your first endpoint to start making requests
              </p>
              <button
                onClick={() => createEndpoint(projectId)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-(--accent) text-white text-sm font-semibold hover:bg-teal-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Endpoint
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-(--text-secondary)">Endpoints</h2>
                <button
                  onClick={() => createEndpoint(projectId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--accent) text-white text-xs font-semibold hover:bg-teal-400 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Endpoint
                </button>
              </div>

              {eps.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => setActiveEndpoint(ep.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-(--border) bg-(--bg-surface) hover:border-(--border-strong) hover:bg-(--bg-elevated) text-left transition-all group"
                >
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[11px] font-bold font-mono border shrink-0",
                      METHOD_COLORS[ep.method as HttpMethod]
                    )}
                  >
                    {ep.method}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-(--text-primary) truncate">{ep.name}</div>
                    <div className="text-xs text-(--text-muted) font-mono truncate mt-0.5">
                      {ep.url || "No URL set"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {ep.lastResponse && (
                      <span className={cn(
                        "text-xs font-mono font-semibold",
                        ep.lastResponse.status >= 200 && ep.lastResponse.status < 300
                          ? "text-emerald-400"
                          : ep.lastResponse.status >= 400
                            ? "text-red-400"
                            : "text-amber-400"
                      )}>
                        {ep.lastResponse.status}
                      </span>
                    )}
                    <span className="text-xs text-(--text-muted)">{timeAgo(ep.updatedAt)}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-(--text-muted) opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEditDialog && (
        <ProjectDialog projectId={projectId} onClose={() => setShowEditDialog(false)} />
      )}
    </>
  );
}
