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

// ─── Protocols ───────────────────────────────────────────────────────────────
// Every endpoint supports all 5 operations — displayed as read-only badges.
export const PROTOCOLS = ["GET", "POST", "DETAIL", "UPDATE", "DELETE"] as const;
export type Protocol = (typeof PROTOCOLS)[number];

// ─── Input category ──────────────────────────────────────────────────────────
// "free-text"  → accepts any string/blob, no schema
// "structured" → has a defined nested field schema
export type InputCategory = "free-text" | "structured";

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

// ─── Endpoint response ────────────────────────────────────────────────────────

export interface EndpointResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  durationMs: number;
  size: number;
  timestamp: number;
}

// ─── Field definition ─────────────────────────────────────────────────────────

export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "object"
  | "array"
  | "date"
  | "email"
  | "url"
  | "uuid"
  | "any";

export type FieldLocation = "body" | "query" | "path";

export interface EndpointField {
  id: string;
  name: string;
  type: FieldType;
  location: FieldLocation;
  required: boolean;
  description: string;
  allowedValues: string[];     // only for string/email/url — empty = free text
  defaultValue: string;
  children: EndpointField[];   // nested fields for object/array types
  itemType: FieldType | "object"; // element type when type === "array"
}

// ─── Endpoint ─────────────────────────────────────────────────────────────────

export interface Endpoint {
  id: string;
  projectId: string;
  name: string;
  description: string;
  url: string;
  inputCategory: InputCategory;
  fields: EndpointField[];
  // kept for runner / future use
  method: HttpMethod;
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  auth: AuthConfig;
  contentType: ContentType;
  body: string;
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
  color: string;
  icon: string;
  envVars: EnvironmentVariable[];
  endpointIds: string[];
  createdAt: number;
  updatedAt: number;
}

// ─── Store shape ─────────────────────────────────────────────────────────────

export interface AppState {
  projects: Record<string, Project>;
  endpoints: Record<string, Endpoint>;
  activeProjectId: string | null;
  activeEndpointId: string | null;

  createProject: (data: Omit<Project, "id" | "createdAt" | "updatedAt" | "endpointIds">) => string;
  updateProject: (id: string, data: Partial<Omit<Project, "id">>) => void;
  deleteProject: (id: string) => void;

  createEndpoint: (projectId: string, data?: Partial<Omit<Endpoint, "id" | "projectId" | "createdAt" | "updatedAt">>) => string;
  updateEndpoint: (id: string, data: Partial<Omit<Endpoint, "id" | "projectId">>) => void;
  duplicateEndpoint: (id: string) => string;
  deleteEndpoint: (id: string) => void;
  setEndpointResponse: (id: string, response: EndpointResponse) => void;

  setActiveProject: (id: string | null) => void;
  setActiveEndpoint: (id: string | null) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalize a name into a URL-safe slug.
 * Input: arbitrary text. Output: lowercase, dash-separated string.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Build the base URL for a project.
 * Input: project name. Output: a generated project URL.
 */
export function projectBaseUrl(projectName: string): string {
  return `https://aitek.save/${slugify(projectName) || "my-project"}`;
}

/**
 * Build the full endpoint preview URL.
 * Input: project and endpoint names. Output: combined endpoint URL.
 */
export function endpointFullUrl(projectName: string, endpointName: string): string {
  return `${projectBaseUrl(projectName)}/${slugify(endpointName) || "endpoint"}`;
}

/**
 * Create a new endpoint schema field with a fresh ID.
 * Initial state: empty field values. Final state: field object ready to use.
 */
export function makeField(overrides: Partial<EndpointField> = {}): EndpointField {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: "",
    type: "string",
    location: "body",
    required: false,
    description: "",
    allowedValues: [],
    defaultValue: "",
    children: [],
    itemType: "string",
    ...overrides,
  };
}

// ─── Runner types ─────────────────────────────────────────────────────────────

/**
 * Payload sent to the proxy runner.
 * Input: HTTP method, target URL, headers, and optional body.
 */
export interface RunRequestPayload {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
}

/**
 * Result returned from a proxied endpoint request.
 * Final state: response metadata, parsed body, timing, and size.
 */
export interface RunRequestResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  durationMs: number;
  size: number;
}
