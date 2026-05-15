import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { v4 as uuidv4 } from "uuid";
import type {
  AppState,
  Project,
  Endpoint,
  EndpointResponse,
  HttpMethod,
  AuthConfig,
} from "@/types";

const DEFAULT_AUTH: AuthConfig = { type: "none" };

const defaultEndpoint = (projectId: string, overrides: Partial<Endpoint> = {}): Endpoint => ({
  id: uuidv4(),
  projectId,
  name: "New Endpoint",
  description: "",
  method: "GET" as HttpMethod,
  url: "",
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

const defaultProject = (
  data: Omit<Project, "id" | "createdAt" | "updatedAt" | "endpointIds">
): Project => ({
  id: uuidv4(),
  endpointIds: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  // envVars: [],
  ...data,
});

export const useAppStore = create<AppState>()(
  persist(
    immer((set) => ({
      projects: {},
      endpoints: {},
      activeProjectId: null,
      activeEndpointId: null,

      // ── Project actions ────────────────────────────────────────────────────

      createProject: (data) => {
        const project = defaultProject(data);
        set((state) => {
          state.projects[project.id] = project;
          state.activeProjectId = project.id;
          state.activeEndpointId = null;
        });
        return project.id;
      },

      updateProject: (id, data) => {
        set((state) => {
          if (!state.projects[id]) return;
          Object.assign(state.projects[id], { ...data, updatedAt: Date.now() });
        });
      },

      deleteProject: (id) => {
        set((state) => {
          const project = state.projects[id];
          if (!project) return;
          // Remove all endpoints
          for (const eid of project.endpointIds) {
            delete state.endpoints[eid];
          }
          delete state.projects[id];
          if (state.activeProjectId === id) {
            const remaining = Object.keys(state.projects);
            state.activeProjectId = remaining[0] ?? null;
            state.activeEndpointId = null;
          }
        });
      },

      // ── Endpoint actions ───────────────────────────────────────────────────

      createEndpoint: (projectId, data = {}) => {
        const endpoint = defaultEndpoint(projectId, data);
        set((state) => {
          state.endpoints[endpoint.id] = endpoint;
          if (state.projects[projectId]) {
            state.projects[projectId].endpointIds.push(endpoint.id);
            state.projects[projectId].updatedAt = Date.now();
          }
          state.activeEndpointId = endpoint.id;
        });
        return endpoint.id;
      },

      updateEndpoint: (id, data) => {
        set((state) => {
          if (!state.endpoints[id]) return;
          Object.assign(state.endpoints[id], { ...data, updatedAt: Date.now() });
        });
      },

      duplicateEndpoint: (id) => {
        let newId = "";
        set((state) => {
          const original = state.endpoints[id];
          if (!original) return;
          const copy: Endpoint = {
            ...JSON.parse(JSON.stringify(original)),
            id: uuidv4(),
            name: `${original.name} (copy)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastResponse: undefined,
          };
          newId = copy.id;
          state.endpoints[copy.id] = copy;
          if (state.projects[original.projectId]) {
            const idx = state.projects[original.projectId].endpointIds.indexOf(id);
            state.projects[original.projectId].endpointIds.splice(idx + 1, 0, copy.id);
          }
          state.activeEndpointId = copy.id;
        });
        return newId;
      },

      deleteEndpoint: (id) => {
        set((state) => {
          const endpoint = state.endpoints[id];
          if (!endpoint) return;
          delete state.endpoints[id];
          const project = state.projects[endpoint.projectId];
          if (project) {
            project.endpointIds = project.endpointIds.filter((eid) => eid !== id);
          }
          if (state.activeEndpointId === id) {
            state.activeEndpointId = null;
          }
        });
      },

      setEndpointResponse: (id, response: EndpointResponse) => {
        set((state) => {
          if (!state.endpoints[id]) return;
          state.endpoints[id].lastResponse = response;
        });
      },

      // ── Navigation ────────────────────────────────────────────────────────

      setActiveProject: (id) => {
        set((state) => {
          state.activeProjectId = id;
          state.activeEndpointId = null;
        });
      },

      setActiveEndpoint: (id) => {
        set((state) => {
          state.activeEndpointId = id;
        });
      },
    })),
    {
      name: "apiforge-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
