// Express API client - replaces Supabase integration
import { apiRequest } from "@/lib/queryClient";

// Mock auth for compatibility with existing components
export const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: { user: { id: "mock-user" } } }, error: null }),
    getUser: () => Promise.resolve({ data: { user: { id: "mock-user" } }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: { id: "mock-user" } }, error: null }),
    signUp: () => Promise.resolve({ data: { user: { id: "mock-user" } }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: (table: string) => ({
    select: (columns = "*") => ({
      eq: (column: string, value: any) => ({
        single: () => apiRequest("GET", `/api/${table}/${value}`),
        limit: (count: number) => ({
          data: apiRequest("GET", `/api/${table}?limit=${count}`),
        }),
      }),
      order: (column: string, options?: { ascending?: boolean }) => ({
        data: apiRequest("GET", `/api/${table}`),
      }),
      data: apiRequest("GET", `/api/${table}`),
    }),
    insert: (data: any) => ({
      select: () => ({
        single: () => apiRequest("POST", `/api/${table}`, data),
      }),
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: () => ({
          single: () => apiRequest("PUT", `/api/${table}/${value}`, data),
        }),
      }),
    }),
    delete: () => ({
      eq: (column: string, value: any) => ({
        data: apiRequest("DELETE", `/api/${table}/${value}`),
      }),
    }),
  }),
};