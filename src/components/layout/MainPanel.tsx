"use client";

import { useAppStore } from "@/store/useAppStore";
import { EndpointEditor } from "@/components/endpoint/EndpointEditor";
import { ProjectOverview } from "@/components/project/ProjectOverview";
import { WelcomeScreen } from "@/components/layout/WelcomeScreen";

export function MainPanel() {
  const { activeEndpointId, activeProjectId, endpoints } = useAppStore();

  const activeEndpoint = activeEndpointId ? endpoints[activeEndpointId] : null;

  if (activeEndpoint) {
    return (
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <EndpointEditor endpoint={activeEndpoint} />
      </main>
    );
  }

  if (activeProjectId) {
    return (
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <ProjectOverview projectId={activeProjectId} />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
      <WelcomeScreen />
    </main>
  );
}
