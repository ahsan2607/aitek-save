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

      setProjects: (projects) => {
        set((state) => {
          state.projects = projects.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
        });
      },

      setEndpoints: (endpoints) => {
        set((state) => {
          state.endpoints = endpoints.reduce((acc, e) => ({ ...acc, [e.id]: e }), {});
          // Sync endpoint IDs back to projects if they are currently loaded
          for (const e of endpoints) {
            if (state.projects[e.projectId] && !state.projects[e.projectId].endpointIds.includes(e.id)) {
              state.projects[e.projectId].endpointIds.push(e.id);
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
            fields: original.fields.map(regenerateFieldIds),
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
