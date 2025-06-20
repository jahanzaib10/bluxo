import { QueryClient } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || errorText;
    } catch {
      errorMessage = errorText || `HTTP ${res.status}`;
    }
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  data?: any
): Promise<any> {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies for HTTP-only auth
  };

  // Add authorization header if token exists in localStorage
  const token = localStorage.getItem('auth_token');
  if (token) {
    (options.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  const res = await fetch(url, options);
  await throwIfResNotOk(res);

  if (method === "DELETE") {
    return {};
  }

  const responseData = await res.json();

  // Store token if this is a login response
  if (url.includes('/auth/login') && responseData.token) {
    localStorage.setItem('auth_token', responseData.token);
  }

  // Clear token if this is a logout response
  if (url.includes('/auth/logout')) {
    localStorage.removeItem('auth_token');
  }

  return responseData;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const [url] = queryKey as [string, ...unknown[]];
        return await apiRequest("GET", url);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        if (error?.message?.includes("401") || error?.message?.includes("403")) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});