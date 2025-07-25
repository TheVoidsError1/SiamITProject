import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, User, ClipboardList, CalendarDays, FileText, Phone, Users, ArrowLeftCircle } from "lucide-react";
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
    personalLeaveType: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    reason: '',
    contact: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [personalLeaveType, setPersonalLeaveType] = useState("");

  // Dynamic attachment requirement based on selected leave type
  const selected = leaveTypes.find(type => type.id === leaveType);
  const requiresAttachmentField = !!selected?.require_attachment;
  const [step, setStep] = useState(1); // เพิ่ม state สำหรับ step form

  // Helper: isPersonalLeave, isHourlyLeave
  const isPersonalLeave = leaveType === "personal";
  const isHourlyLeave = personalLeaveType === "hour";

  const handlePersonalLeaveTypeChange = (value: string) => {
    setPersonalLeaveType(value);
    // Reset date/time fields when changing type
    setStartTime("");
    setEndTime("");
    if (value === "hour") {
      const today = new Date();
      setStartDate(today);
      setEndDate(today);
    } else {
      setStartDate(undefined);
      setEndDate(undefined);
    }
  };

  // set state จาก initialData ถ้ามี
  useEffect(() => {
    if (initialData) {
      setStartDate(initialData.startDate ? new Date(initialData.startDate) : undefined);
      setEndDate(initialData.endDate ? new Date(initialData.endDate) : undefined);
      setLeaveType(initialData.leaveType || initialData.type || "");
      setPersonalLeaveType(initialData.personalLeaveType || "");
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

  // handleSubmit: ถ้า onSubmit ถูกส่งมา ให้เรียก onSubmit(data) แทน submit ปกติ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeError("");
    let newErrors = {
      leaveType: '',
      personalLeaveType: '', // dummy เพื่อให้ type ตรง
      startDate: '',
      endDate: '',
      startTime: '', // dummy เพื่อให้ type ตรง
      endTime: '',   // dummy เพื่อให้ type ตรง
      reason: '',
      contact: '',
    };
    // ถ้าเป็นลากิจแบบ hourly ให้เพิ่ม startTime, endTime
    if (leaveType === 'personal' && personalLeaveType === 'hour') {
      newErrors.startTime = '';
      newErrors.endTime = '';
    }
    let hasError = false;
    if (!leaveType) {
      newErrors.leaveType = t('leave.required');
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
    if (!reason) {
      newErrors.reason = t('leave.required');
      hasError = true;
    }
    if (!contact) {
      newErrors.contact = t('leave.required');
      hasError = true;
    }
    // ถ้าเป็นลากิจแบบ hourly ให้เช็คเวลา
    if (leaveType === 'personal' && personalLeaveType === 'hour') {
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
      if ((startTime && !isTimeInRange(startTime)) || (endTime && !isTimeInRange(endTime))) {
        newErrors.startTime = t('leave.timeRangeError');
        newErrors.endTime = t('leave.timeRangeError');
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

    // Check personal leave type validation
    if (leaveType === "personal") {
      if (!durationType) {
        toast({
          title: t('leave.selectDurationType'),
          description: t('leave.selectDurationTypeDesc'),
          variant: "destructive",
        });
        return;
      }
      
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
          setTimeError('สามารถลาได้เฉพาะช่วงเวลาทำงาน 09:00 ถึง 18:00 เท่านั้น');
          toast({
            title: 'เวลานอกช่วงเวลาทำงาน',
            description: 'กรุณากรอกเวลาในช่วงเวลาทำงาน 09:00 ถึง 18:00 เท่านั้น',
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
    } else if (!endDate) {
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
    setStartTime("");
    setEndTime("");
  };

  // Reset fields เมื่อเปลี่ยน durationType
  const handleDurationTypeChange = (value: string) => {
    setDurationType(value);
    setStartTime("");
    setEndTime("");
    if (value === "hour") {
      const today = new Date();
      setStartDate(today);
      setEndDate(today);
    } else {
      setStartDate(undefined);
      setEndDate(undefined);
    }
  };

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
              <SelectTrigger className="h-12 rounded-xl border-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all">
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
          </div>

          {/* เงื่อนไข: แสดงฟิลด์อื่นๆ เฉพาะเมื่อเลือกประเภทการลาแล้ว */}
          {leaveType && (
            <>
              {/* Section: ช่วงวันที่ลา */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays className="w-5 h-5 text-green-500" />
                  <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">{t('leave.dateRange')}</span>
                </div>
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  disabled={isHourlyLeave}
                  minDate={isPersonalLeave && personalLeaveType === "day" ? new Date() : undefined}
                />
              </div>

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
                  className="min-h-[100px] resize-none rounded-xl border-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
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
                  className="w-full h-12 rounded-xl border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                />
              </div>

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
        </form>
      </div>
    </div>
  );
};