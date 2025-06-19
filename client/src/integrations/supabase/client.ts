// Express API client - replaces Supabase integration
import { apiRequest } from "@/lib/queryClient";

// Mock auth for compatibility with existing components
export const supabase = {
  auth: {
    getSession: () => Promise.resolve({ 
      data: { session: { user: { id: "mock-user", email: "user@example.com" } } }, 
      error: null 
    }),
    getUser: () => Promise.resolve({ 
      data: { user: { id: "mock-user", email: "user@example.com" } }, 
      error: null 
    }),
    signInWithPassword: () => Promise.resolve({ 
      data: { user: { id: "mock-user", email: "user@example.com" } }, 
      error: null 
    }),
    signUp: () => Promise.resolve({ 
      data: { user: { id: "mock-user", email: "user@example.com" } }, 
      error: null 
    }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: (callback: any) => {
      // Call callback immediately with mock session
      callback('SIGNED_IN', { user: { id: "mock-user", email: "user@example.com" } });
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
  },
  from: (table: string) => ({
    select: (columns = "*") => ({
      eq: (column: string, value: any) => ({
        single: () => apiRequest("GET", `/api/${table}/${value}`),
        limit: (count: number) => apiRequest("GET", `/api/${table}?limit=${count}`),
      }),
      order: (column: string, options?: { ascending?: boolean }) => 
        apiRequest("GET", `/api/${table}`),
      then: (callback: any) => apiRequest("GET", `/api/${table}`).then(callback),
    }),
    insert: (data: any) => ({
      select: () => ({
        single: () => apiRequest("POST", `/api/${table}`, data),
      }),
      then: (callback: any) => apiRequest("POST", `/api/${table}`, data).then(callback),
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: () => ({
          single: () => apiRequest("PUT", `/api/${table}/${value}`, data),
        }),
        then: (callback: any) => apiRequest("PUT", `/api/${table}/${value}`, data).then(callback),
      }),
    }),
    delete: () => ({
      eq: (column: string, value: any) => ({
        then: (callback: any) => apiRequest("DELETE", `/api/${table}/${value}`).then(callback),
      }),
    }),
  }),
};