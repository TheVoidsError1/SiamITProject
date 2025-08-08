// API Constants
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/login',
  REGISTER: '/api/register',
  PROFILE: '/api/profile',
  AVATAR: '/api/avatar',
  USER_PROFILE: '/api/user-profile',
  
  // Leave Management
  LEAVE_REQUEST: '/api/leave-request',
  LEAVE_PENDING: '/api/leave-request/pending',
  LEAVE_DETAIL: (id: string) => `/api/leave-request/detail/${id}`,
  LEAVE_STATUS: (id: string) => `/api/leave-request/${id}/status`,
  LEAVE_DELETE: (id: string) => `/api/leave-request/${id}`,
  LEAVE_CALENDAR: (year: number) => `/api/leave-request/calendar/${year}`,
  LEAVE_CALENDAR_MONTH: (year: number, month: number) => `/api/leave-request/calendar/${year}?month=${month}`,
  
  // Employee Management
  EMPLOYEES: '/api/employees',
  EMPLOYEE_DETAIL: (id: string) => `/api/employee/${id}`,
  EMPLOYEE_LEAVE_HISTORY: (id: string, query?: string) => `/api/employee/${id}/leave-history${query || ''}`,
  
  // Departments and Positions
  DEPARTMENTS: '/api/departments',
  POSITIONS: '/api/positions',
  POSITIONS_WITH_QUOTAS: '/api/positions-with-quotas',
  
  // Leave Types
  LEAVE_TYPES: '/api/leave-types',
  LEAVE_TYPE: (id: string) => `/api/leave-types/${id}`,
  
  // Announcements
  ANNOUNCEMENTS: '/api/announcements',
  ANNOUNCEMENT: (id: string) => `/api/announcements/${id}`,
  
  // Company Calendar
  CUSTOM_HOLIDAYS: '/api/custom-holidays',
  CUSTOM_HOLIDAY: (id: string) => `/api/custom-holidays/${id}`,
  CUSTOM_HOLIDAYS_YEAR: (year: number) => `/api/custom-holidays/year/${year}`,
  CUSTOM_HOLIDAYS_YEAR_MONTH: (year: number, month: number) => `/api/custom-holidays/year/${year}/month/${month}`,
  
  // Notifications
  NOTIFICATIONS: '/api/notifications',
  MARK_AS_READ: (id: string) => `/api/notifications/${id}/read`,
  MARK_ALL_AS_READ: '/api/notifications/read',
  
  // LINE Integration
  LINE_LINK_STATUS: '/api/line/link-status',
  LINE_LOGIN_URL: '/api/line/login-url',
  LINE_UNLINK: '/api/line/unlink',
  
  // Dashboard
  DASHBOARD_STATS: '/api/dashboard-stats',
  RECENT_LEAVE_REQUESTS: '/api/recent-leave-requests',
  MY_BACKDATED: '/api/my-backdated'
};
