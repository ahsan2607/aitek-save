import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import type { Endpoint, EndpointField, FieldType } from "@/types";
import { makeField } from "@/types";
import toast from "react-hot-toast";

/**
 * Helper to parse the raw structure object from API into EndpointField[]
 */
function parseValidationRules(rules: any): EndpointField[] {
  if (!rules || typeof rules !== "object") return [];
  
  // If it's the old format { fields: [...] }, return that
  if (Array.isArray(rules.fields)) return rules.fields;

  const fields: EndpointField[] = [];

  Object.entries(rules).forEach(([key, value]) => {
    let type: FieldType = "string";
    let itemType: FieldType | "object" = "string";
    let children: EndpointField[] = [];

    if (Array.isArray(value)) {
      type = "array";
      const item = value[0];
      if (typeof item === "object" && item !== null) {
        itemType = "object";
        children = parseValidationRules(item);
      } else {
        itemType = (item as FieldType) || "string";
      }
    } else if (typeof value === "object" && value !== null) {
      type = "object";
      children = parseValidationRules(value);
    } else {
      type = (value as FieldType) || "string";
    }

    fields.push(makeField({
      name: key,
      type,
      itemType,
      children,
      required: true, // Structure-only schema implies required fields
    }));
  });

  return fields;
}

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
      // The API returns APIResponse[List[EndpointResponse]]
      const response = await api.get<{ data: any[] }>(`/api/v1/endpoints/${projectId}`);
      
      const endpoints: Endpoint[] = (response.data || []).map((e: any) => ({
        id: e.endpoint_id,
        projectId: e.project_id,
        APIHashKey: e.api_hash_key,
        schemaMode: e.schema_mode,
        validationRules: JSON.parse(e.validation_rules),
        isActive: e.is_active,
        createdAt: new Date(e.created_at).getTime(),
        lastSeen: new Date(e.last_seen).getTime(),
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

  return {
    isLoadingEndpoints,
    createEndpoint: createEndpointMutation.mutate,
    deleteEndpoint: deleteEndpointMutation.mutate,
  };
}
