import { useAppStore } from "@/store/useAppStore";

const BASE_URL = process.env.AITEK_BASE_URL || "http://100.104.248.49:3000";

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const { auth, setAuth, logout } = useAppStore.getState();
  if (!auth.refreshToken) {
    logout();
    return null;
  }

  try {
    // The OpenAPI spec says refresh_token is a query parameter for the POST request
    const response = await fetch(`${BASE_URL}/api/v1/auth/refresh?refresh_token=${auth.refreshToken}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const result = await response.json();
    // Assuming structure based on common API patterns: { data: { access_token, refresh_token, user } }
    const { access_token, refresh_token, user } = result.data || {};
    
    if (!access_token) {
      throw new Error("No access token in refresh response");
    }

    setAuth(user || auth.user, access_token, refresh_token || auth.refreshToken);
    return access_token;
  } catch (error) {
    logout();
    return null;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}

/**
 * Custom fetch wrapper to handle API calls with authentication and token refresh.
 */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { auth } = useAppStore.getState();
  const token = auth.token;

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized by attempting to refresh the token
  if (response.status === 401 && auth.refreshToken && !path.includes("/auth/refresh")) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = performRefresh();
    }

    const newToken = await refreshPromise;
    if (newToken) {
      // Retry the original request with the new token
      headers.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
      });
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail?.[0]?.msg || errorData.message || "An error occurred");
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T>(path: string, options?: RequestInit) =>
    apiFetch<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body: unknown, options?: RequestInit) =>
    apiFetch<T>(path, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T>(path: string, body: unknown, options?: RequestInit) =>
    apiFetch<T>(path, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T>(path: string, body: unknown, options?: RequestInit) =>
    apiFetch<T>(path, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T>(path: string, options?: RequestInit) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),
};
