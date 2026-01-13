// API utility for making requests to the backend
// Supports both real API calls and mock mode

const API_TIMEOUT = 10000; // 10 seconds

const getApiUrl = () => {
  if (typeof window === "undefined") return "";
  return process.env.NEXT_PUBLIC_API_URL || "";
};

const useMockApi = () => {
  return process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
};

const isDevelopment = () => {
  return process.env.NODE_ENV === "development";
};

// Create a fetch with timeout
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = API_TIMEOUT
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
};

// Enhanced error handling
const handleApiError = (error: unknown, endpoint: string): Error => {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes("timeout") || error.message.includes("aborted")) {
      const apiUrl = getApiUrl();
      return new Error(`Request to ${endpoint} timed out. Backend may be slow or unavailable. ${apiUrl ? `Trying: ${apiUrl}${endpoint}` : "API URL not configured."}`);
    }
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      const apiUrl = getApiUrl();
      if (!apiUrl) {
        return new Error(`NEXT_PUBLIC_API_URL is not configured. Please set it in .env.local or environment variables.`);
      }
      return new Error(`Cannot connect to backend at ${apiUrl}${endpoint}. Check if the backend is running and accessible. Error: ${error.message}`);
    }
    // CORS errors
    if (error.message.includes("CORS") || error.message.includes("cross-origin")) {
      return new Error(`CORS error: Backend may not allow requests from ${typeof window !== "undefined" ? window.location.origin : "this origin"}. Check backend CORS configuration.`);
    }
    return error;
  }
  return new Error(`Unknown error occurred while calling ${endpoint}`);
};

export const api = {
  async get<T>(endpoint: string): Promise<T> {
    if (useMockApi()) {
      // In mock mode, we'll handle this in queries.ts
      throw new Error("Mock API should be handled in queries.ts");
    }

    const apiUrl = getApiUrl();
    if (!apiUrl) {
      if (isDevelopment()) {
        console.error("[API] NEXT_PUBLIC_API_URL is not configured. Check your .env.local file.");
      }
      throw new Error("NEXT_PUBLIC_API_URL is not configured");
    }

    const url = `${apiUrl}${endpoint}`;

    if (isDevelopment()) {
      console.log(`[API] GET ${url}`);
      console.log(`[API] Environment check - NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL || "NOT SET"}`);
      console.log(`[API] Environment check - NEXT_PUBLIC_USE_MOCK_API: ${process.env.NEXT_PUBLIC_USE_MOCK_API || "NOT SET"}`);
    }

    try {
      const response = await fetchWithTimeout(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`
        );
      }

      const data = await response.json();

      if (isDevelopment()) {
        console.log(`[API] GET ${url} - Success`, data);
      }

      return data as T;
    } catch (error) {
      const enhancedError = handleApiError(error, endpoint);
      if (isDevelopment()) {
        console.error(`[API] GET ${url} - Error`, enhancedError);
      }
      throw enhancedError;
    }
  },

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    if (useMockApi()) {
      throw new Error("Mock API should be handled in queries.ts");
    }

    const apiUrl = getApiUrl();
    if (!apiUrl) {
      throw new Error("NEXT_PUBLIC_API_URL is not configured");
    }

    const url = `${apiUrl}${endpoint}`;

    if (isDevelopment()) {
      console.log(`[API] POST ${url}`, data);
    }

    try {
      // Increase timeout for mission execution (can take longer)
      const timeout = endpoint.includes("/execute") ? 120000 : API_TIMEOUT; // 2 minutes for execute
      
      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
        timeout
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`
        );
      }

      const result = await response.json();

      if (isDevelopment()) {
        console.log(`[API] POST ${url} - Success`, result);
      }

      return result as T;
    } catch (error) {
      const enhancedError = handleApiError(error, endpoint);
      if (isDevelopment()) {
        console.error(`[API] POST ${url} - Error`, enhancedError);
      }
      throw enhancedError;
    }
  },
};
