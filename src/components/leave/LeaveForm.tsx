import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send } from "lucide-react";
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

export const LeaveForm = () => {
  const { t, i18n } = useTranslation();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [leaveType, setLeaveType] = useState("");
  const [personalLeaveType, setPersonalLeaveType] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [employeeType, setEmployeeType] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [contact, setContact] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [departments, setDepartments] = useState<{ id: number; department_name: string }[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<{ id: string; leave_type: string }[]>([]);
  const [positions, setPositions] = useState<{ id: string; position_name: string }[]>([]);
  const [admins, setAdmins] = useState<{ id: string; admin_name: string }[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    // ดึงข้อมูล department จาก API
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch("http://localhost:3001/api/departments", {
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
        const res = await fetch("http://localhost:3001/api/leave-types", {
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
        const res = await fetch("http://localhost:3001/api/positions", {
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
        const res = await fetch("http://localhost:3001/api/admins", {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !leaveType || !reason) {
      toast({
        title: t('leave.fillAllFields'),
        description: t('leave.fillAllFieldsDesc'),
        variant: "destructive",
      });
      return;
    }

    // Check personal leave type validation
    if (leaveType === "personal") {
      if (!personalLeaveType) {
        toast({
          title: t('leave.selectPersonalLeave'),
          description: t('leave.selectPersonalLeaveDesc'),
          variant: "destructive",
        });
        return;
      }
      
      if (personalLeaveType === "hour") {
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
      }
      
      if (personalLeaveType === "day" && !endDate) {
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
    const requiresAttachmentField = ["sick", "maternity", "emergency"].includes(leaveType);
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
      if (personalLeaveType) formData.append("personalLeaveType", personalLeaveType);
      if (startDate) formData.append("startDate", startDate.toISOString().split("T")[0]);
      if (endDate) formData.append("endDate", endDate.toISOString().split("T")[0]);
      if (startTime) formData.append("startTime", startTime);
      if (endTime) formData.append("endTime", endTime);
      formData.append("reason", reason);
      formData.append("supervisor", supervisor);
      formData.append("contact", contact);
      // แนบไฟล์ imgLeave (เอาไฟล์แรก)
      if (attachments.length > 0) {
        formData.append("imgLeave", attachments[0]);
      }
      // เพิ่ม repid (id ของ user ปัจจุบัน)
      if (user?.id) {
        formData.append("repid", user.id);
      }
      // ส่ง API
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:3001/api/leave-request", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t('leave.submitError'));
      }
      toast({
        title: t('leave.leaveRequestSuccess'),
        description: t('leave.leaveRequestSuccessDesc'),
      });
      // Reset form
      setStartDate(undefined);
      setEndDate(undefined);
      setLeaveType("");
      setPersonalLeaveType("");
      setStartTime("");
      setEndTime("");
      setReason("");
      setSupervisor("");
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

  // const selectedLeaveType = leaveTypes.find(type => type.id === leaveType);
  // const requiresAttachmentField = selectedLeaveType?.requiresAttachment || false;
  // const hasTimeOption = selectedLeaveType?.hasTimeOption || false;
  // หมายเหตุ: ถ้าต้องการใช้ requiresAttachmentField หรือ hasTimeOption ต้องเพิ่มฟิลด์นี้ใน leaveType ที่ backend ด้วย
  // ฟีเจอร์แนบไฟล์: เฉพาะ sick, emergency, maternity
  const requiresAttachmentField = (() => {
    // สมมุติว่า leave_type ในฐานข้อมูลเป็นภาษาอังกฤษ (sick, emergency, maternity)
    const selected = leaveTypes.find(type => type.id === leaveType);
    if (!selected) return false;
    const name = selected.leave_type?.toLowerCase();
    return name === 'sick' || name === 'emergency' || name === 'maternity';
  })();
  const hasTimeOption = false; // ปิดฟีเจอร์เลือกเวลาแบบ dynamic ชั่วคราว
  // ตรวจสอบว่า leave_type ที่เลือกคือ 'personal' (ลากิจ)
  const isPersonalLeave = (() => {
    const selected = leaveTypes.find(type => type.id === leaveType);
    if (!selected) return false;
    return selected.leave_type?.toLowerCase() === 'personal';
  })();
  const isHourlyLeave = personalLeaveType === "hour";

  // Reset fields เมื่อเปลี่ยน leaveType
  const handleLeaveTypeChange = (value: string) => {
    setLeaveType(value);
    setPersonalLeaveType("");
    setStartDate(undefined);
    setEndDate(undefined);
    setStartTime("");
    setEndTime("");
  };

  // Reset fields เมื่อเปลี่ยน personalLeaveType
  const handlePersonalLeaveTypeChange = (value: string) => {
    setPersonalLeaveType(value);
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
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* Leave Type (เปลี่ยนเป็น dynamic จาก API) */}
      <div className="space-y-2">
        <Label htmlFor="leave-type" className="text-sm font-medium">
          {t('leave.leaveType')} *
        </Label>
        <Select value={leaveType} onValueChange={handleLeaveTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder={t('leave.selectLeaveType')} />
          </SelectTrigger>
          <SelectContent>
            {leaveTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {t(`leaveTypes.${type.leave_type}`, type.leave_type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Personal Leave Type Selection */}
      {isPersonalLeave && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t('leave.personalLeaveType')} *
          </Label>
          <Select value={personalLeaveType} onValueChange={handlePersonalLeaveTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('leave.selectPersonalLeaveType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">{t('leave.dayLeave')}</SelectItem>
              <SelectItem value="hour">{t('leave.hourLeave')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Display selected date for hourly leave (move here) */}
          {isHourlyLeave && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('leave.leaveDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, "dd MMMM yyyy", { locale: i18n.language === 'th' ? th : enUS })
                    ) : (
                      <span>{t('leave.selectDate')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    disabled={date => date < new Date(new Date().setHours(0,0,0,0))}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      )}

      {/* Time Selection for Hourly Leave */}
      {isPersonalLeave && isHourlyLeave && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('leave.startTime')} *</Label>
            <Input
              type="text"
              value={startTime}
              onChange={e => setStartTime(autoFormatTimeInput(e.target.value))}
              placeholder={t('leave.timePlaceholder')}
              required
              inputMode="numeric"
              pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"
              maxLength={5}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('leave.endTime')} *</Label>
            <Input
              type="text"
              value={endTime}
              onChange={e => setEndTime(autoFormatTimeInput(e.target.value))}
              placeholder={t('leave.timePlaceholder')}
              required
              inputMode="numeric"
              pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"
              maxLength={5}
            />
          </div>
        </div>
      )}

      {/* Date Range - Show only for day leave or non-personal leave */}
      {(!isPersonalLeave || personalLeaveType === "day") && (
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          disabled={isHourlyLeave}
          minDate={isPersonalLeave && personalLeaveType === "day" ? new Date() : undefined}
        />
      )}

      {/* Supervisor */}
      <div className="space-y-2">
        <Label htmlFor="supervisor">{t('leave.supervisor')}</Label>
        <Select
          value={supervisor}
          onValueChange={setSupervisor}
        >
          <SelectTrigger id="supervisor">
            <SelectValue placeholder={t('leave.selectSupervisor')} />
          </SelectTrigger>
          <SelectContent>
            {admins.map((admin) => (
              <SelectItem key={admin.id} value={admin.id}>
                {admin.admin_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reason */}
      <div className="space-y-2">
        <Label htmlFor="reason" className="text-sm font-medium">
          {t('leave.reason')} *
        </Label>
        <Textarea
          id="reason"
          placeholder={t('leave.reasonPlaceholder')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[100px] resize-none"
        />
      </div>

      {/* File Upload - Show only for certain leave types */}
      {requiresAttachmentField && (
        <FileUpload
          attachments={attachments}
          onFileUpload={handleFileUpload}
          onRemoveAttachment={removeAttachment}
        />
      )}

      {/* Contact Info */}
      <div className="space-y-2">
        <Label htmlFor="contact" className="text-sm font-medium">
          {t('leave.contactInfo')}
        </Label>
        <Input
          id="contact"
          placeholder={t('leave.contactPlaceholder')}
          className="w-full"
          value={contact}
          onChange={e => setContact(e.target.value)}
        />
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <Button 
          type="submit" 
          className="flex-1 gradient-bg text-white font-medium"
          size="lg"
        >
          <Send className="w-4 h-4 mr-2" />
          {t('leave.submitLeave')}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            navigate("/"); // หรือเปลี่ยนเป็น path ที่ต้องการ เช่น "/dashboard"
          }}
          size="lg"
        >
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
};