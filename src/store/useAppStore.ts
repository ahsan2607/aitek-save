import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { v4 as uuidv4 } from "uuid";
import type {
  AppState,
  Project,
  Endpoint,
  EndpointField,
  EndpointResponse,
  HttpMethod,
  AuthConfig,
} from "@/types";

const DEFAULT_AUTH: AuthConfig = { type: "none" };

/**
 * Create a new endpoint object with default values.
 * Initial state: fresh endpoint with no schema or response.
 * Final state: endpoint object ready to store in the app state.
 */
const defaultEndpoint = (projectId: string, overrides: Partial<Endpoint> = {}): Endpoint => ({
  id: uuidv4(),
  projectId,
  name: "new-endpoint",
  description: "",
  url: "",
  inputCategory: "free-text",
  fields: [],
  method: "GET" as HttpMethod,
  headers: [],
  queryParams: [],
  auth: DEFAULT_AUTH,
  contentType: "application/json",
  body: "",
  formData: [],
  tags: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

/**
 * Create a new project object with default metadata.
 * Initial state: project data from the dialog. Final state: persisted project state.
 */
const defaultProject = (
  data: Omit<Project, "id" | "createdAt" | "updatedAt" | "endpointIds">
): Project => ({
  id: uuidv4(),
  endpointIds: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...data,
});

// ─── Helper to regenerate nested field IDs ────────────────────────────────────
// Ensures that when duplicating an endpoint, all nested field children get new IDs
// to avoid ID collisions between the original and duplicate
const regenerateFieldIds = (field: EndpointField): EndpointField => ({
  ...field,
  id: uuidv4(),
  children: field.children.map(regenerateFieldIds),
});

/**
 * Create a new project in the store.
 * Input: project metadata. Final state: added project and active project selected.
 */
export const useAppStore = create<AppState>()(
  persist(
    immer((set) => ({
      projects: {},
      endpoints: {},

      hasHydrated: false,
      setHasHydrated: (state) => {
        set({ hasHydrated: state });
      },

      // Auth
      auth: {
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      },

      setAuth: (user, token, refreshToken) => {
        set((state) => {
          state.auth.user = user;
          state.auth.token = token;
          state.auth.refreshToken = refreshToken;
          state.auth.isAuthenticated = !!token;
        });
      },

      logout: () => {
        set((state) => {
          state.auth.user = null;
          state.auth.token = null;
          state.auth.refreshToken = null;
          state.auth.isAuthenticated = false;
          state.projects = {};
          state.endpoints = {};
        });
      },

      setProjects: (incomingProjects) => {
        set((state) => {
          // 1. First, build a map of which endpoints belong to which projects 
          // strictly from our local store's live endpoints dictionary.
          const localProjectEndpointMap: Record<string, string[]> = {};
          
          for (const ep of Object.values(state.endpoints)) {
            if (!localProjectEndpointMap[ep.projectId]) {
              localProjectEndpointMap[ep.projectId] = [];
            }
            localProjectEndpointMap[ep.projectId].push(ep.id);
          }

          // 2. Map the incoming server payload into a clean lookup object
          const incomingProjectMap = incomingProjects.reduce<Record<string, Project>>((acc, p) => {
            const existingProject = state.projects[p.id] || {};
            
            acc[p.id] = {
              ...p,
              // PRIORITY:
              // 1. Look at our live local endpoints dictionary map first
              // 2. Fallback to what we currently have in state memory
              // 3. Fallback to server payload array
              // 4. Default to empty array
              endpointIds: localProjectEndpointMap[p.id] || existingProject.endpointIds || p.endpointIds || []
            };
            return acc;
          }, {});

          // 3. Detect Deletions & Merge safely
          const isSingleProjectPayload = incomingProjects.length === 1;

          if (isSingleProjectPayload) {
            // If it's just one project added/updated, combine it with our current cache
            state.projects = { ...state.projects, ...incomingProjectMap };
          } else {
            // If it's a full sync list, overwrite state so deleted projects vanish,
            // but the remaining projects maintain their calculated endpoints perfectly.
            state.projects = incomingProjectMap;
          }
        });
      },

      setEndpoints: (incomingEndpoints) => {
        set((state) => {
          // GUARD: If a background hook fetches a completely empty array of endpoints,
          // do not touch anything. It means a background hook fired before a project ID loaded.
          if (!incomingEndpoints || incomingEndpoints.length === 0) {
            return;
          }

          // 1. Create a Set of project IDs involved in this specific endpoint chunk
          const affectedProjectIds = new Set(incomingEndpoints.map((e) => e.projectId));

          // 2. Update the main endpoints dictionary collection safely.
          // Instead of wiping out everything, we only replace/add endpoints that match 
          // the projects currently being targeted by this payload.
          const nextEndpoints = { ...state.endpoints };
          for (const e of incomingEndpoints) {
            nextEndpoints[e.id] = e;
          }
          state.endpoints = nextEndpoints;

          // 3. Sync endpoint IDs back into their respective parent projects
          for (const e of incomingEndpoints) {
            const project = state.projects[e.projectId];
            if (project) {
              if (!project.endpointIds) {
                project.endpointIds = [];
              }
              if (!project.endpointIds.includes(e.id)) {
                project.endpointIds.push(e.id);
              }
            }
          }

          // 4. Handle removals within the affected projects ONLY.
          // Create a Set of valid incoming IDs to perform a fast lookup
          const incomingIds = new Set(incomingEndpoints.map((e) => e.id));

          // We look closely at our active projects. If a project was part of this incoming payload, 
          // we clean out any local endpoints that are no longer present in the server's response.
          for (const project of Object.values(state.projects)) {
            if (affectedProjectIds.has(project.id) && project.endpointIds) {
              project.endpointIds = project.endpointIds.filter((id) => {
                // If the endpoint ID is part of the server payload, keep it if it's alive.
                if (incomingIds.has(id)) return true;
                
                // If the endpoint exists in our overall state but belongs to this project 
                // and wasn't sent down in this batch, it means it was deleted.
                const localEp = state.endpoints[id];
                if (localEp && localEp.projectId === project.id) {
                  // Remove it from the general list too
                  delete state.endpoints[id];
                  return false;
                }
                
                return true;
              });
            }
          }
        });
      },

      /**
       * Duplicate an endpoint locally. 
       * (Note: Should ideally be handled by API, but kept for UI prototyping)
       */
      duplicateEndpoint: (id) => {
        let newId = "";
        set((state) => {
          const original = state.endpoints[id];
          if (!original) return;
          const copy: Endpoint = {
            ...JSON.parse(JSON.stringify(original)),
            id: uuidv4(),
            name: `${original.name}-copy`,
            fields: original.fields?.map(regenerateFieldIds) ?? [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastResponse: undefined,
          };
          newId = copy.id;
          state.endpoints[copy.id] = copy;
          if (state.projects[original.projectId]) {
            state.projects[original.projectId].endpointIds.push(copy.id);
          }
        });
        return newId;
      },

      setEndpointResponse: (id, response: EndpointResponse) => {
        set((state) => {
          if (!state.endpoints[id]) return;
          state.endpoints[id].lastResponse = response;
        });
      },
    })),
    {
      name: "aiteksave-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
