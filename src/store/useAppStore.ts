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
      activeProjectId: null,
      activeEndpointId: null,

      createProject: (data) => {
        const project = defaultProject(data);
        set((state) => {
          state.projects[project.id] = project;
          state.activeProjectId = project.id;
          state.activeEndpointId = null;
        });
        return project.id;
      },

      /**
       * Update an existing project partially.
       * Input: project id and partial fields. Final state: updated project values.
       */

      updateProject: (id, data) => {
        set((state) => {
          if (!state.projects[id]) return;
          Object.assign(state.projects[id], { ...data, updatedAt: Date.now() });
        });
      },

      /**
       * Delete a project and all its endpoints.
       * Input: project id. Final state: removed project and endpoints cleaned up.
       */

      deleteProject: (id) => {
        set((state) => {
          const project = state.projects[id];
          if (!project) return;
          for (const eid of project.endpointIds) delete state.endpoints[eid];
          delete state.projects[id];
          if (state.activeProjectId === id) {
            const remaining = Object.keys(state.projects);
            state.activeProjectId = remaining[0] ?? null;
            state.activeEndpointId = null;
          }
        });
      },

      /**
       * Create a new endpoint under a project.
       * Input: project id and optional endpoint overrides.
       * Final state: endpoint added, project updated, endpoint activated.
       */

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

      /**
       * Update an endpoint partially.
       * Input: endpoint id and partial endpoint data. Final state: endpoint updated in store.
       */

      updateEndpoint: (id, data) => {
        set((state) => {
          if (!state.endpoints[id]) return;
          Object.assign(state.endpoints[id], { ...data, updatedAt: Date.now() });
        });
      },

      /**
       * Duplicate an endpoint with a new id and fresh nested field ids.
       * Input: endpoint id. Final state: duplicate endpoint created and selected.
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
            fields: original.fields.map(regenerateFieldIds),
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

      /**
       * Delete an endpoint from the store and remove it from its project.
       * Input: endpoint id. Final state: endpoint removed and active endpoint reset if necessary.
       */

      deleteEndpoint: (id) => {
        set((state) => {
          const endpoint = state.endpoints[id];
          if (!endpoint) return;
          delete state.endpoints[id];
          const project = state.projects[endpoint.projectId];
          if (project) {
            project.endpointIds = project.endpointIds.filter((eid) => eid !== id);
          }
          if (state.activeEndpointId === id) state.activeEndpointId = null;
        });
      },

      /**
       * Store the last response for an endpoint.
       * Input: endpoint id and response payload. Final state: endpoint response saved.
       */

      setEndpointResponse: (id, response: EndpointResponse) => {
        set((state) => {
          if (!state.endpoints[id]) return;
          state.endpoints[id].lastResponse = response;
        });
      },
      /**
       * Select a project as active and clear the active endpoint.
       * Input: project id. Final state: active project changed.
       */
      setActiveProject: (id) => {
        set((state) => {
          state.activeProjectId = id;
          state.activeEndpointId = null;
        });
      },

      /**
       * Select a specific endpoint as active.
       * Input: endpoint id. Final state: active endpoint updated.
       */

      setActiveEndpoint: (id) => {
        set((state) => {
          state.activeEndpointId = id;
        });
      },
    })),
    {
      name: "aiteksave-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
