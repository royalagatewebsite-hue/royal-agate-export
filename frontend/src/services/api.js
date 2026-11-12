const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ACCESS_TOKEN_KEY = "royal_agate_access";
const REFRESH_TOKEN_KEY = "royal_agate_refresh";
const USER_KEY = "royal_agate_user";

let refreshPromise = null;

// Parse API response
async function parseResponse(response) {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

// Refresh access token
async function refreshTokens() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  if (!refreshToken) {
    throw new Error("Refresh token not found.");
  }

  const response = await fetch(
    `${API_BASE_URL}/accounts/token/refresh/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    }
  );

  const data = await parseResponse(response);

  if (!response.ok || !data.access) {
    throw new Error("Session expired. Please login again.");
  }

  // Save rotated tokens
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access);

  if (data.refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
  }

  // Notify AuthContext about refreshed access token
  window.dispatchEvent(
    new CustomEvent("auth:token-refreshed", {
      detail: {
        accessToken: data.access,
      },
    })
  );

  return data.access;

}

// Handle expired session
function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  window.dispatchEvent(
    new Event("auth:session-expired")
  );
}

// Main API request
export async function apiRequest(
  endpoint,
  {
    method = "GET",
    body,
    token,
    headers = {},
    retry = true,
  } = {}
) {
  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const currentToken =
    token || localStorage.getItem(ACCESS_TOKEN_KEY);

  if (currentToken) {
    requestHeaders.Authorization = `Bearer ${currentToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: requestHeaders,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  // Automatically refresh expired access token
  const isAuthEndpoint =
    endpoint.includes("/accounts/login/") ||
    endpoint.includes("/accounts/register/") ||
    endpoint.includes("/accounts/token/refresh/") ||
    endpoint.includes("/accounts/logout/");

  if (
    response.status === 401 &&
    retry &&
    currentToken &&
    !isAuthEndpoint
  ) {
    try {
      // Prevent multiple simultaneous refresh requests
      if (!refreshPromise) {
        refreshPromise = refreshTokens().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccessToken = await refreshPromise;

      // Retry original request with new token
      return apiRequest(endpoint, {
        method,
        body,
        token: newAccessToken,
        headers,
        retry: false,
      });

    } catch (error) {
      clearSession();
      throw error;
    }
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const errorMessage =
      typeof data === "object" && data !== null
        ? data.detail ||
          data.message ||
          Object.values(data).flat().join(" ")
        : data || `API Error: ${response.status}`;

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}