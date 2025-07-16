
export const leaveTypes = [
  { value: "sick", label: "ลาป่วย", requiresAttachment: true },
  { value: "vacation", label: "ลาพักร้อน", requiresAttachment: false },
  { value: "personal", label: "ลากิจ", requiresAttachment: false, hasTimeOption: true },
  { value: "maternity", label: "ลาคลอด", requiresAttachment: true },
  { value: "emergency", label: "ลาฉุกเฉิน", requiresAttachment: true },
];

export const employeeTypes = [
  { value: "intern", label: "เด็กฝึกงาน" },
  { value: "employee", label: "พนักงานบริษัท" },
];

export const personalLeaveOptions = [
  { value: "day", label: "ลาเป็นวัน" },
  { value: "hour", label: "ลาเป็นชั่วโมง" },
];

export const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00"
];
