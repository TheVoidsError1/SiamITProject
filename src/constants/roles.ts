// Role constants used throughout the application

export const ROLES = {
  EMPLOYEE: 'employee',
  ADMIN: 'admin',
  SUPER_ADMIN: 'superadmin'
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

// Role display names for different languages
export const ROLE_DISPLAY_NAMES = {
  [ROLES.EMPLOYEE]: {
    th: 'พนักงาน',
    en: 'Employee'
  },
  [ROLES.ADMIN]: {
    th: 'ผู้ดูแลระบบ',
    en: 'Administrator'
  },
  [ROLES.SUPER_ADMIN]: {
    th: 'ผู้ดูแลระบบสูงสุด',
    en: 'Super Administrator'
  }
} as const;

// Role hierarchy for permissions
export const ROLE_HIERARCHY = {
  [ROLES.EMPLOYEE]: 1,
  [ROLES.ADMIN]: 2,
  [ROLES.SUPER_ADMIN]: 3
} as const;

// Check if a role has permission over another
export const hasRolePermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};
