// API utility for making requests to the backend
// Supports both real API calls and mock mode

const API_TIMEOUT = 10000; // 10 seconds

// Normalize URL to remove trailing slashes and ensure proper format
const normalizeUrl = (url: string): string => {
  if (!url) return "";
  // Remove trailing slashes
  return url.replace(/\/+$/, "");
};

const getApiUrl = () => {
  if (typeof window === "undefined") return "";
  const url = process.env.NEXT_PUBLIC_API_URL || "";
  return normalizeUrl(url);
};

const useMockApi = () => {
  return process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
};

const isDevelopment = () => {
  return process.env.NODE_ENV === "development";
};

const getApiKey = (): string | undefined => {
  // Get API key from environment variable
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  return apiKey && apiKey.trim() ? apiKey.trim() : undefined;
};

const getHeaders = (includeApiKey: boolean = false): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  // Add API key header if configured and requested
  if (includeApiKey) {
    const apiKey = getApiKey();
    if (apiKey) {
      headers["X-API-Key"] = apiKey;
    }
  }
  
  return headers;
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

    // Ensure endpoint starts with / and API URL doesn't end with /
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${apiUrl}${normalizedEndpoint}`;

    // Always log in production for debugging 404 errors
    console.log(`[API] GET ${url}`);
    if (isDevelopment()) {
      console.log(`[API] Environment check - NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL || "NOT SET"}`);
      console.log(`[API] Environment check - NEXT_PUBLIC_USE_MOCK_API: ${process.env.NEXT_PUBLIC_USE_MOCK_API || "NOT SET"}`);
    }

    try {
      const response = await fetchWithTimeout(url, {
        method: "GET",
        headers: getHeaders(false), // GET requests don't need API key
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        const errorMessage = `API request failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`;
        // Log full URL for debugging 404 errors
        console.error(`[API] GET ${url} failed:`, errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (isDevelopment()) {
        console.log(`[API] GET ${url} - Success`, data);
      }

      return data as T;
    } catch (error) {
      const enhancedError = handleApiError(error, endpoint);
      // Always log errors in production for debugging
      console.error(`[API] GET ${url} - Error`, enhancedError);
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

    // Ensure endpoint starts with / and API URL doesn't end with /
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${apiUrl}${normalizedEndpoint}`;

    // Always log in production for debugging
    console.log(`[API] POST ${url}`, data);

    try {
      // Increase timeout for mission execution (can take longer)
      const timeout = endpoint.includes("/execute") ? 120000 : API_TIMEOUT; // 2 minutes for execute
      
      // Include API key for /execute endpoints
      const includeApiKey = endpoint.includes("/execute");
      
      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: getHeaders(includeApiKey),
          body: JSON.stringify(data),
        },
        timeout
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        const errorMessage = `API request failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`;
        // Log full URL for debugging 404 errors
        console.error(`[API] POST ${url} failed:`, errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (isDevelopment()) {
        console.log(`[API] POST ${url} - Success`, result);
      }

      return result as T;
    } catch (error) {
      const enhancedError = handleApiError(error, endpoint);
      // Always log errors in production for debugging
      console.error(`[API] POST ${url} - Error`, enhancedError);
      throw enhancedError;
    }
  },

  async postStream<T>(
    endpoint: string,
    data: unknown,
    onMessage: (message: T) => void,
    onError?: (error: Error) => void
  ): Promise<() => void> {
    if (useMockApi()) {
      throw new Error("Streaming not supported in mock mode");
    }

    const apiUrl = getApiUrl();
    if (!apiUrl) {
      const error = new Error("NEXT_PUBLIC_API_URL is not configured");
      if (onError) onError(error);
      throw error;
    }

    // Ensure endpoint starts with / and API URL doesn't end with /
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${apiUrl}${normalizedEndpoint}`;

    // Log streaming request
    console.log(`[API] POST STREAM ${url}`, data);

    // Create abort controller for cleanup
    const controller = new AbortController();
    let isAborted = false;

    // Stream timeout: 5 minutes for long missions
    const STREAM_TIMEOUT = 300000; // 5 minutes
    const timeoutId = setTimeout(() => {
      if (!isAborted) {
        controller.abort();
        const timeoutError = new Error(`Stream timeout after ${STREAM_TIMEOUT}ms`);
        if (onError) onError(timeoutError);
      }
    }, STREAM_TIMEOUT);

    // Start the stream
    (async () => {
      // Include API key for /execute endpoints
      const includeApiKey = endpoint.includes("/execute");
      
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: getHeaders(includeApiKey),
          body: JSON.stringify(data),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => response.statusText);
          const errorMessage = `Stream request failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`;
          console.error(`[API] POST STREAM ${url} failed:`, errorMessage);
          const error = new Error(errorMessage);
          if (onError) onError(error);
          return;
        }

        if (!response.body) {
          const error = new Error("Response body is null");
          if (onError) onError(error);
          return;
        }

        // Read the stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // Check if there's remaining buffer data
              if (buffer.trim()) {
                try {
                  const message = JSON.parse(buffer.trim()) as T;
                  onMessage(message);
                } catch (parseError) {
                  console.warn("[API] Failed to parse final buffer:", buffer, parseError);
                }
              }
              break;
            }

            // Decode chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete lines (NDJSON format)
            const lines = buffer.split("\n");
            // Keep the last incomplete line in buffer
            buffer = lines.pop() || "";

            // Parse each complete line
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine) continue;

              try {
                const message = JSON.parse(trimmedLine) as T;
                onMessage(message);
              } catch (parseError) {
                console.warn("[API] Failed to parse JSON line:", trimmedLine, parseError);
                // Continue processing other lines
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } catch (error) {
        if (isAborted) {
          // Abort is expected, don't report as error
          return;
        }

        clearTimeout(timeoutId);
        const enhancedError = handleApiError(error, endpoint);
        console.error(`[API] POST STREAM ${url} - Error`, enhancedError);
        if (onError) onError(enhancedError);
      } finally {
        clearTimeout(timeoutId);
      }
    })();

    // Return cleanup function
    return () => {
      isAborted = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  },
};
