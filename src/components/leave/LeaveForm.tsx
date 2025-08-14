import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, User, ClipboardList, CalendarDays, FileText, Phone, Users, ArrowLeftCircle, Clock } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { DateRangePicker } from "./DateRangePicker";
import { FileUpload } from "./FileUpload";
import { leaveTypes, personalLeaveOptions, timeSlots } from "@/constants/leaveTypes";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";

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

// เพิ่มที่ด้านบนของไฟล์

// เปลี่ยน function signature
export interface LeaveFormProps {
  initialData?: any;
  onSubmit?: (data: any) => void;
  mode?: 'create' | 'edit';
}

export const LeaveForm = ({ initialData, onSubmit, mode = 'create' }: LeaveFormProps) => {
  const { t, i18n } = useTranslation();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [leaveDate, setLeaveDate] = useState<Date>(); // เพิ่ม state สำหรับวันที่ลา
  const [leaveType, setLeaveType] = useState("");
  const [durationType, setDurationType] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [employeeType, setEmployeeType] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [contact, setContact] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [departments, setDepartments] = useState<{ id: number; department_name_th: string; department_name_en: string }[]>([]);
  // Update leaveTypes state type to include require_attachment
  const [leaveTypes, setLeaveTypes] = useState<{ id: string; leave_type_th: string; leave_type_en: string; require_attachment?: boolean }[]>([]);
  const [positions, setPositions] = useState<{ id: string; position_name_th: string; position_name_en: string }[]>([]);
  const [admins, setAdmins] = useState<{ id: string; admin_name: string }[]>([]);
  const { user } = useAuth();
  const [timeError, setTimeError] = useState("");
  // เพิ่ม state สำหรับ error ของแต่ละฟิลด์
  const [errors, setErrors] = useState({
    leaveType: '',
    durationType: '',
    startDate: '',
    endDate: '',
    leaveDate: '', // เพิ่ม error สำหรับวันที่ลา
    startTime: '',
    endTime: '',
    reason: '',
    contact: '',
  });
  const [submitted, setSubmitted] = useState(false);

  // Dynamic attachment requirement based on selected leave type
  const selected = leaveTypes.find(type => type.id === leaveType);
  const requiresAttachmentField = !!selected?.require_attachment;

  // Helper: isHourlyLeave
  const isHourlyLeave = durationType === "hour";

  // Helper function สำหรับตรวจสอบการลา
  const getLeaveNotice = (startDate: Date | undefined) => {
    if (!startDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDateOnly = new Date(startDate);
    startDateOnly.setHours(0, 0, 0, 0);
    
    // ถ้าวันที่เริ่มลาน้อยกว่าวันนี้ (ไม่รวมวันนี้) = ลาย้อนหลัง
    if (startDateOnly < today) {
      return {
        type: 'backdated',
        message: t('leave.backdatedNotice'),
        className: 'bg-yellow-50 border-yellow-200 text-yellow-800'
      };
    }
    
    // ถ้าวันที่เริ่มลามากกว่าวันนี้ = ลาล่วงหน้า
    if (startDateOnly > today) {
      return {
        type: 'advance',
        message: t('leave.advanceNotice'),
        className: 'bg-blue-50 border-blue-200 text-blue-800'
      };
    }
    
    // ถ้าเป็นวันนี้ = ไม่แสดงแจ้งเตือน
    return null;
  };



  // set state จาก initialData ถ้ามี
  useEffect(() => {
    if (initialData) {
      setStartDate(initialData.startDate ? new Date(initialData.startDate) : undefined);
      setEndDate(initialData.endDate ? new Date(initialData.endDate) : undefined);
      setLeaveDate(initialData.leaveDate ? new Date(initialData.leaveDate) : undefined); // เพิ่มการ set leaveDate
      setLeaveType(initialData.leaveType || initialData.type || "");
      setDurationType(initialData.durationType || "");
      setStartTime(initialData.startTime || "");
      setEndTime(initialData.endTime || "");
      setReason(initialData.reason || "");
      setEmployeeType(initialData.employeeType || "");
      setContact(initialData.contact || "");
      // แนบไฟล์เดิม (string/array)
      if (initialData.attachments) {
        let files = initialData.attachments;
        if (typeof files === 'string') {
          try { files = JSON.parse(files); } catch {}
        }
        setAttachments(Array.isArray(files) ? files : []);
      }
    }
  }, [initialData]);

  useEffect(() => {
    // ดึงข้อมูล department จาก API
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.status === "success" && Array.isArray(data.data)) {
          setDepartments(data.data);
        }
      } catch (err) {
        // สามารถ toast แจ้ง error ได้ถ้าต้องการ
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    // ดึงข้อมูล leave types จาก API
    const fetchLeaveTypes = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/leave-types`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setLeaveTypes(data.data);
        }
      } catch (err) {
        // สามารถ toast แจ้ง error ได้ถ้าต้องการ
      }
    };
    fetchLeaveTypes();
  }, []);

  useEffect(() => {
    // ดึงข้อมูลตำแหน่ง (position) จาก API
    const fetchPositions = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/positions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.status === "success" && Array.isArray(data.data)) {
          setPositions(data.data);
        }
      } catch (err) {
        // สามารถ toast แจ้ง error ได้ถ้าต้องการ
      }
    };
    fetchPositions();
  }, []);

  useEffect(() => {
    // ดึงข้อมูล admin จาก API
    const fetchAdmins = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admins`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setAdmins(data.data);
        }
      } catch (err) {
        // สามารถ toast แจ้ง error ได้ถ้าต้องการ
      }
    };
    fetchAdmins();
  }, []);

  const isTimeInRange = (time: string) => {
    // รองรับ input type="time" (HH:mm)
    if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(time)) return false;
    const [h, m] = time.split(":").map(Number);
    const minutes = h * 60 + m;
    const min = 9 * 60; // 09:00
    const max = 18 * 60; // 18:00
    return minutes >= min && minutes <= max;
  };

  // ฟังก์ชันสำหรับจำกัดเวลาใน input field
  const getTimeConstraints = () => {
    return {
      min: "09:00",
      max: "18:00"
    };
  };

  // handleSubmit: ถ้า onSubmit ถูกส่งมา ให้เรียก onSubmit(data) แทน submit ปกติ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeError("");
    let newErrors = {
      leaveType: '',
      durationType: '', // dummy เพื่อให้ type ตรง
      startDate: '',
      endDate: '',
      leaveDate: '', // เพิ่ม error สำหรับวันที่ลา
      startTime: '', // dummy เพื่อให้ type ตรง
      endTime: '',   // dummy เพื่อให้ type ตรง
      reason: '',
      contact: '',
    };
    // ถ้าเป็นลาแบบ hourly ให้เพิ่ม startTime, endTime และ leaveDate
    if (durationType === 'hour') {
      newErrors.startTime = '';
      newErrors.endTime = '';
      newErrors.leaveDate = '';
    }
    let hasError = false;
    if (!leaveType) {
      newErrors.leaveType = t('leave.required');
      hasError = true;
    }
    if (!durationType) {
      newErrors.durationType = t('leave.required');
      hasError = true;
    }
    if (!startDate) {
      newErrors.startDate = t('leave.required');
      hasError = true;
    }
    if (!endDate) {
      newErrors.endDate = t('leave.required');
      hasError = true;
    }
    // ถ้าเป็นลาแบบ hourly ให้เช็ควันที่ลา
    if (durationType === 'hour' && !leaveDate) {
      newErrors.leaveDate = t('leave.required');
      hasError = true;
    }
    if (!reason) {
      newErrors.reason = t('leave.required');
      hasError = true;
    }
    if (!contact) {
      newErrors.contact = t('leave.required');
      hasError = true;
    }
    // ถ้าเป็นลาแบบ hourly ให้เช็คเวลา
    if (durationType === 'hour') {
      if (!startTime) {
        newErrors.startTime = t('leave.required');
        hasError = true;
      }
      if (!endTime) {
        newErrors.endTime = t('leave.required');
        hasError = true;
      }
      if (startTime && endTime && startTime === endTime) {
        newErrors.startTime = t('leave.timeNotSame');
        newErrors.endTime = t('leave.timeNotSame');
        hasError = true;
      }
      // ตรวจสอบว่าเวลาสิ้นสุดต้องไม่น้อยกว่าเวลาเริ่มต้น
      if (startTime && endTime && startTime > endTime) {
        newErrors.startTime = t('leave.endTimeBeforeStart');
        newErrors.endTime = t('leave.endTimeBeforeStart');
        hasError = true;
      }
      if ((startTime && !isTimeInRange(startTime)) || (endTime && !isTimeInRange(endTime))) {
        const errorMessage = `${t('leave.timeRangeError')} (09:00-18:00)`;
        newErrors.startTime = errorMessage;
        newErrors.endTime = errorMessage;
        hasError = true;
      }
    }
    setErrors(newErrors);
    if (hasError) {
      toast({
        title: t('leave.fillAllFields'),
        description: t('leave.fillAllFieldsDesc'),
        variant: 'destructive',
      });
      return;
    }

    // Check duration type validation
    if (durationType === "hour") {
      if (!startTime || !endTime) {
        toast({
          title: t('leave.specifyTime'),
          description: t('leave.specifyTimeDesc'),
          variant: "destructive",
        });
        return;
      }
      // validate รูปแบบเวลา HH:mm
      if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
        toast({
          title: 'รูปแบบเวลาไม่ถูกต้อง',
          description: 'กรุณากรอกเวลาเป็น HH:mm เช่น 09:00, 17:30',
          variant: "destructive",
        });
        return;
      }
      // ตรวจสอบห้ามเวลาเริ่ม = เวลาสิ้นสุด
      if (startTime === endTime) {
        setTimeError('เวลาเริ่มต้นและเวลาสิ้นสุดต้องไม่เหมือนกัน');
        toast({
          title: 'เวลาเริ่มต้นและเวลาสิ้นสุดต้องไม่เหมือนกัน',
          description: 'กรุณาเลือกเวลาให้แตกต่างกัน',
          variant: 'destructive',
        });
        return;
      }
      // ตรวจสอบช่วงเวลา 09:00-18:00
      if (!isTimeInRange(startTime) || !isTimeInRange(endTime)) {
        setTimeError(t('leave.timeRangeError'));
        toast({
          title: t('leave.timeRangeError'),
          description: t('leave.timeRangeInfo'),
          variant: 'destructive',
        });
        return;
      }
    }
    
    if (durationType === "day" && !endDate) {
      toast({
        title: t('leave.selectEndDate'),
        description: t('leave.selectEndDateDesc'),
        variant: "destructive",
      });
      return;
    }

    // Check if attachment is required for certain leave types
    if (requiresAttachmentField && attachments.length === 0) {
      toast({
        title: t('leave.attachmentRequired'),
        description: t('leave.attachmentRequiredDesc'),
        variant: "destructive",
      });
      return;
    }

    // --- API Integration ---
    try {
      const formData = new FormData();
      formData.append("leaveType", leaveType);
      if (durationType) formData.append("durationType", durationType);
      // Use only formatDateLocal and check type
      if (startDate instanceof Date && !isNaN(startDate.getTime())) {
        formData.append("startDate", formatDateLocal(startDate));
      }
      if (endDate instanceof Date && !isNaN(endDate.getTime())) {
        formData.append("endDate", formatDateLocal(endDate));
      }
      // เพิ่มวันที่ลาสำหรับลาแบบชั่วโมง
      if (durationType === 'hour' && leaveDate instanceof Date && !isNaN(leaveDate.getTime())) {
        formData.append("leaveDate", formatDateLocal(leaveDate));
      }
      if (startTime) formData.append("startTime", startTime);
      if (endTime) formData.append("endTime", endTime);
      formData.append("reason", reason);
      formData.append("contact", contact);
      // แนบไฟล์ทุกประเภทใน attachments array
      attachments.forEach(file => {
        formData.append('attachments', file);
      });
      // เพิ่ม repid (id ของ user ปัจจุบัน)
      if (user?.id) {
        formData.append("repid", user.id);
      }
      // เพิ่ม position (id ของ position ของ user ปัจจุบัน)
      if (user?.position) {
        formData.append("position", user.position);
      }
      // ส่ง API
      const token = localStorage.getItem('token');
      let response, data;
      if (mode === 'edit' && initialData?.id) {
        // PUT สำหรับอัปเดตใบลา
        response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/leave-request/${initialData.id}`, {
          method: "PUT",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept-Language': i18n.language
          },
        });
      } else {
        // POST สำหรับสร้างใหม่
        response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/leave-request`, {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept-Language': i18n.language
          },
        });
      }
      data = await response.json();
      if (!response.ok) {
        // ถ้ามี message จาก backend ให้แสดงใน toast
        toast({
          title: i18n.language.startsWith('en') ? 'Notice' : 'แจ้งเตือน',
          description: data.message || t('leave.submitError'),
          variant: "default", // เปลี่ยนจาก destructive เป็น default (สีเทา)
        });
        return;
      }
      if (mode === 'edit') {
        toast({
          title: t('leave.updateSuccess', 'อัปเดตใบลาสำเร็จ'),
          description: t('leave.updateSuccessDesc', 'แก้ไขข้อมูลใบลาสำเร็จ'),
          variant: 'default',
          className: 'border-green-500 bg-green-50 text-green-900',
        });
      } else {
        toast({
          title: t('leave.leaveRequestSuccess'),
          description: t('leave.leaveRequestSuccessDesc'),
        });
      }
      // Reset form เฉพาะ create
      if (mode !== 'edit') {
        setStartDate(undefined);
        setEndDate(undefined);
        setLeaveDate(undefined); // เพิ่มการ reset leaveDate
        setLeaveType("");
        setStartTime("");
        setEndTime("");
        setReason("");
        setEmployeeType("");
        setAttachments([]);
        setContact("");
        if (formRef.current) formRef.current.reset();
      }
      // ถ้ามี onSubmit callback ให้เรียก (เช่นปิด modal)
      if (onSubmit) onSubmit(data);
      toast({
        title: t('leave.leaveRequestSuccess'),
        description: t('leave.leaveRequestSuccessDesc'),
      });
      // Reset form
      setStartDate(undefined);
      setEndDate(undefined);
      setLeaveDate(undefined); // เพิ่มการ reset leaveDate
      setLeaveType("");
      setDurationType("");
      setStartTime("");
      setEndTime("");
      setReason("");
      setEmployeeType("");
      setAttachments([]);
      setContact("");
      if (formRef.current) formRef.current.reset();
    } catch (err: any) {
      toast({
        title: t('error.title'),
        description: err.message || t('leave.submitError'),
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Reset fields เมื่อเปลี่ยน leaveType
  const handleLeaveTypeChange = (value: string) => {
    setLeaveType(value);
    setDurationType("");
    setStartDate(undefined);
    setEndDate(undefined);
    setLeaveDate(undefined); // เพิ่มการ reset leaveDate
    setStartTime("");
    setEndTime("");
  };

  // Reset fields เมื่อเปลี่ยน durationType
  const handleDurationTypeChange = (value: string) => {
    setDurationType(value);
    setStartTime("");
    setEndTime("");
    setLeaveDate(undefined); // เพิ่มการ reset leaveDate
    // เมื่อเลือกรายชั่วโมง ไม่บังคับเป็นวันปัจจุบัน ให้ผู้ใช้เลือกเอง
    if (value === "hour") {
      // เติมเวลาอัตโนมัติ: เริ่มต้น 09:00 และสิ้นสุด 18:00
      setStartTime("09:00");
      setEndTime("18:00");
      // เคลียร์ start/end date จนกว่าจะเลือกวันที่ลา เพื่อป้องกันใช้วันที่ปัจจุบันโดยไม่ตั้งใจ
      setStartDate(undefined);
      setEndDate(undefined);
    }
  };

  // ซิงก์วันที่สำหรับลาแบบรายชั่วโมง: เมื่อผู้ใช้เลือก leaveDate ให้กำหนด start/end เป็นวันเดียวกัน
  useEffect(() => {
    if (durationType === 'hour' && leaveDate) {
      setStartDate(leaveDate);
      setEndDate(leaveDate);
    }
  }, [durationType, leaveDate]);

  return (
    <div className="max-w-2xl mx-auto my-8 animate-fade-in">
      <div className="glass shadow-2xl rounded-3xl p-8 md:p-10 border border-blue-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-8">
          <ClipboardList className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl md:text-3xl font-bold gradient-text drop-shadow">{t('leave.leaveRequestForm')}</h2>
        </div>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-7">
          {/* Section: ประเภทการลา */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="w-5 h-5 text-pink-500" />
              <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">{t('leave.leaveType')}</span>
            </div>
            <Select value={leaveType} onValueChange={handleLeaveTypeChange}>
              <SelectTrigger className={`h-12 rounded-xl border-2 transition-all ${
                errors.leaveType 
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                  : 'focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20'
              }`}>
                <SelectValue placeholder={t('leave.selectLeaveType')} />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes
                  .filter(type => (type.leave_type_th || type.leave_type_en) && (type.leave_type_th?.trim() !== '' || type.leave_type_en?.trim() !== ''))
                  .map((type) => (
                    <SelectItem key={type.id} value={type.id}>{i18n.language.startsWith('th') ? type.leave_type_th : type.leave_type_en}</SelectItem>
                  ))}
                              </SelectContent>
              </Select>
              {errors.leaveType && (
                <p className="mt-1 text-sm text-red-600">{errors.leaveType}</p>
              )}
            </div>

          {/* เงื่อนไข: แสดงฟิลด์อื่นๆ เฉพาะเมื่อเลือกประเภทการลาแล้ว */}
          {leaveType && (
            <>
              {/* Section: ประเภทการลา (วัน/ชั่วโมง) */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-purple-500" />
                  <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">{t('leave.durationType')}</span>
                </div>
                <Select value={durationType} onValueChange={handleDurationTypeChange}>
                  <SelectTrigger className={`h-12 rounded-xl border-2 transition-all ${
                    errors.durationType 
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                      : 'focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                  }`}>
                    <SelectValue placeholder={t('leave.selectDurationType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">{t('leave.fullDay')}</SelectItem>
                    <SelectItem value="hour">{t('leave.hourly')}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.durationType && (
                  <p className="mt-1 text-sm text-red-600">{errors.durationType}</p>
                )}
              </div>

              {/* เงื่อนไข: แสดงฟิลด์อื่นๆ เฉพาะเมื่อเลือกประเภทการลาและประเภทการลาแล้ว */}
              {durationType && (
                <>
                  {/* Section: ช่วงวันที่ลา - Only show for non-hourly leave */}
                  {!isHourlyLeave && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarDays className="w-5 h-5 text-green-500" />
                        <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">{t('leave.dateRange')}</span>
                      </div>
                      <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {t('leave.dateRangeDescription')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {t('leave.currentDate')}: {new Date().toLocaleDateString(i18n.language === 'th' ? 'th-TH' : 'en-US')}
                        </p>
                      </div>
                      <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                        disabled={false}
                      />
                      {/* แจ้งเตือนเมื่อมีการลาย้อนหลังหรือลาล่วงหน้า */}
                      {(() => {
                        const notice = getLeaveNotice(startDate);
                        if (!notice) return null;
                        
                        const iconColor = notice.type === 'backdated' ? 'text-yellow-600' : 'text-blue-600';
                        const iconPath = notice.type === 'backdated' 
                          ? "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          : "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z";
                        
                        return (
                          <div className={`mt-2 p-3 border rounded-lg ${notice.className}`}>
                            <div className="flex items-center gap-2">
                              <svg className={`w-4 h-4 ${iconColor}`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d={iconPath} clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-medium">
                                {notice.message}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* เงื่อนไข: แสดงฟิลด์วันที่ลาเฉพาะเมื่อเลือกแบบชั่วโมง */}
                  {isHourlyLeave && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarDays className="w-5 h-5 text-indigo-500" />
                        <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">{t('leave.leaveDate')}</span>
                      </div>
                      <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200 mb-1">
                          <strong>{t('leave.selectLeaveDate')}</strong>
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          {t('leave.leaveDateDescription')}
                        </p>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full h-12 justify-start text-left font-normal rounded-xl border-2 transition-all ${
                              errors.leaveDate 
                                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                                : 'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                            }`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {leaveDate ? (
                              format(leaveDate, "PPP", { locale: i18n.language === 'th' ? th : enUS })
                            ) : (
                              <span className="text-gray-500">{t('leave.selectLeaveDate')}</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={leaveDate}
                            onSelect={setLeaveDate}
                            initialFocus
                            locale={i18n.language === 'th' ? th : enUS}
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.leaveDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.leaveDate}</p>
                      )}
                    </div>
                  )}

                  {/* เงื่อนไข: แสดงฟิลด์เวลาเฉพาะเมื่อเลือกแบบชั่วโมง */}
                  {isHourlyLeave && (
                    <>
                      {/* Section: เวลาเริ่มต้น */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-5 h-5 text-blue-500" />
                          <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">{t('leave.startTime')}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {t('leave.timeRangeInfo')}
                        </p>
                        <Input
                          type="time"
                          id="startTime"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          min={getTimeConstraints().min}
                          max={getTimeConstraints().max}
                          className={`w-full h-12 rounded-xl border-2 transition-all ${
                            errors.startTime 
                              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                              : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          }`}
                        />
                        {errors.startTime && (
                          <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
                        )}
                      </div>

                      {/* Section: เวลาสิ้นสุด */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-5 h-5 text-red-500" />
                          <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">{t('leave.endTime')}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {t('leave.timeRangeInfo')}
                        </p>
                        <Input
                          type="time"
                          id="endTime"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          min={getTimeConstraints().min}
                          max={getTimeConstraints().max}
                          className={`w-full h-12 rounded-xl border-2 transition-all ${
                            errors.endTime 
                              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                              : 'focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          }`}
                        />
                        {errors.endTime && (
                          <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Section: เหตุผล */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-orange-500" />
                      <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">{t('leave.reason')}</span>
                    </div>
                    <Textarea
                      id="reason"
                      placeholder={t('leave.reasonPlaceholder')}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className={`min-h-[100px] resize-none rounded-xl border-2 transition-all break-all overflow-wrap-anywhere whitespace-pre-wrap ${
                        errors.reason 
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                          : 'focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                      }`}
                    />
                    {errors.reason && (
                      <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
                    )}
                  </div>

                  {/* Section: ข้อมูลติดต่อ */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">{t('leave.contactInfo')}</span>
                    </div>
                    <Input
                      id="contact"
                      placeholder={t('leave.contactPlaceholder')}
                      className={`w-full h-12 rounded-xl border-2 transition-all ${
                        errors.contact 
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                          : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      }`}
                      value={contact}
                      onChange={e => setContact(e.target.value)}
                    />
                    {errors.contact && (
                      <p className="mt-1 text-sm text-red-600">{errors.contact}</p>
                    )}
                  </div>

                  {/* Section: แนบไฟล์ - แสดงเฉพาะเมื่อประเภทการลาต้องการแนบเอกสาร */}
                  {requiresAttachmentField && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-green-500" />
                        <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">{t('leave.attachments')}</span>
                        <span className="text-sm text-red-500 font-medium">*</span>
                      </div>
                      <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-1">
                          <strong>{t('leave.attachmentRequired')}</strong>
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">
                          {t('leave.attachmentRequiredDesc')}
                        </p>
                      </div>
                      <FileUpload
                        attachments={attachments}
                        onFileUpload={handleFileUpload}
                        onRemoveAttachment={removeAttachment}
                      />
                    </div>
                  )}

                  {/* Section: ปุ่ม */}
                  <div className="flex gap-3 pt-6">
                    <Button 
                      type="submit" 
                      className="flex-1 gradient-bg text-white font-semibold text-lg h-12 rounded-xl shadow-lg hover:scale-105 transition-transform duration-200"
                      size="lg"
                    >
                      <Send className="w-5 h-5 mr-2" />
                      {t('leave.submitLeave')}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => { navigate("/"); }}
                      size="lg"
                      className="flex-1 h-12 rounded-xl border-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-lg"
                    >
                      <ArrowLeftCircle className="w-5 h-5 mr-2" />
                      {t('common.cancel')}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
};