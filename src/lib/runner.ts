import type { Endpoint, EndpointResponse, EnvironmentVariable } from "@/types";
import { kvToRecord, interpolateVariables } from "@/lib/utils";

/**
 * Build a lookup table of environment variable replacements.
 * Input: list of env vars. Final state: object mapping key to value.
 */
function buildVarMap(vars: EnvironmentVariable[]): Record<string, string> {
  return vars.reduce<Record<string, string>>((acc, v) => {
    acc[v.key] = v.value;
    return acc;
  }, {});
}

/**
 * Build the full request URL for an endpoint.
 * Input: endpoint.url and query params. Final state: interpolated URL string.
 */
function buildUrl(endpoint: Endpoint, varMap: Record<string, string>): string {
  let url = interpolateVariables(endpoint.url.trim(), varMap);

  const params = kvToRecord(endpoint.queryParams);
  const interpolatedParams = Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, interpolateVariables(v, varMap)])
  );

  const qs = new URLSearchParams(interpolatedParams).toString();
  if (qs) url += (url.includes("?") ? "&" : "?") + qs;

  return url;
}

/**
 * Build the request headers for an endpoint.
 * Input: endpoint headers, auth, and content type. Final state: headers object.
 */
function buildHeaders(endpoint: Endpoint, varMap: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {};

  // Custom headers
  for (const h of endpoint.headers.filter((h) => h.enabled && h.key)) {
    headers[h.key] = interpolateVariables(h.value, varMap);
  }

  // Auth
  const { auth } = endpoint;
  if (auth.type === "bearer" && auth.bearerToken) {
    headers["Authorization"] = `Bearer ${interpolateVariables(auth.bearerToken, varMap)}`;
  } else if (auth.type === "basic" && auth.basicUsername) {
    const creds = btoa(`${auth.basicUsername}:${auth.basicPassword ?? ""}`);
    headers["Authorization"] = `Basic ${creds}`;
  } else if (auth.type === "api-key" && auth.apiKeyName && auth.apiKeyIn === "header") {
    headers[auth.apiKeyName] = interpolateVariables(auth.apiKeyValue ?? "", varMap);
  }

  // Content-Type
  if (!["GET", "HEAD", "OPTIONS"].includes(endpoint.method) && endpoint.contentType !== "none") {
    if (!headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = endpoint.contentType;
    }
  }

  return headers;
}

/**
 * Build the request body payload if required.
 * Input: endpoint content type and body/form data. Final state: serialized body or undefined.
 */
function buildBody(endpoint: Endpoint, varMap: Record<string, string>): string | undefined {
  if (["GET", "HEAD", "OPTIONS"].includes(endpoint.method)) return undefined;
  if (endpoint.contentType === "none") return undefined;

  if (endpoint.contentType === "application/x-www-form-urlencoded") {
    const formRecord = kvToRecord(endpoint.formData);
    return new URLSearchParams(formRecord).toString();
  }

  if (endpoint.body.trim()) {
    return interpolateVariables(endpoint.body, varMap);
  }

  return undefined;
}

/**
 * Execute an endpoint request through the local proxy.
 * Input: endpoint and env vars. Final state: endpoint response object.
 */
export async function runEndpoint(
  endpoint: Endpoint,
  envVars: EnvironmentVariable[] = []
): Promise<EndpointResponse> {
  const varMap = buildVarMap(envVars);
  const url = buildUrl(endpoint, varMap);
  const headers = buildHeaders(endpoint, varMap);
  const body = buildBody(endpoint, varMap);

  if (!url) throw new Error("URL is required");

  const startTime = performance.now();

  // We proxy through our Next.js API route to avoid CORS issues
  const proxyResponse = await fetch("/api/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: endpoint.method,
      url,
      headers,
      body,
    }),
  });

  const durationMs = performance.now() - startTime;

  if (!proxyResponse.ok && proxyResponse.status !== 0) {
    // Still try to parse the proxy error
  }

  const result = await proxyResponse.json() as {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: unknown;
    size: number;
    error?: string;
  };

  if (result.error) {
    throw new Error(result.error);
  }

  return {
    status: result.status,
    statusText: result.statusText,
    headers: result.headers,
    body: result.body,
    durationMs,
    size: result.size,
    timestamp: Date.now(),
  };
}
