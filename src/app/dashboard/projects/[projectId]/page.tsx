"use client";

import { useAppStore } from "@/store/useAppStore";
import { ProjectOverview } from "@/components/project/ProjectOverview";
import { useParams } from "next/navigation";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return <ProjectOverview projectId={projectId} />;
}
