// API Configuration for PHP Backend
// VITE_API_BASE_URL must be set in .env file
// No hardcoded fallback - this must be configured via environment variables

const envApiUrl = import.meta.env.VITE_API_BASE_URL;

if (!envApiUrl) {
  const errorMsg = 'VITE_API_BASE_URL is not set in environment variables. Please add it to your .env file.';
  console.error(errorMsg);
  if (import.meta.env.DEV) {
    throw new Error(errorMsg);
  }
}

export const API_BASE_URL = envApiUrl || '';

// Helper to get auth headers
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/** Parse fetch response as JSON; avoid "unexpected end of data" when server returns empty or non-JSON (e.g. staging misconfig). */
async function parseJsonResponse(response: Response, label: string): Promise<{ success?: boolean; error?: string; message?: string }> {
  const text = await response.text();
  if (!text || !text.trim()) {
    throw new Error(
      `Server returned an empty response for ${label}. Check that VITE_API_BASE_URL points to your API (e.g. /api) and the server is running.`
    );
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Server did not return JSON for ${label}: ${text.substring(0, 120)}`);
  }
  try {
    return JSON.parse(text) as { success?: boolean; error?: string; message?: string };
  } catch {
    throw new Error(`Invalid JSON from server (${label}): ${text.substring(0, 120)}`);
  }
}

// Generic API request helper
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    const json = await response.json();

    if (!response.ok) {
      return { data: null, error: json.error || 'Request failed' };
    }

    return { data: json.data ?? json, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

// Auth API
export const authApi = {
  signUp: async (email: string, password: string, fullName: string, role: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, role }),
    });
    return response.json();
  },

  signIn: async (email: string, password: string) => {
    if (!API_BASE_URL) {
      throw new Error('API_BASE_URL is not configured. Please check your .env file.');
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Invalid response from server: ${text.substring(0, 100)}`);
    }
    
    return response.json();
  },

  signOut: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  getSession: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return { user: null, session: null, role: null };

    const response = await fetch(`${API_BASE_URL}/auth/session.php`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  forgotPassword: async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return parseJsonResponse(response, 'forgot-password');
  },

  resetPassword: async (token: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    return parseJsonResponse(response, 'reset-password');
  },
};

// Firms API
export const firmsApi = {
  get: () => apiRequest<any>('/firms/index.php'),
  create: (data: { name: string; address?: string; phone?: string }) =>
    apiRequest<any>('/firms/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Clients API
export const clientsApi = {
  getByFirm: (firmId: string) => apiRequest<any[]>(`/clients/index.php?firm_id=${firmId}`),
  getOwn: () => apiRequest<any[]>('/clients/index.php'),
  getAssigned: () => apiRequest<any[]>('/clients/assigned.php'),
  create: (data: { user_id: string; firm_id: string; company_name?: string }) =>
    apiRequest<any>('/clients/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { assigned_accountant_id?: string; company_name?: string }) =>
    apiRequest<any>(`/clients/index.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Accountants API
export const accountantsApi = {
  getByFirm: (firmId: string) => apiRequest<any[]>(`/accountants/index.php?firm_id=${firmId}`),
  create: (data: { firm_id: string; accountant_id: string }) =>
    apiRequest<any>('/accountants/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Companies API
export const companiesApi = {
  getByClient: (clientId: string) => apiRequest<any[]>(`/companies/index.php?client_id=${clientId}`),
  create: (data: { client_id: string; company_name: string }) =>
    apiRequest<any>('/companies/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiRequest<any>(`/companies/index.php?id=${id}`, {
      method: 'DELETE',
    }),
};

// Documents API
export const documentsApi = {
  getByClient: (clientId: string) => apiRequest<any[]>(`/documents/index.php?client_id=${clientId}`),
  getByFirm: (firmId: string) => apiRequest<any[]>(`/documents/index.php?firm_id=${firmId}`),
  getOwn: () => apiRequest<any[]>('/documents/index.php'),
  getAssigned: () => apiRequest<any[]>('/documents/assigned.php'),
  create: (data: { client_id: string; file_name: string; file_path: string; file_type?: string; file_size?: number }) =>
    apiRequest<any>('/documents/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { status?: string; notes?: string }) =>
    apiRequest<any>(`/documents/index.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  // Replace old document with new one and transfer clarification history
  replace: (oldDocumentId: string, newDocumentId: string) =>
    apiRequest<any>('/documents/replace.php', {
      method: 'POST',
      body: JSON.stringify({ old_document_id: oldDocumentId, new_document_id: newDocumentId }),
    }),
};

// Notifications API
export const notificationsApi = {
  get: () => apiRequest<any[]>('/notifications/index.php'),
  create: (data: { user_id: string; title: string; message: string; document_id?: string }) =>
    apiRequest<any>('/notifications/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  markRead: (id: string) =>
    apiRequest<any>(`/notifications/index.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_read: true }),
    }),
  markAllRead: () =>
    apiRequest<any>(`/notifications/index.php?id=all`, {
      method: 'PUT',
      body: JSON.stringify({ is_read: true }),
    }),
};

// Reminders API
export const remindersApi = {
  getByFirm: (firmId: string) => apiRequest<any[]>(`/reminders/index.php?firm_id=${firmId}`),
  /** Get reminders sent to the current user (client view). Returns sender_type, sender_name, firm_name. */
  getForClient: () => apiRequest<any[]>('/reminders/index.php'),
  create: (data: {
    firm_id: string;
    recipient_type: 'client' | 'accountant';
    recipient_id: string;
    recipient_user_id: string;
    title: string;
    message: string;
    scheduled_at: string;
    send_option?: 'now' | 'schedule';
    recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly';
    recurrence_end_at?: string | null;
  }) =>
    apiRequest<any>('/reminders/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiRequest<any>(`/reminders/index.php?id=${id}`, {
      method: 'DELETE',
    }),
  /** Process due reminders for the current user's firm (sends scheduled reminders that are past due). */
  processDue: () =>
    apiRequest<{ processed: number }>('/reminders/process.php'),
};

// Invites API
export const invitesApi = {
  validate: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/invites/index.php?token=${token}`);
    return response.json();
  },
  create: (data: { firm_id: string; email: string; role: string }) =>
    apiRequest<any>('/invites/index.php', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  markUsed: (token: string) =>
    apiRequest<any>(`/invites/index.php?token=${token}`, {
      method: 'PUT',
    }),
};

// Profiles API
export const profilesApi = {
  get: (userId?: string) => apiRequest<any>(userId ? `/profiles/index.php?user_id=${userId}` : '/profiles/index.php'),
  update: (data: { full_name?: string; phone?: string; avatar_url?: string }) =>
    apiRequest<any>('/profiles/index.php', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// File Upload
export const uploadFile = async (file: File, clientId?: string, companyId?: string | null) => {
  const formData = new FormData();
  formData.append('file', file);
  if (clientId) formData.append('client_id', clientId);
  if (companyId) formData.append('company_id', companyId);

  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/upload/index.php`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  return response.json();
};

// =====================================================
// SUPER ADMIN APIs
// =====================================================

export const adminApi = {
  // Dashboard stats
  getDashboard: () => apiRequest<any>('/admin/dashboard.php'),

  // Firms management
  firms: {
    list: (params?: { search?: string; status?: string; plan?: string; page?: number; per_page?: number }) => {
      const qs = new URLSearchParams();
      if (params?.search) qs.set('search', params.search);
      if (params?.status) qs.set('status', params.status);
      if (params?.plan) qs.set('plan', params.plan);
      if (params?.page) qs.set('page', String(params.page));
      if (params?.per_page) qs.set('per_page', String(params.per_page));
      const q = qs.toString();
      return apiRequest<any>(`/admin/firms/index.php${q ? '?' + q : ''}`);
    },
    get: (id: string) => apiRequest<any>(`/admin/firms/index.php?id=${id}`),
    update: (id: string, data: any) =>
      apiRequest<any>(`/admin/firms/index.php?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiRequest<any>(`/admin/firms/index.php?id=${id}`, { method: 'DELETE' }),
  },

  // Users management
  users: {
    list: (params?: { search?: string; role?: string; firm_id?: string; page?: number; per_page?: number }) => {
      const qs = new URLSearchParams();
      if (params?.search) qs.set('search', params.search);
      if (params?.role) qs.set('role', params.role);
      if (params?.firm_id) qs.set('firm_id', params.firm_id);
      if (params?.page) qs.set('page', String(params.page));
      if (params?.per_page) qs.set('per_page', String(params.per_page));
      const q = qs.toString();
      return apiRequest<any>(`/admin/users/index.php${q ? '?' + q : ''}`);
    },
    update: (id: string, data: any) =>
      apiRequest<any>(`/admin/users/index.php?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiRequest<any>(`/admin/users/index.php?id=${id}`, { method: 'DELETE' }),
  },

  // Platform settings
  settings: {
    get: () => apiRequest<any>('/admin/settings/index.php'),
    update: (data: Record<string, string>) =>
      apiRequest<any>('/admin/settings/index.php', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Usage tracking
  usage: {
    getAll: (period?: string) => {
      const qs = period ? `?period=${period}` : '';
      return apiRequest<any>(`/admin/usage/index.php${qs}`);
    },
    getByFirm: (firmId: string, period?: string) => {
      const qs = new URLSearchParams({ firm_id: firmId });
      if (period) qs.set('period', period);
      return apiRequest<any>(`/admin/usage/index.php?${qs.toString()}`);
    },
  },

  // Plans management
  plans: {
    list: () => apiRequest<any>('/admin/plans/index.php'),
    create: (data: any) =>
      apiRequest<any>('/admin/plans/index.php', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiRequest<any>(`/admin/plans/index.php?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiRequest<any>(`/admin/plans/index.php?id=${id}`, { method: 'DELETE' }),
  },

  // Audit logs
  audit: {
    list: (params?: { search?: string; action?: string; entity_type?: string; page?: number; per_page?: number }) => {
      const qs = new URLSearchParams();
      if (params?.search) qs.set('search', params.search);
      if (params?.action) qs.set('action', params.action);
      if (params?.entity_type) qs.set('entity_type', params.entity_type);
      if (params?.page) qs.set('page', String(params.page));
      if (params?.per_page) qs.set('per_page', String(params.per_page));
      const q = qs.toString();
      return apiRequest<any>(`/admin/audit/index.php${q ? '?' + q : ''}`);
    },
  },

  // Announcements
  announcements: {
    list: () => apiRequest<any>('/admin/announcements/index.php'),
    create: (data: any) =>
      apiRequest<any>('/admin/announcements/index.php', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiRequest<any>(`/admin/announcements/index.php?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiRequest<any>(`/admin/announcements/index.php?id=${id}`, { method: 'DELETE' }),
  },
};

// Email Notification Preferences API
export const emailPreferencesApi = {
  get: () => apiRequest<any>('/email-preferences/index.php'),
  update: (data: Record<string, any>) =>
    apiRequest<any>('/email-preferences/index.php', { method: 'POST', body: JSON.stringify(data) }),
};

// Document Categories API
export const documentCategoriesApi = {
  list: (firmId?: string) => apiRequest<any[]>(`/document-categories/index.php${firmId ? '?firm_id=' + firmId : ''}`),
  create: (data: { name: string; color?: string; sort_order?: number }) =>
    apiRequest<any>('/document-categories/index.php', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiRequest<any>(`/document-categories/index.php?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiRequest<any>(`/document-categories/index.php?id=${id}`, { method: 'DELETE' }),
};

// Company Requests API (Client self-service)
export const companyRequestsApi = {
  list: () => apiRequest<any[]>('/company-requests/index.php'),
  create: (data: { company_name: string; reason?: string }) =>
    apiRequest<any>('/company-requests/index.php', { method: 'POST', body: JSON.stringify(data) }),
  review: (id: string, data: { status: 'approved' | 'rejected'; review_notes?: string }) =>
    apiRequest<any>(`/company-requests/index.php?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// Firm Audit Trail API
export const firmAuditApi = {
  list: (page?: number) => apiRequest<any>(`/firm-audit/index.php${page ? '?page=' + page : ''}`),
};

// Advanced Search API
export const searchApi = {
  search: (q: string, type?: string) => {
    const params = new URLSearchParams({ q });
    if (type) params.set('type', type);
    return apiRequest<any>(`/search/index.php?${params.toString()}`);
  },
};

// Clarifications API
export const clarificationsApi = {
  // Get all documents with clarifications for the user
  getDocuments: () => apiRequest<any[]>('/clarifications/index.php'),
  
  // Get clarification messages for a specific document
  getMessages: (documentId: string) => 
    apiRequest<any[]>(`/clarifications/index.php?document_id=${documentId}`),
  
  // Send a clarification message
  sendMessage: (data: { 
    document_id: string; 
    message: string; 
    recipient_role: 'client' | 'firm' | 'accountant';
    is_reply?: boolean;
  }) => apiRequest<any>('/clarifications/index.php', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
