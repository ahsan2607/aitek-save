import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import type { Project } from "@/types";
import toast from "react-hot-toast";

/**
 * Hook to sync projects with the backend API.
 */
export function useProjectSync() {
  const queryClient = useQueryClient();
  const { setProjects } = useAppStore();

  // Fetch projects
  const { isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await api.get<{ data: any[] }>("/api/v1/projects/");
      // Map API project to our local Project type
      const projects: Project[] = response.data.map((p: any) => ({
        id: p.project_id,
        name: p.name,
        description: p.description || "",
        color: p.color || "#00f2ea",
        icon: p.icon || "📁",
        envVars: [],
        endpointIds: [],
        createdAt: new Date(p.created_at).getTime(),
        updatedAt: new Date(p.updated_at || p.created_at).getTime(),
      }));
      setProjects(projects);
      return projects;
    },
  });

  // Create project
  const createProjectMutation = useMutation({
    mutationFn: (name: string) => api.post("/api/v1/projects/", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete project
  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update project
  const updateProjectMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => 
      api.put(`/api/v1/projects/${id}?new_name=${encodeURIComponent(name)}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Fetch single project
  function useProject(id: string) {
    return useQuery({
      queryKey: ["projects", id],
      queryFn: async () => {
        const response = await api.get<{ data: any }>(`/api/v1/projects/${id}`);
        const p = response.data;
        return {
          id: p.project_id,
          name: p.name,
          description: p.description || "",
          color: p.color || "#00f2ea",
          icon: p.icon || "📁",
          envVars: [],
          endpointIds: [],
          createdAt: new Date(p.created_at).getTime(),
          updatedAt: new Date(p.updated_at || p.created_at).getTime(),
        };
      },
      enabled: !!id,
    });
  }

  return {
    isLoadingProjects,
    useProject,
    createProject: createProjectMutation.mutate,
    deleteProject: deleteProjectMutation.mutate,
    updateProject: updateProjectMutation.mutate,
  };
}
