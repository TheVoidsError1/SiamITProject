import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from '@/contexts/AuthContext';
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { AlertCircle, Calendar, CheckCircle, Clock, FileText, Filter, X, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
// เพิ่ม import LeaveForm
import { LeaveForm } from "@/components/leave/LeaveForm";
// เพิ่ม useState สำหรับ dialog edit
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';


const LeaveHistory = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [editLeave, setEditLeave] = useState<any | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // --- เพิ่ม state สำหรับ paging ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // --- เพิ่ม state สำหรับ summary ---
  const [summary, setSummary] = useState<{ totalLeaveDays: number; approvedCount: number; pendingCount: number; rejectedCount?: number } | null>(null);
  // --- เพิ่ม state สำหรับ show more/less ---
  const [expandedReason, setExpandedReason] = useState<string | null>(null);
  const [expandedReject, setExpandedReject] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<number | ''>('');
  const [filterYear, setFilterYear] = useState<number | ''>('');
  const [selectedLeave, setSelectedLeave] = useState<any | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  // --- เพิ่ม state สำหรับ items per page ---
  const [limit, setLimit] = useState(5);
  const [filterLeaveType, setFilterLeaveType] = useState('');
  // --- เพิ่ม state สำหรับ leave types dropdown ---
  const [leaveTypes, setLeaveTypes] = useState<{ id: string; leave_type: string; leave_type_th: string; leave_type_en: string }[]>([]);
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(false);
  const [leaveTypesError, setLeaveTypesError] = useState<string | null>(null);

  // --- เพิ่ม state สำหรับปฏิทินและ filter ใหม่ ---
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [yearOptions, setYearOptions] = useState<number[]>([]);
  const [monthOptions, setMonthOptions] = useState<number[]>([]);
  const [singleDate, setSingleDate] = useState<Date | undefined>(undefined);

  const { showSessionExpiredDialog } = useAuth();

  const [deleteLeaveId, setDeleteLeaveId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLeaveHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showSessionExpiredDialog();
        return;
      }
      let url = `/api/leave-history?page=${page}&limit=${limit}`;
      if (filterLeaveType) url += `&leaveType=${filterLeaveType}`;
      if (filterMonth) url += `&month=${filterMonth}`;
      if (filterYear) url += `&year=${filterYear}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      if (singleDate) {
        url += `&date=${format(singleDate, 'yyyy-MM-dd')}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        showSessionExpiredDialog();
        return;
      }
      const data = await res.json();
      if (data.status === "success") {
        setLeaveHistory(data.data);
        setTotalPages(data.totalPages || 1);
        setSummary(data.summary || null);
      } else {
        setError(data.message || "Unknown error");
      }
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, filterMonth, filterYear, limit, filterLeaveType, filterStatus, singleDate, showSessionExpiredDialog]);

  useEffect(() => {
    fetchLeaveHistory();
  }, [fetchLeaveHistory]);

  const handleDeleteLeave = async () => {
    if (!deleteLeaveId) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/leave-request/${deleteLeaveId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setDeleteLeaveId(null);
        setPage(1); // รีเฟรช leaveHistory
        fetchLeaveHistory(); // ดึงข้อมูลใหม่ทันทีหลังลบ
        toast({
          title: t('system.deleteSuccess', 'ลบใบลาสำเร็จ'),
          description: t('system.deleteSuccessDesc', 'ใบลาถูกลบเรียบร้อยแล้ว'),
          variant: 'destructive',
          className: 'border-red-500 bg-red-50 text-red-900',
        });
      } else {
        alert(data.message || t("system.deleteFailed", "Delete failed"));
      }
    } catch (e) {
      alert(t("system.deleteFailed", "Delete failed"));
    } finally {
      setDeleting(false);
    }
  };

  // --- เพิ่มฟังก์ชันสำหรับดึงข้อมูลใบลาจาก backend ---
  const handleEditLeave = async (leaveId: string) => {
    setEditLeave(null); // reset ก่อน
    setShowEditDialog(true); // เปิด dialog ทันที (option: ใส่ loading)
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/leave-request/${leaveId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const leave = data.data;
        const mapped = {
          id: leave.id,
          leaveType: leave.type || leave.leaveType || '',
          personalLeaveType: leave.personalLeaveType || '',
          startDate: leave.startDate ? new Date(leave.startDate) : undefined,
          endDate: leave.endDate ? new Date(leave.endDate) : undefined,
          startTime: leave.startTime || '',
          endTime: leave.endTime || '',
          reason: leave.reason || '',
          supervisor: leave.supervisor || leave.supervisorId || '',
          contact: leave.contact || '',
          attachments: leave.attachments || [],
          employeeType: leave.employeeType || '',
        };
        setEditLeave(mapped);
      }
    } catch (e) {
      // handle error
    }
  };

  // เพิ่มฟังก์ชันใหม่สำหรับดึงรายละเอียดใบลาจาก backend
  const handleViewDetails = async (leaveId: string) => {
    setSelectedLeave(null);
    setShowDetailDialog(true); // เปิด dialog ทันที (option: ใส่ loading)
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/leave-request/detail/${leaveId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // map ให้แน่ใจว่ามี startDate และ submittedDate ที่ frontend ใช้
        setSelectedLeave({
          ...data.data,
          startDate: data.data.startDate || data.data.leaveDate || '-',
          submittedDate: data.data.createdAt || data.data.submittedDate || '-',
        });
      }
    } catch (e) {
      // handle error
    }
  };

  // Fetch leave types from backend
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      setLeaveTypesLoading(true);
      setLeaveTypesError(null);
      try {
        const res = await fetch('/api/leave-types');
        const data = await res.json();
        if (data.success) {
          setLeaveTypes(data.data);
        } else {
          setLeaveTypes([]);
          setLeaveTypesError(data.message || 'Failed to fetch leave types');
        }
      } catch (err: any) {
        setLeaveTypes([]);
        setLeaveTypesError(err.message || 'Failed to fetch leave types');
      } finally {
        setLeaveTypesLoading(false);
      }
    };
    fetchLeaveTypes();
  }, []);

  // ดึง filter options จาก backend
  useEffect(() => {
    const fetchFilters = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/leave-history/filters', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === 'success') {
        setStatusOptions(data.statuses || []);
        setYearOptions(data.years || []);
        setMonthOptions(data.months || []);
      }
    };
    fetchFilters();
  }, []);

  // ฟังก์ชันล้าง filter ทั้งหมด
  const clearAllFilters = () => {
    setFilterLeaveType('');
    setFilterMonth('');
    setFilterYear('');
    setFilterStatus('');
    setSingleDate(undefined);
    setPage(1);
  };

  // ฟังก์ชันตรวจสอบว่ามี filter ใช้งานอยู่หรือไม่
  const hasActiveFilters = () => {
    return filterLeaveType || filterMonth || filterYear || filterStatus || singleDate;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t('leave.approved')}
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            {t('history.pendingApproval')}
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            {t('leave.rejected')}
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    const tVacation = t('leaveTypes.vacation');
    const tSick = t('leaveTypes.sick');
    const tPersonal = t('leaveTypes.personal');
    const tEmergency = t('leaveTypes.emergency');
    const typeLower = (type || '').toLowerCase();
    if (type === tVacation || typeLower === 'vacation' || typeLower === 'ลาพักผ่อน') return "text-blue-600";
    if (type === tSick || typeLower === 'sick' || typeLower === 'ลาป่วย') return "text-red-600";
    if (type === tPersonal || typeLower === 'personal' || typeLower === 'ลากิจ') return "text-green-600";
    if (type === tEmergency || typeLower === 'emergency' || typeLower === 'ลาฉุกเฉิน') return "text-orange-500";
    return "text-gray-600";
  };

  // ฟังก์ชันแปลประเภทการลาให้ตรงกับภาษาที่เลือก
  const translateLeaveType = (type: string) => {
    const typeLower = (type || '').toLowerCase();
    // mapping: key = lower-case, value = i18n key
    const typeMap: Record<string, string> = {
      'vacation': 'leaveTypes.vacation',
      'ลาพักผ่อน': 'leaveTypes.vacation',
      'sick': 'leaveTypes.sick',
      'ลาป่วย': 'leaveTypes.sick',
      'personal': 'leaveTypes.personal',
      'ลากิจ': 'leaveTypes.personal',
      'emergency': 'leaveTypes.emergency',
      'ลาฉุกเฉิน': 'leaveTypes.emergency',
      'maternity': 'leaveTypes.maternity',
      'ลาคลอด': 'leaveTypes.maternity',
    };
    const i18nKey = typeMap[typeLower];
    if (i18nKey) return t(i18nKey);
    // fallback: try t(`leaveTypes.${typeLower}`) or raw type
    return t(`leaveTypes.${typeLower}`, type);
  };

  // ฟังก์ชันคำนวณชั่วโมงจากเวลาเริ่มและเวลาสิ้นสุด (string HH:mm)
  const calcHours = (start: string, end: string) => {
    if (!start || !end) return null;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    let diff = endMins - startMins;
    if (diff < 0) diff += 24 * 60; // ข้ามวัน
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    // แสดงเป็น ชั่วโมง.นาที (1.20)
    return `${hours}.${mins.toString().padStart(2, '0')}`;
  };
  // กำหนดหน่วยชั่วโมงตามภาษา
  const hourUnit = i18n.language === 'th' ? 'ชม' : 'Hours';

  // เพิ่มฟังก์ชันแปลงวันที่ตามภาษา
  const formatDateLocalized = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    if (i18n.language === 'th') {
      // แปลงปีเป็น พ.ศ.
      const buddhistYear = date.getFullYear() + 543;
      return `${date.getDate().toString().padStart(2, '0')} ${format(date, 'MMM', { locale: th })} ${buddhistYear}`;
    }
    // อังกฤษ: ใช้ year ปกติ
    return format(date, 'dd MMM yyyy');
  };

  // Calculate summary statistics from leaveHistory
  const totalLeaveDays = summary ? summary.totalLeaveDays : 0;
  const approvedCount = summary ? summary.approvedCount : 0;
  const pendingCount = summary ? summary.pendingCount : 0;
  const rejectedCount = summary && typeof summary.rejectedCount === 'number' ? summary.rejectedCount : 0;

  // รายชื่อเดือนรองรับ i18n
  const monthNames = i18n.language === 'th'
    ? ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // สร้างตัวเลือกเดือนและปีทั้งหมด
  const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const allYears = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  // เพิ่มฟังก์ชันนี้ด้านบน component
  const getLeaveTypeLabel = (typeId: string) => {
    const found = leaveTypes.find(lt => lt.id === typeId || lt.leave_type === typeId);
    if (!found) return typeId;
    return i18n.language.startsWith('th') ? found.leave_type_th : found.leave_type_en;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{t('leave.leaveHistory')}</h1>
            <p className="text-sm text-gray-600">
              {t('history.leaveHistoryTitle')}
            </p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="p-6 animate-fade-in">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalLeaveDays}</p>
                    <p className="text-sm text-muted-foreground">{t('history.totalLeaveDays')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{approvedCount}</p>
                    <p className="text-sm text-muted-foreground">{t('history.approvedRequests')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pendingCount}</p>
                    <p className="text-sm text-muted-foreground">{t('history.pendingRequests')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{rejectedCount}</p>
                    <p className="text-sm text-muted-foreground">{t('history.rejectedRequests')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Filter Section */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">{t('history.filters', 'ตัวกรอง')}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? t('history.hideFilters', 'ซ่อนตัวกรอง') : t('history.showFilters', 'แสดงตัวกรอง')}
                </Button>
              </div>
            </CardHeader>
            {showFilters && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Single Date Filter */}
                  <div className="space-y-2">
                    <Label>{t('history.singleDate', 'วันที่เดียว')}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-48 min-w-[180px] max-w-full justify-start text-left font-normal whitespace-nowrap"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {singleDate ? format(singleDate, "dd/MM/yyyy") : t('history.selectSingleDate', 'เลือกวันเดียว')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={singleDate}
                          onSelect={date => setSingleDate(date)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Leave Type Filter */}
                  <div className="space-y-2">
                    <Label>{t('leave.type', 'ประเภทการลา')}</Label>
                    <Select value={filterLeaveType || "all"} onValueChange={v => setFilterLeaveType(v === "all" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('leave.allTypes', 'ทั้งหมด')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('leave.allTypes', 'ทั้งหมด')}</SelectItem>
                        {leaveTypes.map((lt) => (
                          <SelectItem key={lt.id} value={lt.id}>
                            {i18n.language.startsWith('th') ? lt.leave_type_th : lt.leave_type_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label>{t('leave.status', 'สถานะ')}</Label>
                    <Select value={filterStatus || "all"} onValueChange={v => setFilterStatus(v === "all" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('history.allStatuses', 'ทั้งหมด')} />
                      </SelectTrigger>
                      <SelectContent>
                        {/* ใช้ i18n สำหรับ option ทั้งหมดและแต่ละสถานะ */}
                        <SelectItem value="all">{t('leave.statusAll')}</SelectItem>
                        {statusOptions.map(status => (
                          <SelectItem key={status} value={status}>{t(`leave.${status}`, status)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Month/Year Filter */}
                  <div className="space-y-2">
                    <Label>{t('history.monthYear', 'เดือน/ปี')}</Label>
                    <div className="flex gap-2">
                      <Select value={filterMonth ? filterMonth.toString() : "all"} onValueChange={v => setFilterMonth(v === "all" ? '' : Number(v))} disabled={!!singleDate}>
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder={t('history.month', 'เดือน')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('history.allMonths', 'ทุกเดือน')}</SelectItem>
                          {allMonths.map(m => (
                            <SelectItem key={m} value={m.toString()}>{monthNames[m-1]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={filterYear ? filterYear.toString() : "all"} onValueChange={v => setFilterYear(v === "all" ? '' : Number(v))} disabled={!!singleDate}>
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder={t('history.year', 'ปี')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('history.allYears', 'ทุกปี')}</SelectItem>
                          {allYears.map(y => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="flex items-center gap-2">
                    {hasActiveFilters() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        {t('history.clearAllFilters', 'ล้างตัวกรองทั้งหมด')}
                      </Button>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {leaveHistory.length} {t('history.results', 'ผลลัพธ์')}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Leave History List */}
          <div className="space-y-4">
            {loading ? null : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <>
                {leaveHistory.length === 0 && !loading && !error && (
                  <div className="w-full flex justify-center mt-10">
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-6 py-4 text-center shadow">
                      {t('history.noData', 'ไม่พบประวัติการลาในช่วงเวลาที่เลือก')}
                    </div>
                  </div>
                )}
                {leaveHistory.map((leave) => (
                  <Card
                    key={leave.id}
                    className="border border-gray-200 rounded-xl shadow-md hover:shadow-xl hover:border-blue-400 transition-shadow bg-white/90 p-6 mb-4"
                  >
                    <CardHeader className="pb-3 border-b border-gray-100 mb-2 bg-white/0 rounded-t-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`text-lg font-bold ${getTypeColor(leave.type)}`}>{getLeaveTypeLabel(leave.type)}</div>
                          {getStatusBadge(leave.status)}
                        </div>
                        <div className="text-sm text-gray-400 font-medium">
                          {formatDateLocalized(leave.submittedDate)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {/* ฝั่งซ้าย: วันที่และระยะเวลา */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <span className="font-semibold">{t('leave.startDate')}:</span>
                            <span>{formatDateLocalized(leave.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <span className="font-semibold">{t('leave.endDate')}:</span>
                            <span>{formatDateLocalized(leave.endDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-yellow-500" />
                            <span className="font-semibold">{t('leave.duration')}:</span>
                            <span>
                              {leave.startTime && leave.endTime
                                ? `${leave.startTime} - ${leave.endTime} (${calcHours(leave.startTime, leave.endTime)} ${hourUnit})`
                                : `${leave.days} ${t('leave.day')}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold">{t('leave.createdAt', 'Created')}:</span>
                            <span>{leave.submittedDate ? formatDateLocalized(leave.submittedDate) : '-'}</span>
                          </div>
                        </div>
                        {/* ฝั่งขวา: เหตุผล */}
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="font-semibold">{t('leave.reason')}:</span>
                            </div>
                            <p className={`text-gray-700 break-words mt-1 ${expandedReason === leave.id ? '' : 'line-clamp-2'}`}>
                              {leave.reason}
                            </p>
                            {leave.reason && leave.reason.length > 100 && (
                              <button
                                className="text-blue-500 ml-2 underline text-xs"
                                onClick={() => setExpandedReason(expandedReason === leave.id ? null : leave.id)}
                              >
                                {expandedReason === leave.id ? t('history.showLess') || 'Show less' : t('history.showMore') || 'Show more'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Approved by: และ Rejected by: แยกออกมาอยู่ล่างสุดของ Card */}
                      {leave.status === "approved" && leave.approvedBy && (
                        <div className="mt-6 border-t pt-4">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="font-semibold">{t('leave.approvedBy')}:</span>
                            <span>{leave.approvedBy}</span>
                          </div>
                        </div>
                      )}
                      {leave.status === "rejected" && leave.rejectedBy && (
                        <div className="mt-6 border-t pt-4">
                          <div className="flex items-center gap-2 text-sm">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="font-semibold">{t('leave.rejectedBy')}:</span>
                            <span>{leave.rejectedBy}</span>
                          </div>
                          {leave.rejectionReason && (
                            <div className="flex items-start gap-2 mt-2 text-sm">
                              <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                              <div>
                                <span className="font-semibold">{t('leave.rejectionReason')}:</span>
                                <p className={`text-gray-700 break-words mt-1 ${expandedReject === leave.id ? '' : 'line-clamp-2'}`}>
                                  {leave.rejectionReason}
                                </p>
                                {leave.rejectionReason.length > 100 && (
                                  <button
                                    className="text-blue-500 ml-2 underline text-xs"
                                    onClick={() => setExpandedReject(expandedReject === leave.id ? null : leave.id)}
                                  >
                                    {expandedReject === leave.id ? t('history.showLess') || 'Show less' : t('history.showMore') || 'Show more'}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex justify-end mt-6 gap-3">
                        <Button size="sm" variant="outline" onClick={() => handleViewDetails(leave.id)}>
                          {t('common.viewDetails')}
                        </Button>
                        {leave.status === "pending" && (() => {
                          // เช็คว่าวันนี้ < startDate แบบ UTC
                          const today = new Date();
                          today.setHours(0, 0, 0, 0); // ตัดเวลาออก
                          const startDate = leave.startDate ? new Date(leave.startDate) : null;
                          if (startDate) startDate.setHours(0, 0, 0, 0); // ตัดเวลาออก
                          if (startDate && today < startDate) {
                            return (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleEditLeave(leave.id)}>
                                  {t('common.edit')}
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive" onClick={() => setDeleteLeaveId(leave.id)}>
                                      {t('system.delete', 'Delete')}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{t('system.confirmDelete', 'Confirm Delete')}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {t('system.confirmDeleteLeave', 'Are you sure you want to delete this leave request?')}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel disabled={deleting}>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                                      <AlertDialogAction disabled={deleting} onClick={handleDeleteLeave}>
                                        {deleting ? t('common.loading', 'Loading...') : t('system.confirm', 'Confirm')}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {/* --- Pagination bar: always show, even if only 1 page --- */}
                <div className="flex flex-wrap justify-center mt-6 gap-2 items-center">
                  {/* --- Pagination with ellipsis --- */}
                  {(() => {
                    const pages = [];
                    const maxPageButtons = 5;
                    let start = Math.max(1, page - 2);
                    let end = Math.min(totalPages, start + maxPageButtons - 1);
                    if (end - start < maxPageButtons - 1) {
                      start = Math.max(1, end - maxPageButtons + 1);
                    }
                    if (start > 1) {
                      pages.push(
                        <button key={1} onClick={() => setPage(1)} className={`px-3 py-1 rounded border ${page === 1 ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'} transition`}>1</button>
                      );
                      if (start > 2) pages.push(<span key="start-ellipsis">...</span>);
                    }
                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <button key={i} onClick={() => setPage(i)} className={`px-3 py-1 rounded border ${page === i ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'} transition`} disabled={page === i}>{i}</button>
                      );
                    }
                    if (end < totalPages) {
                      if (end < totalPages - 1) pages.push(<span key="end-ellipsis">...</span>);
                      pages.push(
                        <button key={totalPages} onClick={() => setPage(totalPages)} className={`px-3 py-1 rounded border ${page === totalPages ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'} transition`}>{totalPages}</button>
                      );
                    }
                    return pages;
                  })()}
                  {/* --- Items per page select --- */}
                  <select
                    className="ml-4 border rounded px-2 py-1 text-sm"
                    value={limit}
                    onChange={e => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    {[5, 10, 20, 50].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <span className="ml-2 text-sm text-gray-500">{t('admin.itemsPerPage', 'Items per page')}</span>
                  <span className="ml-2 text-sm text-gray-500">{t('admin.pageInfo', `${page} of ${totalPages} pages`)} </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Dialog แสดงรายละเอียดใบลา */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('leave.detailTitle', 'รายละเอียดการลา')}</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 text-gray-700">
                {selectedLeave && (
                  <>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-6">
                      <div className="font-semibold flex items-center gap-2">
                        <span className="text-base">{t('leave.type', 'ประเภทการลา')}:</span>
                        <span className="text-blue-700 font-bold">{
  i18n.language === 'th'
    ? (selectedLeave.leaveTypeName || selectedLeave.leaveTypeEn || getLeaveTypeLabel(selectedLeave.type))
    : (selectedLeave.leaveTypeEn || selectedLeave.leaveTypeName || getLeaveTypeLabel(selectedLeave.type))
}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{t('leave.status', 'สถานะ')}:</span>
                        {getStatusBadge(selectedLeave.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="font-semibold">{t('leave.startDate')}:</span>
                        <span>{formatDateLocalized(selectedLeave.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="font-semibold">{t('leave.endDate')}:</span>
                        <span>{formatDateLocalized(selectedLeave.endDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold">{t('leave.duration')}:</span>
                        <span>{
  selectedLeave.duration ||
  selectedLeave.days ||
  (() => {
    if (selectedLeave.startDate && selectedLeave.endDate) {
      const start = new Date(String(selectedLeave.startDate)).getTime();
      const end = new Date(String(selectedLeave.endDate)).getTime();
      if (!isNaN(start) && !isNaN(end)) {
        return Math.abs((end - start) / (1000*60*60*24)) + 1;
      }
    }
    return '-';
  })()
} {selectedLeave.durationType ? (selectedLeave.durationType === 'hour' ? t('leave.hour', 'ชั่วโมง') : t('leave.day', 'วัน')) : t('leave.day', 'วัน')}</span>
                      </div>
                    </div>
                    <div className="border-t my-2" />
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-1" />
                      <div>
                        <span className="font-semibold">{t('leave.reason', 'เหตุผล')}:</span>
                        <span className="ml-2">{selectedLeave.reason}</span>
                      </div>
                    </div>
                    {selectedLeave.attachments && Array.isArray(selectedLeave.attachments) && selectedLeave.attachments.length > 0 && (
                      <div>
                        <div className="font-semibold mb-1 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          {t('leave.attachmentLabel', 'ไฟล์แนบ')}:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {selectedLeave.attachments.map((file: string, idx: number) => {
                            const isImage = /\.(jpg|jpeg|png|gif)$/i.test(file);
                            const isPdf = /\.(pdf)$/i.test(file);
                            const isDoc = /\.(doc|docx)$/i.test(file);
                            return (
                              <div key={idx} className="flex flex-col items-center border rounded-lg p-3 bg-gray-50 shadow-sm">
                                {isImage ? (
                                  <a href={`/leave-uploads/${file}`} target="_blank" rel="noopener noreferrer">
                                    <img src={`/leave-uploads/${file}`} alt={file} className="max-h-40 max-w-full rounded shadow mb-2 border" />
                                  </a>
                                ) : isPdf ? (
                                  <a href={`/leave-uploads/${file}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-red-600">
                                    <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24"><path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.828A2 2 0 0 0 19.414 7.414l-4.828-4.828A2 2 0 0 0 12.172 2H6zm6 1.414L18.586 10H14a2 2 0 0 1-2-2V3.414z"/></svg>
                                    <span className="text-xs mt-1">PDF</span>
                                  </a>
                                ) : isDoc ? (
                                  <a href={`/leave-uploads/${file}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-blue-700">
                                    <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24"><path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.828A2 2 0 0 0 19.414 7.414l-4.828-4.828A2 2 0 0 0 12.172 2H6zm6 1.414L18.586 10H14a2 2 0 0 1-2-2V3.414z"/></svg>
                                    <span className="text-xs mt-1">DOC</span>
                                  </a>
                                ) : (
                                  <a href={`/leave-uploads/${file}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">
                                    {file}
                                  </a>
                                )}
                                <span className="text-xs break-all mt-1 text-gray-700">{file}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div className="border-t my-2" />
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold">{t('leave.submittedDate', 'วันที่ส่งคำขอ')}:</span>
                      <span>{formatDateLocalized(selectedLeave.submittedDate)}</span>
                    </div>
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center mt-4">
            <Button onClick={() => setShowDetailDialog(false)}>{t('common.ok', 'ตกลง')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog แก้ไขใบลา */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl w-full rounded-xl shadow-2xl p-6 bg-white/95">
          <DialogHeader>
            <DialogTitle>{t('leave.editTitle', 'แก้ไขใบลา')}</DialogTitle>
          </DialogHeader>
          <LeaveForm
            initialData={editLeave}
            mode="edit"
            onSubmit={async (data) => {
              // เรียก API สำหรับอัปเดตใบลา
              const token = localStorage.getItem('token');
              // ใช้ FormData สำหรับแนบไฟล์ (รองรับทั้งกรณีมี/ไม่มีไฟล์ใหม่)
              const formData = new FormData();
              formData.append('leaveType', data.leaveType);
              if (data.personalLeaveType) formData.append('personalLeaveType', data.personalLeaveType);
              if (data.startDate) formData.append('startDate', data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate);
              if (data.endDate) formData.append('endDate', data.endDate instanceof Date ? data.endDate.toISOString() : data.endDate);
              if (data.startTime) formData.append('startTime', data.startTime);
              if (data.endTime) formData.append('endTime', data.endTime);
              if (data.reason) formData.append('reason', data.reason);
              if (data.supervisor) formData.append('supervisor', data.supervisor);
              if (data.contact) formData.append('contact', data.contact);
              if (data.employeeType) formData.append('employeeType', data.employeeType);
              // แนบไฟล์ใหม่ (File object เท่านั้น)
              if (data.attachments && Array.isArray(data.attachments)) {
                data.attachments.forEach((file) => {
                  if (file instanceof File) formData.append('attachments', file);
                });
              }
              // ส่ง API
              const res = await fetch(`/api/leave-request/${editLeave.id}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
              });
              if (res.ok) {
                setShowEditDialog(false);
                setEditLeave(null);
                setPage(1);
                toast({
                  title: t('leave.updateSuccess', 'อัปเดตใบลาสำเร็จ'),
                  description: t('leave.updateSuccessDesc', 'แก้ไขข้อมูลใบลาสำเร็จ'),
                  variant: 'default',
                  className: 'border-green-500 bg-green-50 text-green-900',
                });
                fetchLeaveHistory(); // รีเฟรชข้อมูลทันที ไม่ต้อง reload ทั้งหน้า
              } else {
                // handle error
              }
            }}
          />
          <DialogFooter className="flex justify-center mt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>{t('common.cancel', 'ยกเลิก')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveHistory;
