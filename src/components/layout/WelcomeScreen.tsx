"use client";

import { useState } from "react";
import { Zap, FolderPlus, ArrowRight } from "lucide-react";
import { ProjectDialog } from "@/components/project/ProjectDialog";

export function WelcomeScreen() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        {/* Glow orb */}
        <div className="relative mb-8">
          <div className="absolute inset-0 blur-3xl rounded-full bg-(--accent) opacity-10 scale-150" />
          <div className="relative w-20 h-20 rounded-2xl bg-linear-to-br from-(--accent) to-teal-700 flex items-center justify-center shadow-(--accent-glow)">
            <Zap className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-(--text-primary) mb-2 tracking-tight">
          Welcome to Aitek Save
        </h1>
        <p className="text-sm text-(--text-secondary) text-center max-w-sm mb-10">
          Build and test API endpoints without a backend. Create a project to get started.
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-4 mb-10 w-full max-w-xl">
          {[
            { icon: "🗂️", title: "Projects", desc: "Organize endpoints into projects" },
            { icon: "⚡", title: "Live Testing", desc: "Send requests & inspect responses" },
            { icon: "🔒", title: "Auth Support", desc: "Bearer, Basic, API Key auth" },
          ].map((f) => (
            <div
              key={f.title}
              className="p-4 rounded-xl border border-(--border) bg-(--bg-surface) text-center hover:border-(--border-strong) transition-colors"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-xs font-semibold text-(--text-primary) mb-1">{f.title}</div>
              <div className="text-[11px] text-(--text-muted)">{f.desc}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-(--accent) text-white font-semibold text-sm hover:bg-teal-400 transition-colors shadow-(--accent-glow)"
        >
          <FolderPlus className="w-4 h-4" />
          Create your first project
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {showDialog && <ProjectDialog onClose={() => setShowDialog(false)} />}
    </>
  );
}
