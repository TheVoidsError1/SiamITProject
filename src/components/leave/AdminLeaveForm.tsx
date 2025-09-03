import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ArrowLeftCircle, CalendarDays, ClipboardList, Clock, FileText, Phone, Send, User, CheckCircle, XCircle, Shield, UserCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from 'react-router-dom';
import { DateRangePicker } from "./DateRangePicker";
import { FileUpload } from "./FileUpload";
import { apiService } from '@/lib/api';
import { apiEndpoints } from '@/constants/api';

// ฟังก์ชัน validate เวลา HH:mm (24 ชั่วโมง)
function isValidTimeFormat(timeStr: string): boolean {
  return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr);
}

// ฟังก์ชันเติม : อัตโนมัติเมื่อป้อนเวลา เช่น 900 -> 09:00, 1730 -> 17:30
function autoFormatTimeInput(value: string) {
  let digits = value.replace(/[^0-9]/g, "");
  if (digits.length > 4) digits = digits.slice(0, 4);
  if (digits.length >= 3) {
    return digits.slice(0, digits.length - 2) + ":" + digits.slice(-2);
  }
  return digits;
}

// ฟังก์ชันแปลงวันที่เป็น yyyy-mm-dd ตาม local time (ไม่ใช่ UTC)
function formatDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const isValidPhoneNumber = (input: string) => {
  // เฉพาะตัวเลข, 9-10 หลัก, ขึ้นต้น 0, ไม่ใช่เลขซ้ำหมด เช่น 0000000000
  if (!/^[0-9]{9,10}$/.test(input)) return false;
  if (!input.startsWith('0')) return false;
  if (/^(\d)\1{8,9}$/.test(input)) return false; // เช่น 0000000000, 1111111111
  // อาจเพิ่ม blacklist เพิ่มเติมได้
  return true;
};

const isValidEmail = (input: string) => {
  // เช็ค email format พื้นฐาน
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
};

export interface AdminLeaveFormProps {
  initialData?: any;
  onSubmit?: (data: any) => void;
  mode?: 'create' | 'edit';
}

export const AdminLeaveForm = ({ initialData, onSubmit, mode = 'create' }: AdminLeaveFormProps) => {
  const { t, i18n } = useTranslation();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [leaveDate, setLeaveDate] = useState<string>("");
  const [leaveType, setLeaveType] = useState("");
  const [durationType, setDurationType] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [reason, setReason] = useState("");
  const [employeeType, setEmployeeType] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [contact, setContact] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [approvalStatus, setApprovalStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [approverId, setApproverId] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [departments, setDepartments] = useState<{ id: number; department_name_th: string; department_name_en: string }[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<{ id: string; leave_type_th: string; leave_type_en: string; require_attachment?: boolean }[]>([]);
  const [positions, setPositions] = useState<{ id: string; position_name_th: string; position_name_en: string }[]>([]);
  const [admins, setAdmins] = useState<{ id: string; name: string; role: string }[]>([]);
  const [superadmins, setSuperadmins] = useState<{ id: string; name: string; role: string }[]>([]);
  const approverList = [...admins, ...superadmins];
  const [users, setUsers] = useState<{ id: string; name: string; email: string; role: string; department_name_th?: string; position_name_th?: string }[]>([]);
  const { user } = useAuth();
  const [timeError, setTimeError] = useState("");
  const [errors, setErrors] = useState({
    selectedUserId: '',
    leaveType: '',
    durationType: '',
    startDate: '',
    endDate: '',
    leaveDate: '',
    startTime: '',
    endTime: '',
    reason: '',
    contact: '',
    approvalStatus: '',
    approverName: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dynamic attachment requirement based on selected leave type
  const selectedLeaveType = leaveTypes.find(type => type.id === leaveType);

  // Fetch users for selection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiService.get(apiEndpoints.employees.list);
        if (data.success && Array.isArray(data.data)) {
          const usersList = data.data.map((item: any) => ({
            id: item.id,
            name: item.name || item.email || 'Unknown',
            email: item.email || '',
            role: item.role || 'employee',
            department_name_th: item.department_name_th || '',
            position_name_th: item.position_name_th || '',
          }));
          setUsers(usersList);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: t('common.error'),
          description: t('leave.errorFetchingUsers'),
          variant: "destructive",
        });
      }
    };

    fetchUsers();
  }, [t, toast]);

  // Fetch leave types
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const data = await apiService.get('/api/leave-types');
        if (data.success && Array.isArray(data.data)) {
          setLeaveTypes(data.data);
        }
      } catch (error) {
        console.error('Error fetching leave types:', error);
      }
    };

    fetchLeaveTypes();
  }, []);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await apiService.get('/api/departments');
        if (data.success && Array.isArray(data.data)) {
          setDepartments(data.data);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };

    fetchDepartments();
  }, []);

  // Fetch positions
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const data = await apiService.get('/api/positions');
        if (data.success && Array.isArray(data.data)) {
          setPositions(data.data);
        }
      } catch (error) {
        console.error('Error fetching positions:', error);
      }
    };

    fetchPositions();
  }, []);

  // Fetch admins and superadmins
  useEffect(() => {
    const fetchApprovers = async () => {
      try {
        // Fetch admins
        const adminRes = await apiService.get('/api/admins');
        let adminList: { id: string; name: string; role: string }[] = [];
        if (adminRes.success && Array.isArray(adminRes.data)) {
          adminList = adminRes.data.map((a: any) => ({
            id: a.id,
            name: a.admin_name || a.name || a.email || 'Admin',
            role: 'admin',
          }));
        }
        setAdmins(adminList);
        // Fetch superadmins
        const superRes = await apiService.get('/api/superadmin');
        let superList: { id: string; name: string; role: string }[] = [];
        if (superRes.success && Array.isArray(superRes.data)) {
          superList = superRes.data.map((s: any) => ({
            id: s.id,
            name: s.superadmin_name || s.name || s.email || 'Superadmin',
            role: 'superadmin',
          }));
        }
        setSuperadmins(superList);
      } catch (err) {
        // ignore error
      }
    };
    fetchApprovers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeError("");

    // Validation
    const newErrors = {
      selectedUserId: '',
      leaveType: '',
      durationType: '',
      startDate: '',
      endDate: '',
      leaveDate: '',
      startTime: '',
      endTime: '',
      reason: '',
      contact: '',
      approvalStatus: '',
      approverName: '',
    };

    if (!selectedUserId) {
      newErrors.selectedUserId = t('leave.selectEmployeeRequired');
    }

    if (!leaveType) {
      newErrors.leaveType = t('leave.selectLeaveTypeRequired');
    }

    if (!durationType) {
      newErrors.durationType = t('leave.selectDurationTypeRequired');
    }

    if (!startDate) {
      newErrors.startDate = t('leave.selectStartDateRequired');
    }

    if (durationType === 'day' && !endDate) {
      newErrors.endDate = t('leave.selectEndDateRequired');
    }

    if (durationType === 'hour') {
      if (!leaveDate) {
        newErrors.leaveDate = t('leave.selectLeaveDateRequired');
      }
      if (!startTime) {
        newErrors.startTime = t('leave.selectStartTimeRequired');
      }
      if (!endTime) {
        newErrors.endTime = t('leave.selectEndTimeRequired');
      }
    }

    if (approvalStatus === 'rejected' && !reason.trim()) {
      newErrors.reason = t('leave.enterReasonRequired');
    }

    if (!contact.trim()) {
      newErrors.contact = t('leave.enterContactRequired');
    }

    // Only require approver when status is approved or rejected
    if ((approvalStatus === 'approved' || approvalStatus === 'rejected') && !approverId) {
      newErrors.approverName = t('leave.enterApproverNameRequired');
    }

    setErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some(error => error !== '')) {
      toast({
        title: t('common.error'),
        description: t('leave.fillAllFields'),
        variant: "destructive",
      });
      return;
    }

    // Time validation for hourly leave
    if (durationType === 'hour' && startTime && endTime) {
      if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
        setTimeError(t('leave.invalidTimeFormat'));
        return;
      }

      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      if (start >= end) {
        setTimeError(t('leave.endTimeMustBeAfterStartTime'));
        return;
      }

      // Check if time is within business hours (9:00-18:00)
      const startHour = start.getHours();
      const endHour = end.getHours();
      const startMinute = start.getMinutes();
      const endMinute = end.getMinutes();
      
      const startTimeMinutes = startHour * 60 + startMinute;
      const endTimeMinutes = endHour * 60 + endMinute;
      
      const businessStartMinutes = 9 * 60; // 9:00
      const businessEndMinutes = 18 * 60; // 18:00
      
      if (startTimeMinutes < businessStartMinutes || endTimeMinutes > businessEndMinutes) {
        setTimeError('เวลาเริ่มและเวลาสิ้นสุดต้องอยู่ในช่วง 9:00 - 18:00 เท่านั้น');
        return;
      }
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("leaveType", leaveType);
      if (durationType) formData.append("durationType", durationType);
      
      // Handle date fields based on duration type
      if (durationType === 'day') {
        if (startDate) formData.append("startDate", startDate);
        if (endDate) formData.append("endDate", endDate);
      } else if (durationType === 'hour') {
        // For hourly leave, use leaveDate as startDate and endDate
        if (leaveDate) {
          formData.append("startDate", leaveDate);
          formData.append("endDate", leaveDate);
        }
      }
      
      if (startTime) formData.append("startTime", startTime);
      if (endTime) formData.append("endTime", endTime);
      formData.append("reason", reason);
      formData.append("contact", contact);
      
      // Handle approval fields
      formData.append("approvalStatus", approvalStatus);
      
      // Only send approver info when status is approved or rejected
      if (approvalStatus === 'approved' || approvalStatus === 'rejected') {
        const selectedApprover = approverList.find(a => a.id === approverId);
        formData.append('approverId', approverId);
        formData.append('approverName', selectedApprover?.name || '');
        if (approvalNote) formData.append("approvalNote", approvalNote);
      }
      
      // Add selected user ID instead of current user
      formData.append("repid", selectedUserId);

      attachments.forEach(file => {
        formData.append('attachments', file);
      });



      let data;

      if (mode === 'edit' && initialData?.id) {
        data = await apiService.put(`/api/leave-request/${initialData.id}`, formData);
      } else {
        data = await apiService.post('/api/leave-request/admin', formData);
      }

      if (data && (data.success || data.token)) {
        toast({
          title: t('leave.submitSuccess'),
          description: t('leave.leaveRequestSuccess'),
        });
        
        if (onSubmit) {
          onSubmit(data);
        } else {
          navigate('/admin');
        }
      } else {
        toast({
          title: t('leave.submitError'),
          description: data?.message || t('leave.submitError'),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error submitting leave request:', error);
      toast({
        title: t('leave.submitError'),
        description: error.message || t('leave.submitError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTimeInputChange = (value: string, setter: (value: string) => void) => {
    const formatted = autoFormatTimeInput(value);
    setter(formatted);
  };

  // Reset time to default values when duration type changes
  const handleDurationTypeChange = (value: string) => {
    setDurationType(value);
    if (value === 'hour') {
      setStartTime("09:00");
      setEndTime("18:00");
    }
    setTimeError(""); // Clear any previous time errors
  };

  return (
    <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 rounded-2xl p-8 shadow-xl border border-blue-100/50">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{t('leave.adminLeaveRequest')}</h2>
            <p className="text-gray-600">{t('leave.adminLeaveRequestDesc')}</p>
          </div>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
        {/* Employee Selection */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">{t('leave.selectEmployee')}</h3>
          </div>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className={`w-full h-12 ${errors.selectedUserId ? 'border-red-500 ring-red-200' : 'border-gray-200 hover:border-blue-300'}`}>
              <SelectValue placeholder={t('leave.selectEmployeePlaceholder')}>
                {selectedUserId && (() => {
                  const selectedUser = users.find(u => u.id === selectedUserId);
                  return selectedUser ? `${selectedUser.name} • ${selectedUser.email} • ${selectedUser.role} • ${selectedUser.department_name_th} • ${selectedUser.position_name_th}` : '';
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex flex-col py-1">
                    <span className="font-medium text-gray-900">{user.name}</span>
                    <span className="text-sm text-gray-500">
                      {user.email} • {user.role} • {user.department_name_th} • {user.position_name_th}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.selectedUserId && (
            <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
              <XCircle className="w-4 h-4" />
              {errors.selectedUserId}
            </p>
          )}
        </div>

        {/* Leave Details Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <ClipboardList className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">{t('leave.leaveDetails')}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Leave Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                {t('leave.leaveType')}
              </label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className={`w-full h-12 ${errors.leaveType ? 'border-red-500 ring-red-200' : 'border-gray-200 hover:border-blue-300'}`}>
                  <SelectValue placeholder={t('leave.selectLeaveType')}>
                    {leaveType && (() => {
                      const selectedType = leaveTypes.find(type => type.id === leaveType);
                      return selectedType ? (i18n.language === 'th' ? selectedType.leave_type_th : selectedType.leave_type_en) : '';
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{i18n.language === 'th' ? type.leave_type_th : type.leave_type_en}</span>
                        {type.require_attachment && (
                          <span className="text-xs text-blue-600 ml-2">({t('leave.requiresAttachment')})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.leaveType && (
                <p className="text-sm text-red-500">{errors.leaveType}</p>
              )}
            </div>

            {/* Duration Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t('leave.durationType')}
              </label>
              <Select value={durationType} onValueChange={handleDurationTypeChange}>
                <SelectTrigger className={`w-full h-12 ${errors.durationType ? 'border-red-500 ring-red-200' : 'border-gray-200 hover:border-blue-300'}`}>
                  <SelectValue placeholder={t('leave.selectDurationType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">{t('leave.fullDay')}</SelectItem>
                  <SelectItem value="hour">{t('leave.hourly')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.durationType && (
                <p className="text-sm text-red-500">{errors.durationType}</p>
              )}
            </div>
          </div>
        </div>

        {/* Date Selection */}
        {durationType && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarDays className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">{t('leave.dateTimeSelection')}</h3>
            </div>

            {durationType === 'day' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    {t('leave.startDate')}
                  </label>
                  <DatePicker
                    date={startDate}
                    onDateChange={setStartDate}
                    placeholder={t('leave.selectStartDate')}
                    className={errors.startDate ? 'border-red-500' : ''}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-red-500">{errors.startDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    {t('leave.endDate')}
                  </label>
                  <DatePicker
                    date={endDate}
                    onDateChange={setEndDate}
                    placeholder={t('leave.selectEndDate')}
                    className={errors.endDate ? 'border-red-500' : ''}
                  />
                  {errors.endDate && (
                    <p className="text-sm text-red-500">{errors.endDate}</p>
                  )}
                </div>
              </div>
            ) : durationType === 'hour' ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    {t('leave.leaveDate')}
                  </label>
                  <DatePicker
                    date={leaveDate}
                    onDateChange={setLeaveDate}
                    placeholder={t('leave.selectLeaveDate')}
                    className={errors.leaveDate ? 'border-red-500' : ''}
                  />
                  {errors.leaveDate && (
                    <p className="text-sm text-red-500">{errors.leaveDate}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {t('leave.startTime')}
                    </label>
                    <Input
                      type="time"
                      placeholder="09:00"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className={`h-12 ${errors.startTime ? 'border-red-500 ring-red-200' : 'border-gray-200 hover:border-blue-300'}`}
                    />
                    {errors.startTime && (
                      <p className="text-sm text-red-500">{errors.startTime}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {t('leave.endTime')}
                    </label>
                    <Input
                      type="time"
                      placeholder="17:00"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className={`h-12 ${errors.endTime ? 'border-red-500 ring-red-200' : 'border-gray-200 hover:border-blue-300'}`}
                    />
                    {errors.endTime && (
                      <p className="text-sm text-red-500">{errors.endTime}</p>
                    )}
                  </div>
                </div>

                {/* Business hours notice */}
                <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">เวลาทำการ</span>
                  </div>
                  <p>เวลาเริ่มและเวลาสิ้นสุดต้องอยู่ในช่วง 9:00 - 18:00 เท่านั้น</p>
                </div>

                {timeError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    {timeError}
                  </p>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Approval Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">{t('leave.approvalSection')}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Approval Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {t('leave.approvalStatus')}
              </label>
              <Select value={approvalStatus} onValueChange={(value: "pending" | "approved" | "rejected") => setApprovalStatus(value)}>
                <SelectTrigger className="w-full h-12 border-gray-200 hover:border-blue-300">
                  <SelectValue>
                    {approvalStatus && (() => {
                      switch (approvalStatus) {
                        case 'pending':
                          return (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              {t('leave.pending')}
                            </div>
                          );
                        case 'approved':
                          return (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              {t('leave.approved')}
                            </div>
                          );
                        case 'rejected':
                          return (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              {t('leave.rejected')}
                            </div>
                          );
                        default:
                          return '';
                      }
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      {t('leave.pending')}
                    </div>
                  </SelectItem>
                  <SelectItem value="approved">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {t('leave.approved')}
                    </div>
                  </SelectItem>
                  <SelectItem value="rejected">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      {t('leave.rejected')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Approver Name Select - Only show when approved or rejected */}
            {(approvalStatus === 'approved' || approvalStatus === 'rejected') && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {t('leave.approverName')}
                </label>
                <Select value={approverId} onValueChange={setApproverId}>
                  <SelectTrigger className={`h-12 w-full ${errors.approverName ? 'border-red-500 ring-red-200' : 'border-gray-200 hover:border-blue-300'}`}>
                    <SelectValue placeholder={t('leave.enterApproverName')}>
                      {approverId && (() => {
                        const selectedApprover = approverList.find(appr => appr.id === approverId);
                        return selectedApprover ? `${selectedApprover.name} (${selectedApprover.role})` : '';
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {approverList.map((appr) => (
                      <SelectItem key={appr.id} value={appr.id}>
                        {appr.name} <span className="text-xs text-gray-400 ml-2">({appr.role})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.approverName && (
                  <p className="text-sm text-red-500">{errors.approverName}</p>
                )}
              </div>
            )}
          </div>

          {/* Approval Note - Only show when rejected */}
          {approvalStatus === 'rejected' && (
            <div className="mt-6 space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                หมายเหตุไม่อนุมัติ
              </label>
              <Textarea
                placeholder="กรุณาระบุเหตุผลที่ไม่อนุมัติ"
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                className="min-h-[100px] border-gray-200 hover:border-blue-300"
              />
            </div>
          )}
        </div>

        {/* Reason and Contact */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">{t('leave.additionalInfo')}</h3>
          </div>

          <div className="space-y-6">
            {/* Reason field (show always) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t('leave.reason')}
              </label>
              <Textarea
                placeholder={t('leave.reasonPlaceholder')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={`min-h-[100px] ${errors.reason ? 'border-red-500 ring-red-200' : 'border-gray-200 hover:border-blue-300'}`}
              />
              {errors.reason && (
                <p className="text-sm text-red-500">{errors.reason}</p>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {t('leave.contactInfo')}
              </label>
              <Input
                type="text"
                placeholder={t('leave.contactPlaceholder')}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className={`h-12 ${errors.contact ? 'border-red-500 ring-red-200' : 'border-gray-200 hover:border-blue-300'}`}
              />
              {errors.contact && (
                <p className="text-sm text-red-500">{errors.contact}</p>
              )}
            </div>
          </div>
        </div>

        {/* File Upload */}
        {selectedLeaveType?.require_attachment && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <FileUpload
              attachments={attachments}
              onFileUpload={(e) => {
                const files = Array.from(e.target.files || []);
                setAttachments(prev => [...prev, ...files]);
              }}
              onRemoveAttachment={(index) => {
                setAttachments(prev => prev.filter((_, i) => i !== index));
              }}
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 h-12 px-6 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          >
            <ArrowLeftCircle className="w-4 h-4" />
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Send className="w-4 h-4" />
            {loading ? t('leave.submitting') : t('leave.submitLeave')}
          </Button>
        </div>
      </form>
    </div>
  );
};
