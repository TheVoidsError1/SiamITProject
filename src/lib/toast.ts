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

// Predefined toast messages for common scenarios
export const toastMessages = {
  // Authentication
  auth: {
    loginSuccess: (name?: string) => ({
      title: 'เข้าสู่ระบบสำเร็จ',
      description: name ? `ยินดีต้อนรับ ${name}` : 'เข้าสู่ระบบสำเร็จแล้ว'
    }),
    loginError: (message?: string) => ({
      title: 'เข้าสู่ระบบไม่สำเร็จ',
      description: message || 'กรุณาตรวจสอบอีเมลและรหัสผ่าน'
    }),
    logoutSuccess: () => ({
      title: 'ออกจากระบบสำเร็จ',
      description: 'ออกจากระบบแล้ว'
    }),
    sessionExpired: () => ({
      title: 'เซสชันหมดอายุ',
      description: 'กรุณาเข้าสู่ระบบใหม่'
    }),
    tokenNotFound: () => ({
      title: 'ไม่พบ token',
      description: 'กรุณาเข้าสู่ระบบใหม่'
    })
  },

  // CRUD operations
  crud: {
    createSuccess: (itemName?: string, t?: any) => ({
      title: t ? t('system.createSuccess', 'สร้างสำเร็จแล้ว') : 'สร้างสำเร็จแล้ว',
      description: t ? t('system.createSuccessDesc', itemName ? `สร้าง ${itemName} สำเร็จแล้ว` : 'สร้างข้อมูลสำเร็จแล้ว') : (itemName ? `สร้าง ${itemName} สำเร็จแล้ว` : 'สร้างข้อมูลสำเร็จแล้ว')
    }),
    createError: (itemName?: string, message?: string, t?: any) => ({
      title: t ? t('system.createError', 'สร้างไม่สำเร็จ') : 'สร้างไม่สำเร็จ',
      description: t ? t('system.createErrorDesc', message || (itemName ? `ไม่สามารถสร้าง ${itemName} ได้` : 'ไม่สามารถสร้างข้อมูลได้')) : (message || (itemName ? `ไม่สามารถสร้าง ${itemName} ได้` : 'ไม่สามารถสร้างข้อมูลได้'))
    }),
    updateSuccess: (itemName?: string, t?: any) => ({
      title: t ? t('system.updateSuccess', 'อัปเดตสำเร็จ') : 'อัปเดตสำเร็จ',
      description: t ? t('system.updateSuccessDesc', itemName ? `อัปเดต ${itemName} สำเร็จแล้ว` : 'อัปเดตข้อมูลสำเร็จแล้ว') : (itemName ? `อัปเดต ${itemName} สำเร็จแล้ว` : 'อัปเดตข้อมูลสำเร็จแล้ว')
    }),
    updateError: (itemName?: string, message?: string, t?: any) => ({
      title: t ? t('system.updateError', 'อัปเดตไม่สำเร็จ') : 'อัปเดตไม่สำเร็จ',
      description: t ? t('system.updateErrorDesc', message || (itemName ? `ไม่สามารถอัปเดต ${itemName} ได้` : 'ไม่สามารถอัปเดตข้อมูลได้')) : (message || (itemName ? `ไม่สามารถอัปเดต ${itemName} ได้` : 'ไม่สามารถอัปเดตข้อมูลได้'))
    }),
    deleteSuccess: (itemName?: string, t?: any) => ({
      title: t ? t('system.deleteSuccess', 'ลบสำเร็จ') : 'ลบสำเร็จ',
      description: t ? t('system.deleteSuccessDesc', itemName ? `ลบ ${itemName} สำเร็จแล้ว` : 'ลบข้อมูลสำเร็จแล้ว') : (itemName ? `ลบ ${itemName} สำเร็จแล้ว` : 'ลบข้อมูลสำเร็จแล้ว')
    }),
    deleteError: (itemName?: string, message?: string, t?: any) => ({
      title: t ? t('system.deleteError', 'ลบไม่สำเร็จ') : 'ลบไม่สำเร็จ',
      description: t ? t('system.deleteFailedDesc', message || (itemName ? `ไม่สามารถลบ ${itemName} ได้` : 'ไม่สามารถลบข้อมูลได้')) : (message || (itemName ? `ไม่สามารถลบ ${itemName} ได้` : 'ไม่สามารถลบข้อมูลได้'))
    }),
    loadSuccess: (itemName?: string) => ({
      title: 'โหลดสำเร็จ',
      description: itemName ? `โหลด ${itemName} สำเร็จแล้ว` : 'โหลดข้อมูลสำเร็จแล้ว'
    }),
    loadError: (itemName?: string, message?: string) => ({
      title: 'โหลดไม่สำเร็จ',
      description: message || (itemName ? `ไม่สามารถโหลด ${itemName} ได้` : 'ไม่สามารถโหลดข้อมูลได้')
    })
  },

  // Leave management
  leave: {
    requestSubmitted: () => ({
      title: 'ส่งคำขอสำเร็จ',
      description: 'ส่งคำขอลาพักผ่อนสำเร็จแล้ว'
    }),
    requestApproved: (employeeName?: string) => ({
      title: 'อนุมัติสำเร็จ',
      description: employeeName ? `อนุมัติคำขอของ ${employeeName} สำเร็จแล้ว` : 'อนุมัติคำขอสำเร็จแล้ว'
    }),
    requestRejected: (employeeName?: string) => ({
      title: 'ปฏิเสธสำเร็จ',
      description: employeeName ? `ปฏิเสธคำขอของ ${employeeName} สำเร็จแล้ว` : 'ปฏิเสธคำขอสำเร็จแล้ว'
    }),
    requestError: (action: string, message?: string) => ({
      title: `${action}ไม่สำเร็จ`,
      description: message || `ไม่สามารถ${action}คำขอได้`
    })
  },

  // File operations
  file: {
    uploadSuccess: (fileName?: string) => ({
      title: 'อัปโหลดสำเร็จ',
      description: fileName ? `อัปโหลด ${fileName} สำเร็จแล้ว` : 'อัปโหลดไฟล์สำเร็จแล้ว'
    }),
    uploadError: (fileName?: string, message?: string) => ({
      title: 'อัปโหลดไม่สำเร็จ',
      description: message || (fileName ? `ไม่สามารถอัปโหลด ${fileName} ได้` : 'ไม่สามารถอัปโหลดไฟล์ได้')
    }),
    downloadSuccess: (fileName?: string) => ({
      title: 'ดาวน์โหลดสำเร็จ',
      description: fileName ? `ดาวน์โหลด ${fileName} สำเร็จแล้ว` : 'ดาวน์โหลดไฟล์สำเร็จแล้ว'
    }),
    downloadError: (fileName?: string, message?: string) => ({
      title: 'ดาวน์โหลดไม่สำเร็จ',
      description: message || (fileName ? `ไม่สามารถดาวน์โหลด ${fileName} ได้` : 'ไม่สามารถดาวน์โหลดไฟล์ได้')
    })
  },

  // Network errors
  network: {
    connectionError: () => ({
      title: 'ข้อผิดพลาดการเชื่อมต่อ',
      description: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
    }),
    timeoutError: () => ({
      title: 'หมดเวลาการเชื่อมต่อ',
      description: 'การเชื่อมต่อใช้เวลานานเกินไป'
    }),
    serverError: () => ({
      title: 'ข้อผิดพลาดเซิร์ฟเวอร์',
      description: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์'
    })
  },

  // Validation
  validation: {
    requiredField: (fieldName?: string) => ({
      title: 'ข้อมูลไม่ครบถ้วน',
      description: fieldName ? `กรุณากรอก ${fieldName}` : 'กรุณากรอกข้อมูลให้ครบถ้วน'
    }),
    invalidFormat: (fieldName?: string) => ({
      title: 'รูปแบบไม่ถูกต้อง',
      description: fieldName ? `รูปแบบของ ${fieldName} ไม่ถูกต้อง` : 'รูปแบบข้อมูลไม่ถูกต้อง'
    }),
    invalidEmail: () => ({
      title: 'อีเมลไม่ถูกต้อง',
      description: 'กรุณากรอกอีเมลให้ถูกต้อง'
    }),
    passwordMismatch: () => ({
      title: 'รหัสผ่านไม่ตรงกัน',
      description: 'รหัสผ่านและรหัสผ่านยืนยันไม่ตรงกัน'
    }),
    passwordTooShort: () => ({
      title: 'รหัสผ่านสั้นเกินไป',
      description: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
    })
  }
};

// Helper function to show toast with predefined messages
export const showToastMessage = {
  // Show authentication related toasts
  auth: {
    loginSuccess: (name?: string) => {
      const { title, description } = toastMessages.auth.loginSuccess(name);
      return showToast.success(title, description);
    },
    loginError: (message?: string) => {
      const { title, description } = toastMessages.auth.loginError(message);
      return showToast.error(title, description);
    },
    logoutSuccess: () => {
      const { title, description } = toastMessages.auth.logoutSuccess();
      return showToast.success(title, description);
    },
    sessionExpired: () => {
      const { title, description } = toastMessages.auth.sessionExpired();
      return showToast.error(title, description);
    },
    tokenNotFound: () => {
      const { title, description } = toastMessages.auth.tokenNotFound();
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
    loadSuccess: (itemName?: string) => {
      const { title, description } = toastMessages.crud.loadSuccess(itemName);
      return showToast.success(title, description);
    },
    loadError: (itemName?: string, message?: string) => {
      const { title, description } = toastMessages.crud.loadError(itemName, message);
      return showToast.error(title, description);
    }
  },

  // Show leave management related toasts
  leave: {
    requestSubmitted: () => {
      const { title, description } = toastMessages.leave.requestSubmitted();
      return showToast.success(title, description);
    },
    requestApproved: (employeeName?: string) => {
      const { title, description } = toastMessages.leave.requestApproved(employeeName);
      return showToast.success(title, description);
    },
    requestRejected: (employeeName?: string) => {
      const { title, description } = toastMessages.leave.requestRejected(employeeName);
      return showToast.error(title, description);
    },
    requestError: (action: string, message?: string) => {
      const { title, description } = toastMessages.leave.requestError(action, message);
      return showToast.error(title, description);
    }
  },

  // Show file operation related toasts
  file: {
    uploadSuccess: (fileName?: string) => {
      const { title, description } = toastMessages.file.uploadSuccess(fileName);
      return showToast.success(title, description);
    },
    uploadError: (fileName?: string, message?: string) => {
      const { title, description } = toastMessages.file.uploadError(fileName, message);
      return showToast.error(title, description);
    },
    downloadSuccess: (fileName?: string) => {
      const { title, description } = toastMessages.file.downloadSuccess(fileName);
      return showToast.success(title, description);
    },
    downloadError: (fileName?: string, message?: string) => {
      const { title, description } = toastMessages.file.downloadError(fileName, message);
      return showToast.error(title, description);
    }
  },

  // Show network error related toasts
  network: {
    connectionError: () => {
      const { title, description } = toastMessages.network.connectionError();
      return showToast.error(title, description);
    },
    timeoutError: () => {
      const { title, description } = toastMessages.network.timeoutError();
      return showToast.error(title, description);
    },
    serverError: () => {
      const { title, description } = toastMessages.network.serverError();
      return showToast.error(title, description);
    }
  },

  // Show validation related toasts
  validation: {
    requiredField: (fieldName?: string) => {
      const { title, description } = toastMessages.validation.requiredField(fieldName);
      return showToast.error(title, description);
    },
    invalidFormat: (fieldName?: string) => {
      const { title, description } = toastMessages.validation.invalidFormat(fieldName);
      return showToast.error(title, description);
    },
    invalidEmail: () => {
      const { title, description } = toastMessages.validation.invalidEmail();
      return showToast.error(title, description);
    },
    passwordMismatch: () => {
      const { title, description } = toastMessages.validation.passwordMismatch();
      return showToast.error(title, description);
    },
    passwordTooShort: () => {
      const { title, description } = toastMessages.validation.passwordTooShort();
      return showToast.error(title, description);
    }
  }
};

// Export the original toast function for backward compatibility
export { toast };

