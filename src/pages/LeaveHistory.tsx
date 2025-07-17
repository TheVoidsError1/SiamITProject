import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, FileText, CheckCircle, XCircle, AlertCircle, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LeaveHistory = () => {
  const { t, i18n } = useTranslation();
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

  useEffect(() => {
    const fetchLeaveHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          showSessionExpiredDialog();
          return;
        }
        // --- ส่ง page, limit, month, year, leaveType ไป backend ---
        let url = `/api/leave-history?page=${page}&limit=${limit}`;
        if (filterLeaveType) url += `&leaveType=${filterLeaveType}`;
        if (filterMonth) url += `&month=${filterMonth}`;
        if (filterYear) url += `&year=${filterYear}`;
        if (filterStatus) url += `&status=${filterStatus}`;
        // --- เงื่อนไขใหม่: ถ้าเลือก singleDate ให้ filter ด้วย createdAt (date param) ---
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
          setSummary(data.summary || null); // <-- set summary
        } else {
          setError(data.message || "Unknown error");
        }
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaveHistory();
  }, [page, filterMonth, filterYear, limit, filterLeaveType, filterStatus, singleDate]);

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
    const date = new Date(dateStr);
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
                        <SelectItem value="all">{t('history.allStatuses', 'ทั้งหมด')}</SelectItem>
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
                      <div className="flex justify-end mt-4">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedLeave(leave); setShowDetailDialog(true); }}>
                          {t('common.viewDetails')}
                        </Button>
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
            <DialogDescription>
              {selectedLeave && (
                <div className="space-y-2 text-gray-700">
                  <div><b>{t('leave.type')}:</b> {getLeaveTypeLabel(selectedLeave.type)}</div>
                  <div><b>{t('leave.status')}:</b> {getStatusBadge(selectedLeave.status)}</div>
                  <div><b>{t('leave.startDate')}:</b> {formatDateLocalized(selectedLeave.startDate)}</div>
                  <div><b>{t('leave.endDate')}:</b> {formatDateLocalized(selectedLeave.endDate)}</div>
                  {selectedLeave.startTime && selectedLeave.endTime && (
                    <div><b>{t('leave.leaveTime')}:</b> {selectedLeave.startTime} - {selectedLeave.endTime} ({calcHours(selectedLeave.startTime, selectedLeave.endTime)} {hourUnit})</div>
                  )}
                  <div><b>{t('leave.duration')}:</b> {selectedLeave.days} {t('leave.day')}</div>
                  <div><b>{t('leave.reason')}:</b> {selectedLeave.reason}</div>
                  {selectedLeave.approvedBy && (
                    <div><b>{t('leave.approvedBy')}:</b> {selectedLeave.approvedBy}</div>
                  )}
                  {selectedLeave.rejectedBy && (
                    <div><b>{t('leave.rejectedBy')}:</b> {selectedLeave.rejectedBy}</div>
                  )}
                  {selectedLeave.rejectionReason && (
                    <div><b>{t('leave.rejectionReason')}:</b> {selectedLeave.rejectionReason}</div>
                  )}
                  <div><b>{t('leave.submittedDate')}:</b> {formatDateLocalized(selectedLeave.submittedDate)}</div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center mt-4">
            <Button onClick={() => setShowDetailDialog(false)}>{t('common.ok')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveHistory;
