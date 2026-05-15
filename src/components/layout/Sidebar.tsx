"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { cn, METHOD_DOT_COLORS } from "@/lib/utils";
import {
  Plus, FolderOpen, ChevronDown, ChevronRight, Zap, Settings,
  Search,
} from "lucide-react";
import type { HttpMethod } from "@/types";
import { ProjectDialog } from "@/components/project/ProjectDialog";
import { EndpointContextMenu } from "@/components/endpoint/EndpointContextMenu";
import toast from "react-hot-toast";

export function Sidebar() {
  const {
    projects, endpoints, activeProjectId, activeEndpointId,
    setActiveProject, setActiveEndpoint, createEndpoint, deleteEndpoint,
    duplicateEndpoint,
  } = useAppStore();

  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    endpointId: string;
    x: number;
    y: number;
  } | null>(null);

  const projectList = Object.values(projects).sort((a, b) => b.updatedAt - a.updatedAt);

  function toggleProject(id: string) {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setActiveProject(id);
  }

  function handleNewEndpoint(projectId: string) {
    if (!expandedProjects.has(projectId)) {
      setExpandedProjects((prev) => new Set([...prev, projectId]));
    }
    createEndpoint(projectId);
  }

  function handleEndpointContextMenu(e: React.MouseEvent, endpointId: string) {
    e.preventDefault();
    setContextMenu({ endpointId, x: e.clientX, y: e.clientY });
  }

  function handleDuplicate(id: string) {
    duplicateEndpoint(id);
    toast.success("Endpoint duplicated");
    setContextMenu(null);
  }

  function handleDelete(id: string) {
    deleteEndpoint(id);
    toast.success("Endpoint deleted");
    setContextMenu(null);
  }

  const filteredEndpoints = (projectId: string) =>
    projects[projectId]?.endpointIds
      .map((id) => endpoints[id])
      .filter(Boolean)
      .filter((ep) =>
        search === "" ||
        ep.name.toLowerCase().includes(search.toLowerCase()) ||
        ep.url.toLowerCase().includes(search.toLowerCase())
      ) ?? [];

  return (
    <>
      <aside className="flex flex-col w-64 min-w-[256px] h-full border-r 5 bg-(--bg-surface)">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-(--border)">
          <div className="w-7 h-7 rounded-lg bg-(--accent) flex items-center justify-center shadow-(--accent-glow)">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-(--text-primary) tracking-tight">
            API<span className="text-(--accent)">Forge</span>
          </span>
        </div>

        {/* Search */}
        <div className="px-3 py-3 border-b border-(--border)">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-(--bg-elevated) border border-(--border)">
            <Search className="w-3.5 h-3.5 text-(--text-muted)" />
            <input
              type="text"
              placeholder="Search endpoints…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs text-(--text-primary) placeholder:text-(--text-muted) outline-none"
            />
          </div>
        </div>

        {/* Projects header */}
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-(--text-muted)">
            Projects
          </span>
          <button
            onClick={() => setShowProjectDialog(true)}
            className="p-1 rounded-md text-(--text-muted) hover:text-(--accent) hover:bg-(--accent-glow) transition-colors"
            title="New project"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Project list */}
        <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {projectList.length === 0 && (
            <div className="px-3 py-8 text-center">
              <FolderOpen className="w-8 h-8 text-(--text-muted) mx-auto mb-2 opacity-40" />
              <p className="text-xs text-(--text-muted)">No projects yet</p>
              <button
                onClick={() => setShowProjectDialog(true)}
                className="mt-2 text-xs text-(--accent) hover:underline rounded-xl p-4"
              >
                Create your first project
              </button>
            </div>
          )}

          {projectList.map((project) => {
            const isExpanded = expandedProjects.has(project.id);
            const isActive = activeProjectId === project.id;
            const eps = filteredEndpoints(project.id);

            return (
              <div key={project.id}>
                {/* Project row */}
                <button
                  onClick={() => toggleProject(project.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left group transition-all",
                    isActive
                      ? "bg-(--bg-overlay) text-(--text-primary)"
                      : "text-(--text-secondary) hover:bg-(--bg-elevated) hover:text-(--text-primary)"
                  )}
                >
                  <span className="text-sm leading-none">{project.icon}</span>
                  <span className="flex-1 text-xs font-medium truncate">{project.name}</span>
                  <span
                    className="w-4 h-4 rounded text-[10px] flex items-center justify-center font-mono"
                    style={{ color: project.color, backgroundColor: `${project.color}20` }}
                  >
                    {project.endpointIds.length}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  ) : (
                    <ChevronRight className="w-3 h-3 opacity-50" />
                  )}
                </button>

                {/* Endpoints */}
                {isExpanded && (
                  <div className="ml-3 pl-2 border-l border-(--border) mt-0.5 space-y-0.5">
                    {eps.map((ep) => (
                      <button
                        key={ep.id}
                        onClick={() => {
                          setActiveProject(ep.projectId);
                          setActiveEndpoint(ep.id);
                        }}
                        onContextMenu={(e) => handleEndpointContextMenu(e, ep.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left group transition-all",
                          activeEndpointId === ep.id
                            ? "bg-(--accent-glow) text-(--text-primary)"
                            : "text-(--text-secondary) hover:bg-(--bg-elevated) hover:text-(--text-primary)"
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            METHOD_DOT_COLORS[ep.method as HttpMethod]
                          )}
                        />
                        <span className="text-[11px] font-mono font-medium w-8 shrink-0 text-(--text-muted)">
                          {ep.method.slice(0, 3)}
                        </span>
                        <span className="flex-1 text-xs truncate">{ep.name}</span>
                      </button>
                    ))}

                    <button
                      onClick={() => handleNewEndpoint(project.id)}
                      className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-(--text-muted) hover:text-(--accent) hover:bg-(--accent-glow) text-xs transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add endpoint</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom bar */}
        <div className="border-t border-(--border) p-3">
          <div className="flex items-center gap-2 text-(--text-muted) text-xs">
            <Settings className="w-3.5 h-3.5" />
            <span>APIForge v0.1</span>
          </div>
        </div>
      </aside>

      {showProjectDialog && (
        <ProjectDialog onClose={() => setShowProjectDialog(false)} />
      )}

      {contextMenu && (
        <EndpointContextMenu
          endpointId={contextMenu.endpointId}
          x={contextMenu.x}
          y={contextMenu.y}
          onDuplicate={() => handleDuplicate(contextMenu.endpointId)}
          onDelete={() => handleDelete(contextMenu.endpointId)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
