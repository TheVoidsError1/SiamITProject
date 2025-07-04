
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { DateRangePicker } from "./DateRangePicker";
import { FileUpload } from "./FileUpload";
import { leaveTypes, personalLeaveOptions, timeSlots } from "@/constants/leaveTypes";
import { useTranslation } from "react-i18next";

export const LeaveForm = () => {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [leaveType, setLeaveType] = useState("");
  const [personalLeaveType, setPersonalLeaveType] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
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
      
      if (personalLeaveType === "hour" && (!startTime || !endTime)) {
        toast({
          title: t('leave.specifyTime'),
          description: t('leave.specifyTimeDesc'),
          variant: "destructive",
        });
        return;
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
    const requiresAttachment = ["sick", "maternity", "emergency"].includes(leaveType);
    if (requiresAttachment && attachments.length === 0) {
      toast({
        title: t('leave.attachmentRequired'),
        description: t('leave.attachmentRequiredDesc'),
        variant: "destructive",
      });
      return;
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
    setAttachments([]);
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
  const requiresAttachment = selectedLeaveType?.requiresAttachment || false;
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Leave Type */}
      <div className="space-y-2">
        <Label htmlFor="leave-type" className="text-sm font-medium">
          {t('leave.leaveType')} *
        </Label>
        <Select value={leaveType} onValueChange={setLeaveType}>
          <SelectTrigger>
            <SelectValue placeholder={t('leave.selectLeaveType')} />
          </SelectTrigger>
          <SelectContent>
            {leaveTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {t(`leaveTypes.${type.value}`)}
                {type.requiresAttachment && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {requiresAttachment && (
          <p className="text-xs text-red-600">
            * {t('leave.requiresAttachment')}
          </p>
        )}
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
              {personalLeaveOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(`leave.${option.value}Leave`)}
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
            <Label className="text-sm font-medium">{t('leave.startTime')} *</Label>
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger>
                <SelectValue placeholder={t('leave.selectStartTime')} />
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
            <Label className="text-sm font-medium">{t('leave.endTime')} *</Label>
            <Select value={endTime} onValueChange={setEndTime}>
              <SelectTrigger>
                <SelectValue placeholder={t('leave.selectEndTime')} />
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
          <Label className="text-sm font-medium">{t('leave.leaveDate')}</Label>
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
          {t('leave.supervisor')}
        </Label>
        <Input
          id="supervisor"
          placeholder={t('leave.supervisorPlaceholder')}
          value={supervisor}
          onChange={(e) => setSupervisor(e.target.value)}
          className="w-full"
        />
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
      {requiresAttachment && (
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
          onClick={() => window.history.back()}
          size="lg"
        >
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
};
