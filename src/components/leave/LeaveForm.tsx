import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { DateRangePicker } from "./DateRangePicker";
import { FileUpload } from "./FileUpload";
import { leaveTypes, employeeTypes, personalLeaveOptions, timeSlots } from "@/constants/leaveTypes";
import { useNavigate } from 'react-router-dom';

export const LeaveForm = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !leaveType || !reason || !employeeType) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "โปรดระบุข้อมูลทุกช่องที่จำเป็น",
        variant: "destructive",
      });
      return;
    }

    // Check personal leave type validation
    if (leaveType === "personal") {
      if (!personalLeaveType) {
        toast({
          title: "กรุณาเลือกประเภทการลากิจ",
          description: "โปรดระบุว่าจะลาเป็นวันหรือชั่วโมง",
          variant: "destructive",
        });
        return;
      }
      
      if (personalLeaveType === "hour" && (!startTime || !endTime)) {
        toast({
          title: "กรุณาระบุเวลา",
          description: "โปรดเลือกเวลาเริ่มต้นและสิ้นสุดการลา",
          variant: "destructive",
        });
        return;
      }
      
      if (personalLeaveType === "day" && !endDate) {
        toast({
          title: "กรุณาเลือกวันสิ้นสุด",
          description: "โปรดระบุวันที่สิ้นสุดการลา",
          variant: "destructive",
        });
        return;
      }
    } else if (!endDate) {
      toast({
        title: "กรุณาเลือกวันสิ้นสุด",
        description: "โปรดระบุวันที่สิ้นสุดการลา",
        variant: "destructive",
      });
      return;
    }

    // Check if attachment is required for certain leave types
    const requiresAttachmentField = ["sick", "maternity", "emergency"].includes(leaveType);
    if (requiresAttachmentField && attachments.length === 0) {
      toast({
        title: "กรุณาแนบหลักฐาน",
        description: "การลาประเภทนี้จำเป็นต้องแนบหลักฐาน",
        variant: "destructive",
      });
      return;
    }

    // --- API Integration ---
    try {
      const formData = new FormData();
      formData.append("employeeType", employeeType);
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
        throw new Error(data.error || "เกิดข้อผิดพลาดในการส่งคำขอลา");
      }
      toast({
        title: "ส่งคำขอลาเรียบร้อย! ✅",
        description: "คำขอลาของคุณถูกส่งไปยังผู้บริหารเพื่อพิจารณาแล้ว",
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
        title: "เกิดข้อผิดพลาด",
        description: err.message || "ไม่สามารถส่งคำขอลาได้",
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

  const selectedLeaveType = leaveTypes.find(type => type.value === leaveType);
  const requiresAttachmentField = selectedLeaveType?.requiresAttachment || false;
  const hasTimeOption = selectedLeaveType?.hasTimeOption || false;
  const isPersonalLeave = leaveType === "personal";
  const isHourlyLeave = personalLeaveType === "hour";

  // Set today's date for hourly leave
  const handlePersonalLeaveTypeChange = (value: string) => {
    setPersonalLeaveType(value);
    if (value === "hour") {
      const today = new Date();
      setStartDate(today);
      setEndDate(today);
    } else {
      setStartTime("");
      setEndTime("");
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* Employee Type */}
      <div className="space-y-2">
        <Label htmlFor="employee-type" className="text-sm font-medium">
          ตำแหน่งการลา *
        </Label>
        <Select value={employeeType} onValueChange={setEmployeeType}>
          <SelectTrigger>
            <SelectValue placeholder="เลือกตำแหน่งของคุณ" />
          </SelectTrigger>
          <SelectContent>
            {employeeTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leave Type */}
      <div className="space-y-2">
        <Label htmlFor="leave-type" className="text-sm font-medium">
          ประเภทการลา *
        </Label>
        <Select value={leaveType} onValueChange={setLeaveType}>
          <SelectTrigger>
            <SelectValue placeholder="เลือกประเภทการลา" />
          </SelectTrigger>
          <SelectContent>
            {leaveTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
                {type.requiresAttachment && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {requiresAttachmentField && (
          <p className="text-xs text-red-600">
            * ประเภทการลานี้จำเป็นต้องแนบหลักฐาน
          </p>
        )}
      </div>

      {/* Personal Leave Type Selection */}
      {isPersonalLeave && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            รูปแบบการลากิจ *
          </Label>
          <Select value={personalLeaveType} onValueChange={handlePersonalLeaveTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกรูปแบบการลา" />
            </SelectTrigger>
            <SelectContent>
              {personalLeaveOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Time Selection for Hourly Leave */}
      {isPersonalLeave && isHourlyLeave && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">เวลาเริ่มต้น *</Label>
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกเวลาเริ่มต้น" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">เวลาสิ้นสุด *</Label>
            <Select value={endTime} onValueChange={setEndTime}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกเวลาสิ้นสุด" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        />
      )}

      {/* Display selected date for hourly leave */}
      {isPersonalLeave && isHourlyLeave && startDate && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">วันที่ลา</Label>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              {startDate.toLocaleDateString('th-TH', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      )}

      {/* Supervisor */}
      <div className="space-y-2">
        <Label htmlFor="supervisor" className="text-sm font-medium">
          ชื่อผู้ดูแล/หัวหน้างาน
        </Label>
        <Input
          id="supervisor"
          placeholder="ระบุชื่อผู้ดูแลหรือหัวหน้างาน"
          value={supervisor}
          onChange={(e) => setSupervisor(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Reason */}
      <div className="space-y-2">
        <Label htmlFor="reason" className="text-sm font-medium">
          เหตุผลในการลา *
        </Label>
        <Textarea
          id="reason"
          placeholder="กรุณาระบุเหตุผลในการลา..."
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
          ช่องทางติดต่อระหว่างลา
        </Label>
        <Input
          id="contact"
          placeholder="เบอร์โทรศัพท์หรืออีเมล"
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
          ส่งคำขอลา
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            navigate("/"); // หรือเปลี่ยนเป็น path ที่ต้องการ เช่น "/dashboard"
          }}
          size="lg"
        >
          ยกเลิก
        </Button>
      </div>
    </form>
  );
};