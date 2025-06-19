import { apiRequest } from "./queryClient";

// API functions that match your original Supabase patterns
export const api = {
  // Accounts
  accounts: {
    getAll: () => apiRequest("GET", "/api/accounts"),
    getById: (id: string) => apiRequest("GET", `/api/accounts/${id}`),
    create: (data: any) => apiRequest("POST", "/api/accounts", {
      company_name: data.name || data.company_name,
      company_url: data.url || data.company_url,
      currency: data.currency || "USD",
      created_by: "mock-user"
    }),
    update: (id: string, data: any) => apiRequest("PUT", `/api/accounts/${id}`, data),
    delete: (id: string) => apiRequest("DELETE", `/api/accounts/${id}`)
  },

  // Categories
  categories: {
    getAll: () => apiRequest("GET", "/api/categories"),
    getById: (id: string) => apiRequest("GET", `/api/categories/${id}`),
    create: (data: any) => apiRequest("POST", "/api/categories", {
      name: data.name,
      type: data.type || "expense",
      parent_id: data.parent_id || null,
      created_by: "mock-user"
    }),
    update: (id: string, data: any) => apiRequest("PUT", `/api/categories/${id}`, data),
    delete: (id: string) => apiRequest("DELETE", `/api/categories/${id}`)
  },

  // Clients
  clients: {
    getAll: () => apiRequest("GET", "/api/clients"),
    getById: (id: string) => apiRequest("GET", `/api/clients/${id}`),
    create: (data: any) => apiRequest("POST", "/api/clients", {
      name: data.name,
      email: data.email,
      archived: data.archived || false,
      created_by: "mock-user"
    }),
    update: (id: string, data: any) => apiRequest("PUT", `/api/clients/${id}`, data),
    delete: (id: string) => apiRequest("DELETE", `/api/clients/${id}`)
  },

  // Developers
  developers: {
    getAll: () => apiRequest("GET", "/api/developers"),
    getById: (id: string) => apiRequest("GET", `/api/developers/${id}`),
    create: (data: any) => apiRequest("POST", "/api/developers", {
      name: data.name,
      hourly_rate: data.hourly_rate || "50.00",
      client_id: data.client_id || "mock-client",
      created_by: "mock-user"
    }),
    update: (id: string, data: any) => apiRequest("PUT", `/api/developers/${id}`, data),
    delete: (id: string) => apiRequest("DELETE", `/api/developers/${id}`)
  },

  // Employees
  employees: {
    getAll: () => apiRequest("GET", "/api/employees"),
    getById: (id: string) => apiRequest("GET", `/api/employees/${id}`),
    create: (data: any) => apiRequest("POST", "/api/employees", {
      name: data.name,
      direct_manager_id: data.direct_manager_id || null,
      birth_date: data.birth_date || null,
      end_date: data.end_date || null,
      archived: data.archived || false,
      comments: data.comments || null,
      group_name: data.group_name || null,
      created_by: "mock-user"
    }),
    update: (id: string, data: any) => apiRequest("PUT", `/api/employees/${id}`, data),
    delete: (id: string) => apiRequest("DELETE", `/api/employees/${id}`)
  },

  // Mock data for charts and analytics until we implement these endpoints
  analytics: {
    getOverviewStats: () => Promise.resolve({
      totalRevenue: 125000,
      totalExpenses: 85000,
      profit: 40000,
      growthRate: 12.5
    }),
    getExpenseCategories: () => Promise.resolve([
      { name: "Office Supplies", value: 15000, color: "#8884d8" },
      { name: "Marketing", value: 25000, color: "#82ca9d" },
      { name: "Software", value: 20000, color: "#ffc658" },
      { name: "Travel", value: 12000, color: "#ff7300" }
    ]),
    getMonthlyTrends: () => Promise.resolve([
      { month: "Jan", income: 12000, expenses: 8000 },
      { month: "Feb", income: 15000, expenses: 9000 },
      { month: "Mar", income: 18000, expenses: 11000 },
      { month: "Apr", income: 22000, expenses: 13000 },
      { month: "May", income: 25000, expenses: 15000 },
      { month: "Jun", income: 28000, expenses: 17000 }
    ])
  }
};