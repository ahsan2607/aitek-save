// ─── Core domain types ───────────────────────────────────────────────────────

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export type AuthType = "none" | "bearer" | "basic" | "api-key";

export type ContentType =
  | "application/json"
  | "application/x-www-form-urlencoded"
  | "multipart/form-data"
  | "text/plain"
  | "none";

export type ResponseStatus = "idle" | "loading" | "success" | "error";

// ─── Header / Param / Variable ───────────────────────────────────────────────

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  secret: boolean;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthConfig {
  type: AuthType;
  bearerToken?: string;
  basicUsername?: string;
  basicPassword?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyIn?: "header" | "query";
}

// ─── Endpoint (a saved API request definition) ───────────────────────────────

export interface EndpointResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  durationMs: number;
  size: number;
  timestamp: number;
}

export interface Endpoint {
  id: string;
  projectId: string;
  name: string;
  description: string;
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  auth: AuthConfig;
  contentType: ContentType;
  body: string; // raw JSON/text body
  formData: KeyValuePair[];
  lastResponse?: EndpointResponse;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

// ─── Project ─────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  color: string;
  icon: string;
  envVars: EnvironmentVariable[];
  endpointIds: string[]; // ordered list
  createdAt: number;
  updatedAt: number;
}

// ─── Store shape ─────────────────────────────────────────────────────────────

export interface AppState {
  projects: Record<string, Project>;
  endpoints: Record<string, Endpoint>;
  activeProjectId: string | null;
  activeEndpointId: string | null;

  // Project actions
  createProject: (data: Omit<Project, "id" | "createdAt" | "updatedAt" | "endpointIds">) => string;
  updateProject: (id: string, data: Partial<Omit<Project, "id">>) => void;
  deleteProject: (id: string) => void;

  // Endpoint actions
  createEndpoint: (projectId: string, data?: Partial<Omit<Endpoint, "id" | "projectId" | "createdAt" | "updatedAt">>) => string;
  updateEndpoint: (id: string, data: Partial<Omit<Endpoint, "id" | "projectId">>) => void;
  duplicateEndpoint: (id: string) => string;
  deleteEndpoint: (id: string) => void;
  setEndpointResponse: (id: string, response: EndpointResponse) => void;

  // Navigation
  setActiveProject: (id: string | null) => void;
  setActiveEndpoint: (id: string | null) => void;
}

// ─── Request runner ──────────────────────────────────────────────────────────

export interface RunRequestPayload {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
}

export interface RunRequestResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  durationMs: number;
  size: number;
}
