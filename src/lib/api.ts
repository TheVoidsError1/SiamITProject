// Centralized API Service
// This file provides a centralized way to handle all API calls with proper authentication

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function to create authenticated file URL
export const createAuthenticatedFileUrl = (filePath: string): string => {
  const token = getAuthToken();
  if (!token) return filePath;
  
  const url = new URL(filePath, API_BASE_URL);
  url.searchParams.set('token', token);
  return url.toString();
};

// Helper to join base URL and endpoint safely
function joinUrl(base: string, endpoint: string): string {
  if (/^https?:\/\//.test(endpoint)) return endpoint;
  if (base.endsWith('/') && endpoint.startsWith('/')) {
    return base + endpoint.slice(1);
  }
  if (!base.endsWith('/') && !endpoint.startsWith('/')) {
    return base + '/' + endpoint;
  }
  return base + endpoint;
}

// Helper function to create auth headers (handle FormData)
const createAuthHeaders = (customHeaders?: Record<string, string>, data?: any): Record<string, string> => {
  const token = getAuthToken();
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  return {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...customHeaders
  };
};

// Base fetch function with authentication (handle FormData)
const fetchWithAuth = async (
  url: string,
  options: RequestInit = {},
  logoutFn?: () => void,
  sessionExpiredFn?: () => void
): Promise<Response | null> => {
  try {
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers = createAuthHeaders(options.headers as Record<string, string>, options.body);
    const fetchOptions: RequestInit = {
      ...options,
      headers: isFormData ? headers : { ...headers },
    };
    const response = await fetch(url, fetchOptions);
    if (response.status === 401) {
      if (sessionExpiredFn) {
        sessionExpiredFn();
      } else if (logoutFn) {
        logoutFn();
      }
      return null;
    }
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// API Service object with common HTTP methods
export const apiService = {
  // GET request
  get: async (endpoint: string, logoutFn?: () => void, sessionExpiredFn?: () => void) => {
    const url = joinUrl(API_BASE_URL, endpoint);
    const response = await fetchWithAuth(url, {
      method: 'GET'
    }, logoutFn, sessionExpiredFn);
    return response?.json();
  },

  // POST request
  post: async (endpoint: string, data: any, logoutFn?: () => void, sessionExpiredFn?: () => void) => {
    const url = joinUrl(API_BASE_URL, endpoint);
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const response = await fetchWithAuth(url, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
      headers: isFormData ? undefined : undefined // let createAuthHeaders handle
    }, logoutFn, sessionExpiredFn);
    return response?.json();
  },

  // PUT request
  put: async (endpoint: string, data: any, logoutFn?: () => void, sessionExpiredFn?: () => void) => {
    const url = joinUrl(API_BASE_URL, endpoint);
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const response = await fetchWithAuth(url, {
      method: 'PUT',
      body: isFormData ? data : JSON.stringify(data),
      headers: isFormData ? undefined : undefined
    }, logoutFn, sessionExpiredFn);
    return response?.json();
  },

  // DELETE request
  delete: async (endpoint: string, logoutFn?: () => void, sessionExpiredFn?: () => void) => {
    const url = joinUrl(API_BASE_URL, endpoint);
    const response = await fetchWithAuth(url, {
      method: 'DELETE'
    }, logoutFn, sessionExpiredFn);
    return response?.json();
  },

  // PATCH request
  patch: async (endpoint: string, data: any, logoutFn?: () => void, sessionExpiredFn?: () => void) => {
    const url = joinUrl(API_BASE_URL, endpoint);
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const response = await fetchWithAuth(url, {
      method: 'PATCH',
      body: isFormData ? data : JSON.stringify(data),
      headers: isFormData ? undefined : undefined
    }, logoutFn, sessionExpiredFn);
    return response?.json();
  }
};

// Specific API endpoints for better organization
export const apiEndpoints = {
  // Auth endpoints
  auth: {
    login: '/api/login',
    register: '/api/register',
    profile: '/api/profile',
    avatar: '/api/avatar',
    userProfile: '/api/user-profile'
  },

  // Leave management
  leave: {
    requests: '/api/leave-request',
    pending: '/api/leave-request/pending',
    detail: (id: string) => `/api/leave-request/detail/${id}`,
    status: (id: string) => `/api/leave-request/${id}/status`,
    delete: (id: string) => `/api/leave-request/${id}`,
    calendar: (year: number) => `/api/leave-request/calendar/${year}`,
    calendarWithMonth: (year: number, month: number) => `/api/leave-request/calendar/${year}?month=${month}`
  },

  // Employee management
  employees: {
    list: '/api/employees',
    detail: (id: string) => `/api/employee/${id}`,
    leaveHistory: (id: string, query?: string) => `/api/employee/${id}/leave-history${query || ''}`,
    avatar: (id: string) => `/api/employee/${id}/avatar`
  },

  // Departments and positions
  departments: '/api/departments',
  positions: '/api/positions',
  positionsWithQuotas: '/api/positions-with-quotas',
  // Genders
  gender: '/api/genders',

  // Leave types
  leaveTypes: '/api/leave-types',
  leaveType: (id: string) => `/api/leave-types/${id}`,

  // Announcements
  announcements: '/api/announcements',
  announcement: (id: string) => `/api/announcements/${id}`,

  // Company calendar
  customHolidays: '/api/custom-holidays',
  customHoliday: (id: string) => `/api/custom-holidays/${id}`,
  customHolidaysByYear: (year: number) => `/api/custom-holidays/year/${year}`,
  customHolidaysByYearMonth: (year: number, month: number) => `/api/custom-holidays/year/${year}/month/${month}`,

  // Notifications
  notifications: '/api/notifications',
  markAsRead: (id: string) => `/api/notifications/${id}/read`,
  markAllAsRead: '/api/notifications/read',

  // LINE integration
  line: {
    linkStatus: '/api/line/link-status',
    loginUrl: '/api/line/login-url',
    unlink: '/api/line/unlink'
  },

  // Dashboard
  dashboard: {
    stats: '/api/dashboard-stats',
    recentLeaves: '/api/recent-leave-requests',
    myBackdated: '/api/my-backdated'
  },

  // Leave History
  leaveHistory: {
    list: '/api/leave-history',
    filters: '/api/leave-history/filters'
  },

  // Leave Quota
  leaveQuota: {
    me: '/api/leave-quota/me'
  },

  // Admin
  admin: {
    leaveHistory: '/api/leave-request/history',
    leavePending: '/api/leave-request/pending',
    dashboardStats: '/api/leave-request/dashboard-stats'
  },

  // Super Admin
  superAdmin: {
    delete: (id: string) => `/api/superadmin/${id}`,
    admins: (id: string) => `/api/admins/${id}`,
    users: (id: string) => `/api/users/${id}`
  }
};

// Export the fetchWithAuth function for backward compatibility
export { fetchWithAuth }; 