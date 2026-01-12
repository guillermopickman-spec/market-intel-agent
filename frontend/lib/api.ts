const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ApiError {
  detail: string;
  status?: number;
}

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public originalError?: unknown
  ) {
    super(detail);
    this.name = 'ApiClientError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorDetail;
    } catch {
      // If response is not JSON, use status text
    }
    throw new ApiClientError(response.status, errorDetail);
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {} as T;
  }

  return response.json();
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError(0, `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
  }
}

export async function apiStream(
  endpoint: string,
  options: RequestInit = {},
  onChunk: (chunk: string) => void,
  onError?: (error: Error) => void
): Promise<void> {
  const url = `${API_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiClientError(
        response.status,
        errorData.detail || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            onChunk(line.trim());
          } catch (error) {
            if (onError) {
              onError(error instanceof Error ? error : new Error(String(error)));
            }
          }
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      onChunk(buffer.trim());
    }
  } catch (error) {
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)));
    } else {
      throw error;
    }
  }
}
