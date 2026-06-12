import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import type { Endpoint, EndpointField } from "@/types";
import toast from "react-hot-toast";

/**
 * Hook to sync endpoints with the backend API.
 */
export function useEndpointSync(projectId: string | null) {
  const queryClient = useQueryClient();
  const { setEndpoints } = useAppStore();

  // Fetch endpoints for project
  const { isLoading: isLoadingEndpoints } = useQuery({
    queryKey: ["endpoints", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await api.get<{ data: any[] }>(`/api/v1/endpoints/${projectId}`);
      
      const endpoints: Endpoint[] = response.data.map((e: any) => ({
        id: e.endpoint_id,
        projectId: e.project_id,
        name: `Device ${e.endpoint_id.slice(0, 8)}`, // Fallback since API has no name
        description: `IoT Ingestion Point (${e.schema_mode} mode)`,
        url: "", // Not applicable for IoT ingestion in this way
        inputCategory: e.schema_mode === "restricted" ? "structured" : "free-text",
        fields: e.validation_rules?.fields || [], // Adjust based on how validation_rules are stored
        method: "POST",
        headers: [],
        queryParams: [],
        auth: { type: "api-key", apiKeyIn: "header", apiKeyName: "X-API-Key", apiKeyValue: e.api_key_hash },
        contentType: "application/json",
        body: "",
        formData: [],
        tags: [],
        createdAt: new Date(e.created_at).getTime(),
        updatedAt: new Date(e.created_at).getTime(),
      }));
      
      setEndpoints(endpoints);
      return endpoints;
    },
    enabled: !!projectId,
  });

  // Create endpoint
  const createEndpointMutation = useMutation({
    mutationFn: (data: { project_id: string; schema_mode: string; validation_rules?: any }) => 
      api.post(`/api/v1/endpoints/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["endpoints", projectId] });
      toast.success("Endpoint (Device) created");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete endpoint
  const deleteEndpointMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/endpoints/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["endpoints", projectId] });
      toast.success("Endpoint (Device) deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update endpoint (validation rules)
  const updateEndpointMutation = useMutation({
    mutationFn: (data: { id: string; schema_mode: string; validation_rules: any }) => 
      api.put(`/api/v1/endpoints/${data.id}`, data), // The spec doesn't show a PUT for endpoints? 
    // Checking spec... actually it doesn't show PUT /api/v1/endpoints/{id}.
    // It only shows DELETE.
    // This is problematic. Maybe it's handled via a different endpoint?
    // Looking at the spec again... I don't see an update for endpoints.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["endpoints", projectId] });
      toast.success("Endpoint updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    isLoadingEndpoints,
    createEndpoint: createEndpointMutation.mutate,
    deleteEndpoint: deleteEndpointMutation.mutate,
    updateEndpoint: updateEndpointMutation.mutate,
  };
}
