// Centralized Toast Service
// This file provides a centralized way to handle all toast notifications

import { toast } from '@/hooks/use-toast';

// Toast variants (only allowed: 'default' | 'destructive')
export type ToastVariant = 'default' | 'destructive';

// Toast options interface
export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

// Centralized toast service
export const showToast = {
  // Success toast (use 'default')
  success: (title: string, description?: string, duration?: number) => {
    return toast({
      title,
      description,
      variant: 'default',
      duration: duration || 3000
    });
  },
  // Error toast (use 'destructive')
  error: (title: string, description?: string, duration?: number) => {
    return toast({
      title,
      description,
      variant: 'destructive',
      duration: duration || 5000
    });
  },
  // Warning toast (map to 'destructive')
  warning: (title: string, description?: string, duration?: number) => {
    return toast({
      title,
      description,
      variant: 'destructive',
      duration: duration || 4000
    });
  },
  // Info toast (map to 'default')
  info: (title: string, description?: string, duration?: number) => {
    return toast({
      title,
      description,
      variant: 'default',
      duration: duration || 3000
    });
  },
  // Custom toast (only allow allowed variants)
  custom: (options: ToastOptions) => {
    const { title, description, variant = 'default', duration } = options;
    return toast({
      title,
      description,
      variant,
      duration
    });
  }
};

// Predefined toast messages for common scenarios with i18n support
// Helper: map canonical item keys to localized labels
const resolveItemName = (itemName?: string, t?: any): string | undefined => {
  if (!itemName) return undefined;
  if (!t) return itemName;
  switch (itemName) {
    case 'position':
      return t('positions.position');
    case 'department':
      return t('departments.departments');
    case 'leaveType':
      return t('leave.leaveType');
    case 'announcement':
      return t('companyNews.news');
    case 'user':
      return t('common.user');
    default:
      return itemName; // already localized or custom
  }
};
export const toastMessages = {
  // Authentication
  auth: {
    loginSuccess: (name?: string, t?: any) => ({
      title: t ? t('auth.loginSuccess') : 'เข้าสู่ระบบสำเร็จ',
      description: name ? (t ? t('auth.welcomeToSystem', { name }) : `ยินดีต้อนรับ ${name}`) : (t ? t('auth.welcomeToSystem') : 'เข้าสู่ระบบสำเร็จแล้ว')
    }),
    loginError: (message?: string, t?: any) => ({
      title: t ? t('auth.loginError') : 'เข้าสู่ระบบไม่สำเร็จ',
      description: message || (t ? t('auth.enterEmailPassword') : 'กรุณาตรวจสอบอีเมลและรหัสผ่าน')
    }),
    logoutSuccess: (t?: any) => ({
      title: t ? t('auth.logoutSuccess') : 'ออกจากระบบสำเร็จ',
      description: t ? t('auth.logoutSuccess') : 'ออกจากระบบแล้ว'
    }),
    sessionExpired: (t?: any) => ({
      title: t ? t('auth.sessionExpired') : 'เซสชันหมดอายุ',
      description: t ? t('auth.sessionExpiredDesc') : 'กรุณาเข้าสู่ระบบใหม่'
    }),
    tokenNotFound: (t?: any) => ({
      title: t ? t('auth.tokenNotFound') : 'ไม่พบ token',
      description: t ? t('auth.pleaseLoginAgain') : 'กรุณาเข้าสู่ระบบใหม่'
    })
  },

  // CRUD operations
  crud: {
    createSuccess: (itemName?: string, t?: any) => {
      const item = resolveItemName(itemName, t) || (t ? t('common.user') : 'ผู้ใช้');
      return {
        title: t ? t('system.createSuccess') : 'สร้างสำเร็จแล้ว',
        description: t ? t('system.createSuccessDesc', { itemName: item }) : `สร้าง ${item} สำเร็จแล้ว`
      };
    },
    createError: (itemName?: string, message?: string, t?: any) => {
      const item = resolveItemName(itemName, t) || (t ? t('common.user') : 'ผู้ใช้');
      return {
        title: t ? t('system.createError') : 'สร้างไม่สำเร็จ',
        description: message || (t ? t('system.createErrorDesc', { itemName: item, message: '' }) : `ไม่สามารถสร้าง ${item} ได้`)
      };
    },
    updateSuccess: (itemName?: string, t?: any) => {
      const item = resolveItemName(itemName, t) || (t ? t('common.user') : 'ผู้ใช้');
      return {
        title: t ? t('system.updateSuccess') : 'อัปเดตสำเร็จ',
        description: t ? t('system.updateSuccessDesc', { itemName: item }) : `อัปเดต ${item} สำเร็จแล้ว`
      };
    },
    updateError: (itemName?: string, message?: string, t?: any) => {
      const item = resolveItemName(itemName, t) || (t ? t('common.user') : 'ผู้ใช้');
      return {
        title: t ? t('system.updateError') : 'อัปเดตไม่สำเร็จ',
        description: message || (t ? t('system.updateErrorDesc', { itemName: item, message: '' }) : `ไม่สามารถอัปเดต ${item} ได้`)
      };
    },
    deleteSuccess: (itemName?: string, t?: any) => {
      const item = resolveItemName(itemName, t) || (t ? t('common.user') : 'ผู้ใช้');
      return {
        title: t ? t('system.deleteSuccess') : 'ลบสำเร็จ',
        description: t ? `${t('common.delete')} ${item} ${t('common.success')}` : `ลบ ${item} สำเร็จ`
      };
    },
    deleteError: (itemName?: string, message?: string, t?: any) => {
      const item = resolveItemName(itemName, t) || (t ? t('common.user') : 'ผู้ใช้');
      return {
        title: t ? t('system.deleteError') : 'ลบไม่สำเร็จ',
        description: message || (t ? `${t('common.delete')} ${item} ${t('common.error')}` : `ไม่สามารถลบ ${item} ได้`)
      };
    },
    loadSuccess: (itemName?: string, t?: any) => {
      const item = itemName ? resolveItemName(itemName, t) : undefined;
      return {
        title: t ? t('system.loadSuccess') : 'โหลดสำเร็จ',
        description: item ? (t ? t('system.loadSuccessDesc', { itemName: item }) : `โหลด ${item} สำเร็จแล้ว`) : (t ? t('system.loadSuccessDesc') : 'โหลดข้อมูลสำเร็จแล้ว')
      };
    },
    loadError: (itemName?: string, message?: string, t?: any) => {
      const item = itemName ? resolveItemName(itemName, t) : undefined;
      return {
        title: t ? t('system.loadError') : 'โหลดไม่สำเร็จ',
        description: message || (item ? (t ? t('system.loadErrorDesc', { itemName: item }) : `ไม่สามารถโหลด ${item} ได้`) : (t ? t('system.loadErrorDesc') : 'ไม่สามารถโหลดข้อมูลได้'))
      };
    }
  },

  // Leave management
  leave: {
    requestSubmitted: (t?: any) => ({
      title: t ? t('leave.submitSuccess') : 'ส่งคำขอสำเร็จ',
      description: t ? t('leave.submitSuccessDesc') : 'ส่งคำขอลาพักผ่อนสำเร็จแล้ว'
    }),
    requestApproved: (employeeName?: string, t?: any) => ({
      title: t ? t('admin.approveSuccess') : 'อนุมัติสำเร็จ',
      description: employeeName ? (t ? t('admin.approveSuccessDesc', { name: employeeName }) : `อนุมัติคำขอของ ${employeeName} สำเร็จแล้ว`) : (t ? t('admin.approveSuccessDesc') : 'อนุมัติคำขอสำเร็จแล้ว')
    }),
    requestRejected: (employeeName?: string, t?: any) => ({
      title: t ? t('admin.rejectSuccess') : 'ปฏิเสธสำเร็จ',
      description: employeeName ? (t ? t('admin.rejectSuccessDesc', { name: employeeName }) : `ปฏิเสธคำขอของ ${employeeName} สำเร็จแล้ว`) : (t ? t('admin.rejectSuccessDesc') : 'ปฏิเสธคำขอสำเร็จแล้ว')
    }),
    requestError: (action: string, message?: string, t?: any) => ({
      title: t ? t('leave.submitError') : `${action}ไม่สำเร็จ`,
      description: message || (t ? t('leave.submitErrorDesc') : `ไม่สามารถ${action}คำขอได้`)
    })
  },

  // File operations
  file: {
    uploadSuccess: (fileName?: string, t?: any) => ({
      title: t ? t('profile.uploadSuccess') : 'อัปโหลดสำเร็จ',
      description: fileName ? (t ? t('profile.uploadSuccessDesc', { fileName }) : `อัปโหลด ${fileName} สำเร็จแล้ว`) : (t ? t('profile.uploadSuccessDesc') : 'อัปโหลดไฟล์สำเร็จแล้ว')
    }),
    uploadError: (fileName?: string, message?: string, t?: any) => ({
      title: t ? t('profile.uploadError') : 'อัปโหลดไม่สำเร็จ',
      description: message || (fileName ? (t ? t('profile.uploadErrorDesc', { fileName }) : `ไม่สามารถอัปโหลด ${fileName} ได้`) : (t ? t('profile.uploadErrorDesc') : 'ไม่สามารถอัปโหลดไฟล์ได้'))
    }),
    downloadSuccess: (fileName?: string, t?: any) => ({
      title: t ? t('file.downloadSuccess') : 'ดาวน์โหลดสำเร็จ',
      description: fileName ? (t ? t('file.downloadSuccessDesc', { fileName }) : `ดาวน์โหลด ${fileName} สำเร็จแล้ว`) : (t ? t('file.downloadSuccessDesc') : 'ดาวน์โหลดไฟล์สำเร็จแล้ว')
    }),
    downloadError: (fileName?: string, message?: string, t?: any) => ({
      title: t ? t('file.downloadError') : 'ดาวน์โหลดไม่สำเร็จ',
      description: message || (fileName ? (t ? t('file.downloadErrorDesc', { fileName }) : `ไม่สามารถดาวน์โหลด ${fileName} ได้`) : (t ? t('file.downloadErrorDesc') : 'ไม่สามารถดาวน์โหลดไฟล์ได้'))
    })
  },

  // Network errors
  network: {
    connectionError: (t?: any) => ({
      title: t ? t('admin.connectionError') : 'ข้อผิดพลาดการเชื่อมต่อ',
      description: t ? t('admin.serverConnectionError') : 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
    }),
    timeoutError: (t?: any) => ({
      title: t ? t('network.timeoutError') : 'หมดเวลาการเชื่อมต่อ',
      description: t ? t('network.timeoutErrorDesc') : 'การเชื่อมต่อใช้เวลานานเกินไป'
    }),
    serverError: (t?: any) => ({
      title: t ? t('network.serverError') : 'ข้อผิดพลาดเซิร์ฟเวอร์',
      description: t ? t('network.serverErrorDesc') : 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์'
    })
  },

  // Validation
  validation: {
    requiredField: (fieldName?: string, t?: any) => ({
      title: t ? t('validation.requiredField') : 'ข้อมูลไม่ครบถ้วน',
      description: fieldName ? (t ? t('validation.requiredFieldDesc', { fieldName }) : `กรุณากรอก ${fieldName}`) : (t ? t('validation.requiredFieldDesc') : 'กรุณากรอกข้อมูลให้ครบถ้วน')
    }),
    invalidFormat: (fieldName?: string, t?: any) => ({
      title: t ? t('validation.invalidFormat') : 'รูปแบบไม่ถูกต้อง',
      description: fieldName ? (t ? t('validation.invalidFormatDesc', { fieldName }) : `รูปแบบของ ${fieldName} ไม่ถูกต้อง`) : (t ? t('validation.invalidFormatDesc') : 'รูปแบบข้อมูลไม่ถูกต้อง')
    }),
    invalidEmail: (t?: any) => ({
      title: t ? t('validation.invalidEmail') : 'อีเมลไม่ถูกต้อง',
      description: t ? t('validation.invalidEmailDesc') : 'กรุณากรอกอีเมลให้ถูกต้อง'
    }),
    passwordMismatch: (t?: any) => ({
      title: t ? t('auth.passwordMismatch') : 'รหัสผ่านไม่ตรงกัน',
      description: t ? t('auth.passwordMismatch') : 'รหัสผ่านและรหัสผ่านยืนยันไม่ตรงกัน'
    }),
    passwordTooShort: (t?: any) => ({
      title: t ? t('auth.passwordTooShort') : 'รหัสผ่านสั้นเกินไป',
      description: t ? t('auth.passwordTooShort') : 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
    })
  }
};

// Helper function to show toast with predefined messages
export const showToastMessage = {
  // Show authentication related toasts
  auth: {
    loginSuccess: (name?: string, t?: any) => {
      const { title, description } = toastMessages.auth.loginSuccess(name, t);
      return showToast.success(title, description);
    },
    loginError: (message?: string, t?: any) => {
      const { title, description } = toastMessages.auth.loginError(message, t);
      return showToast.error(title, description);
    },
    logoutSuccess: (t?: any) => {
      const { title, description } = toastMessages.auth.logoutSuccess(t);
      return showToast.success(title, description);
    },
    sessionExpired: (t?: any) => {
      const { title, description } = toastMessages.auth.sessionExpired(t);
      return showToast.error(title, description);
    },
    tokenNotFound: (t?: any) => {
      const { title, description } = toastMessages.auth.tokenNotFound(t);
      return showToast.error(title, description);
    }
  },

  // Show CRUD related toasts
  crud: {
    createSuccess: (itemName?: string, t?: any) => {
      const { title, description } = toastMessages.crud.createSuccess(itemName, t);
      return showToast.success(title, description);
    },
    createError: (itemName?: string, message?: string, t?: any) => {
      const { title, description } = toastMessages.crud.createError(itemName, message, t);
      return showToast.error(title, description);
    },
    updateSuccess: (itemName?: string, t?: any) => {
      const { title, description } = toastMessages.crud.updateSuccess(itemName, t);
      return showToast.success(title, description);
    },
    updateError: (itemName?: string, message?: string, t?: any) => {
      const { title, description } = toastMessages.crud.updateError(itemName, message, t);
      return showToast.error(title, description);
    },
    deleteSuccess: (itemName?: string, t?: any) => {
      const { title, description } = toastMessages.crud.deleteSuccess(itemName, t);
      return showToast.success(title, description);
    },
    deleteError: (itemName?: string, message?: string, t?: any) => {
      const { title, description } = toastMessages.crud.deleteError(itemName, message, t);
      return showToast.error(title, description);
    },
    loadSuccess: (itemName?: string, t?: any) => {
      const { title, description } = toastMessages.crud.loadSuccess(itemName, t);
      return showToast.success(title, description);
    },
    loadError: (itemName?: string, message?: string, t?: any) => {
      const { title, description } = toastMessages.crud.loadError(itemName, message, t);
      return showToast.error(title, description);
    }
  },

  // Show leave management related toasts
  leave: {
    requestSubmitted: (t?: any) => {
      const { title, description } = toastMessages.leave.requestSubmitted(t);
      return showToast.success(title, description);
    },
    requestApproved: (employeeName?: string, t?: any) => {
      const { title, description } = toastMessages.leave.requestApproved(employeeName, t);
      return showToast.success(title, description);
    },
    requestRejected: (employeeName?: string, t?: any) => {
      const { title, description } = toastMessages.leave.requestRejected(employeeName, t);
      return showToast.error(title, description);
    },
    requestError: (action: string, message?: string, t?: any) => {
      const { title, description } = toastMessages.leave.requestError(action, message, t);
      return showToast.error(title, description);
    }
  },

  // Show file operation related toasts
  file: {
    uploadSuccess: (fileName?: string, t?: any) => {
      const { title, description } = toastMessages.file.uploadSuccess(fileName, t);
      return showToast.success(title, description);
    },
    uploadError: (fileName?: string, message?: string, t?: any) => {
      const { title, description } = toastMessages.file.uploadError(fileName, message, t);
      return showToast.error(title, description);
    },
    downloadSuccess: (fileName?: string, t?: any) => {
      const { title, description } = toastMessages.file.downloadSuccess(fileName, t);
      return showToast.success(title, description);
    },
    downloadError: (fileName?: string, message?: string, t?: any) => {
      const { title, description } = toastMessages.file.downloadError(fileName, message, t);
      return showToast.error(title, description);
    }
  },

  // Show network error related toasts
  network: {
    connectionError: (t?: any) => {
      const { title, description } = toastMessages.network.connectionError(t);
      return showToast.error(title, description);
    },
    timeoutError: (t?: any) => {
      const { title, description } = toastMessages.network.timeoutError(t);
      return showToast.error(title, description);
    },
    serverError: (t?: any) => {
      const { title, description } = toastMessages.network.serverError(t);
      return showToast.error(title, description);
    }
  },

  // Show validation related toasts
  validation: {
    requiredField: (fieldName?: string, t?: any) => {
      const { title, description } = toastMessages.validation.requiredField(fieldName, t);
      return showToast.error(title, description);
    },
    invalidFormat: (fieldName?: string, t?: any) => {
      const { title, description } = toastMessages.validation.invalidFormat(fieldName, t);
      return showToast.error(title, description);
    },
    invalidEmail: (t?: any) => {
      const { title, description } = toastMessages.validation.invalidEmail(t);
      return showToast.error(title, description);
    },
    passwordMismatch: (t?: any) => {
      const { title, description } = toastMessages.validation.passwordMismatch(t);
      return showToast.error(title, description);
    },
    passwordTooShort: (t?: any) => {
      const { title, description } = toastMessages.validation.passwordTooShort(t);
      return showToast.error(title, description);
    }
  }
};

// Export the original toast function for backward compatibility
export { toast };

