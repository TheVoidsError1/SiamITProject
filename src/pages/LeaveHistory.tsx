import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
import { useToast } from '@/hooks/use-toast';
import { format } from "date-fns";
import { AlertCircle, Calendar, CheckCircle, ChevronLeft, ChevronRight, Clock, FileText, Filter, History, Trash2, User, X, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from 'react-router-dom';
import { monthNames } from '../constants/common';
import { apiEndpoints, apiService, createAuthenticatedFileUrl } from '../lib/api';
import { formatDateLocalized } from '../lib/utils';

const LeaveHistory = () => {

  const { t, i18n } = useTranslation();

  const { toast } = useToast();

  const navigate = useNavigate();



  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // --- เพิ่ม state สำหรับ paging ---

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  // --- เพิ่ม state สำหรับ summary ---

  const [summary, setSummary] = useState<{ totalLeaveDays: number; totalLeaveHours: number; approvedCount: number; pendingCount: number; rejectedCount?: number; retroactiveCount?: number } | null>(null);

  // --- เพิ่ม state สำหรับ show more/less ---

  const [expandedReason, setExpandedReason] = useState<string | null>(null);

  const [expandedReject, setExpandedReject] = useState<string | null>(null);

  const [filterMonth, setFilterMonth] = useState<number | ''>('');

  const [filterYear, setFilterYear] = useState<number | ''>('');

  const [selectedLeave, setSelectedLeave] = useState<any | null>(null);

  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [showImagePreview, setShowImagePreview] = useState(false);

  // --- เพิ่ม state สำหรับ items per page ---

  const [limit, setLimit] = useState(5);

  const [filterLeaveType, setFilterLeaveType] = useState('');

  // --- เพิ่ม state สำหรับ leave types dropdown ---

  const [leaveTypes, setLeaveTypes] = useState<{ id: string; leave_type: string; leave_type_th: string; leave_type_en: string }[]>([]);

  const [leaveTypesLoading, setLeaveTypesLoading] = useState(false);

  const [leaveTypesError, setLeaveTypesError] = useState<string | null>(null);



  // --- เพิ่ม state สำหรับปฏิทินและ filter ใหม่ ---

  const [filterStatus, setFilterStatus] = useState('');

  const [filterRetroactive, setFilterRetroactive] = useState('');

  const [showFilters, setShowFilters] = useState(false);

  const [statusOptions, setStatusOptions] = useState<string[]>([]);

  const [yearOptions, setYearOptions] = useState<number[]>([]);

  const [monthOptions, setMonthOptions] = useState<number[]>([]);

  const [singleDate, setSingleDate] = useState<Date | undefined>(undefined);



  // --- เพิ่ม state สำหรับการลบ ---

  const [deleteLeaveId, setDeleteLeaveId] = useState<string | null>(null);

  const [deleting, setDeleting] = useState(false);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);



  const { showSessionExpiredDialog } = useAuth();



  // Calculate summary statistics from summary data (all pages)

  const totalLeaveDays = summary ? summary.totalLeaveDays : 0;

  const totalLeaveHours = summary ? summary.totalLeaveHours : 0;

  const approvedCount = summary ? summary.approvedCount : 0;

  const pendingCount = summary ? summary.pendingCount : 0;

  const rejectedCount = summary && typeof summary.rejectedCount === 'number' ? summary.rejectedCount : 0;

  const retroactiveCount = summary?.retroactiveCount || 0;

  // รายชื่อเดือนรองรับ i18n

  const currentMonthNames = monthNames[i18n.language === 'th' ? 'th' : 'en'];



  const fetchLeaveHistory = useCallback(async () => {

    setLoading(true);

    setError(null);

    try {

      let url = `${apiEndpoints.leaveHistory.list}?page=${page}&limit=${limit}`;

      if (filterLeaveType && filterLeaveType !== 'all') {

        url += `&leaveType=${filterLeaveType}`;

      }

      if (filterMonth !== '' && filterMonth !== null) {

        url += `&month=${filterMonth}`;

      }

      if (filterYear !== '' && filterYear !== null) {

        url += `&year=${filterYear}`;

      }

      if (filterStatus && filterStatus !== 'all') {

        url += `&status=${filterStatus}`;

      }

      if (filterRetroactive && filterRetroactive !== 'all') {

        url += `&retroactive=${filterRetroactive}`;

      }

      if (singleDate) {

        url += `&date=${format(singleDate, 'yyyy-MM-dd')}`;

      }

      // Use apiService.get

      const data = await apiService.get(url, undefined, showSessionExpiredDialog);

      if (data && data.status === "success") {

        setLeaveHistory(data.data);

        setTotalPages(data.totalPages || 1);

        setSummary(data.summary || null);

      } else {

        setError(data?.message || "Unknown error");

      }

    } catch (err: any) {

      setError(err.message || "Unknown error");

    } finally {

      setLoading(false);

    }

  }, [page, filterMonth, filterYear, limit, filterLeaveType, filterStatus, filterRetroactive, singleDate, showSessionExpiredDialog]);



  useEffect(() => {

    fetchLeaveHistory();

  }, [fetchLeaveHistory]);







  // เพิ่มฟังก์ชันใหม่สำหรับดึงรายละเอียดใบลาจาก backend

  const handleViewDetails = async (leaveId: string) => {

    const leaveData = leaveHistory.find(leave => leave.id === leaveId);

    if (leaveData) {

      setSelectedLeave(leaveData);

      setShowDetailDialog(true);

      return;

    }

    setSelectedLeave(null);

    setShowDetailDialog(true);

    try {

      const data = await apiService.get(apiEndpoints.leave.detail(leaveId), undefined, showSessionExpiredDialog);

      if (data && data.success) {

        const leaveDetail = {

          ...data.data,

          startDate: data.data.startDate || data.data.leaveDate || '-',

          submittedDate: data.data.createdAt || data.data.submittedDate || '-',

        };

        setSelectedLeave(leaveDetail);

      }

    } catch (e) {

      console.error('Error fetching leave detail:', e);

    }

  };



  // Fetch leave types and filter options from backend

  useEffect(() => {

    const fetchFilters = async () => {

      setLeaveTypesLoading(true);

      setLeaveTypesError(null);

      try {

        const data = await apiService.get(apiEndpoints.leaveHistory.filters, undefined, showSessionExpiredDialog);

        if (data && data.status === 'success') {

          setLeaveTypes(data.leaveTypes || []);

          setStatusOptions(data.statuses || []);

          setYearOptions(data.years || []);

          setMonthOptions(data.months || []);

        } else {

          setLeaveTypes([]);

          setLeaveTypesError(data?.message || 'Failed to fetch filter data');

        }

      } catch (err: any) {

        setLeaveTypes([]);

        setLeaveTypesError(err.message || 'Failed to fetch filter data');

      } finally {

        setLeaveTypesLoading(false);

      }

    };

    fetchFilters();

  }, [showSessionExpiredDialog]);



  // ฟังก์ชันล้าง filter ทั้งหมด

  const clearAllFilters = () => {

    setFilterLeaveType('');

    setFilterMonth('');

    setFilterYear('');

    setFilterStatus('');

    setFilterRetroactive('');

    setSingleDate(undefined);

    setPage(1);

  };



  // ฟังก์ชันตรวจสอบว่ามี filter ใช้งานอยู่หรือไม่

  const hasActiveFilters = () => {

    return filterLeaveType || filterMonth || filterYear || filterStatus || filterRetroactive || singleDate;

  };



  // ฟังก์ชันตรวจสอบว่าการลาเป็นย้อนหลังหรือไม่ (ใช้ข้อมูลจาก backend)

  const isRetroactiveLeave = (leave: any) => {

    // ใช้ข้อมูล backdated จาก backend

    return leave.backdated === true;

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



  // ฟังก์ชันสร้าง badge สำหรับการลาย้อนหลัง

  const getRetroactiveBadge = (leave: any) => {

    if (isRetroactiveLeave(leave)) {

      return (

        <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200 shadow-sm hover:shadow-md transition-all duration-200">

          <History className="w-3 h-3 mr-1" />

          {t('history.retroactiveLeave', 'การลาย้อนหลัง')}

        </Badge>

      );

    }

    return null;

  };







  const getTypeColor = (type: string) => {

    if (!type) return "text-gray-600";

    

    const typeLower = type.toLowerCase();

    

    // ตรวจสอบจาก backend data ก่อน

    const found = leaveTypes.find(lt => lt.id === type || lt.leave_type === type);

    if (found) {

      const typeKey = found.leave_type?.toLowerCase() || found.id?.toLowerCase();

      if (typeKey === 'vacation' || typeKey === 'ลาพักร้อน') return "text-blue-600";

      if (typeKey === 'sick' || typeKey === 'ลาป่วย') return "text-red-600";

      if (typeKey === 'personal' || typeKey === 'ลากิจ') return "text-green-600";

      if (typeKey === 'emergency' || typeKey === 'ลาฉุกเฉิน') return "text-orange-500";

      if (typeKey === 'maternity' || typeKey === 'ลาคลอด') return "text-purple-600";

    }

    

    // fallback: ตรวจสอบจาก i18n translation

    const tVacation = t('leaveTypes.Vacation');

    const tSick = t('leaveTypes.Sick');

    const tPersonal = t('leaveTypes.Personal');

    const tEmergency = t('leaveTypes.Emergency');

    const tMaternity = t('leaveTypes.Maternity');

    

    if (type === tVacation || typeLower === 'vacation' || type === 'ลาพักร้อน') return "text-blue-600";

    if (type === tSick || typeLower === 'sick' || type === 'ลาป่วย') return "text-red-600";

    if (type === tPersonal || typeLower === 'personal' || type === 'ลากิจ') return "text-green-600";

    if (type === tEmergency || typeLower === 'emergency' || type === 'ลาฉุกเฉิน') return "text-orange-500";

    if (type === tMaternity || typeLower === 'maternity' || type === 'ลาคลอด') return "text-purple-600";

    

    return "text-gray-600";

  };



  // ฟังก์ชันแปลประเภทการลาให้ตรงกับภาษาที่เลือก

  const translateLeaveType = (type: string) => {

    if (!type) return '';

    

    // ตรวจสอบว่ามีข้อมูลจาก backend หรือไม่

    const found = leaveTypes.find(lt => lt.id === type || lt.leave_type === type);

    if (found) {

      return i18n.language.startsWith('th') ? found.leave_type_th : found.leave_type_en;

    }

    

    // fallback: ใช้ i18n translation

    const typeLower = type.toLowerCase();

    const typeMap: Record<string, string> = {

      'vacation': 'leaveTypes.Vacation',

      'sick': 'leaveTypes.Sick',

      'personal': 'leaveTypes.Personal',

      'emergency': 'leaveTypes.Emergency',

      'maternity': 'leaveTypes.Maternity',

      'ลาพักร้อน': 'leaveTypes.Vacation',

      'ลาป่วย': 'leaveTypes.Sick',

      'ลากิจ': 'leaveTypes.Personal',

      'ลาฉุกเฉิน': 'leaveTypes.Emergency',

      'ลาคลอด': 'leaveTypes.Maternity',

    };

    

    const i18nKey = typeMap[typeLower] || typeMap[type];

    if (i18nKey) return t(i18nKey);

    

    // fallback: try direct translation หรือ return type เดิม

    return t(`leaveTypes.${type}`, type);

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



  // สร้างตัวเลือกเดือนและปีทั้งหมด

  const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);

  const currentYear = new Date().getFullYear();

  const allYears = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);



  // ฟังก์ชันสำหรับแสดงชื่อประเภทการลาจาก backend หรือ i18n

  const getLeaveTypeLabel = (typeId: string) => {

    if (!typeId) return '';

    

    // ตรวจสอบว่ามีข้อมูลจาก backend หรือไม่

    const found = leaveTypes.find(lt => lt.id === typeId || lt.leave_type === typeId);

    if (found) {

      return i18n.language.startsWith('th') ? found.leave_type_th : found.leave_type_en;

    }

    

    // fallback: ใช้ translateLeaveType function

    return translateLeaveType(typeId);

  };



  // เพิ่มฟังก์ชันการลบใบลา

  const handleDeleteLeave = (leaveId: string) => {

    setDeleteLeaveId(leaveId);

    setShowDeleteDialog(true);

  };



  const confirmDeleteLeave = async () => {

    if (!deleteLeaveId) return;

    setDeleting(true);

    try {

      const data = await apiService.delete(apiEndpoints.leave.delete(deleteLeaveId), undefined, showSessionExpiredDialog);

      if (data && (data.success || data.status === 'success')) {

        toast({

          title: t('system.deleteSuccess', 'ลบสำเร็จ'),

          description: t('system.deleteSuccessDesc', 'ลบใบลาสำเร็จ'),

          className: 'border-green-500 bg-green-50 text-green-900',

        });

        setDeleteLeaveId(null);

        setShowDeleteDialog(false);

        // Refresh ข้อมูลหลังจากลบสำเร็จ

        fetchLeaveHistory();

      } else {

        toast({

          title: t('system.deleteFailed', 'ลบไม่สำเร็จ'),

          description: data?.message || t('system.deleteFailedDesc', 'ไม่สามารถลบใบลาได้'),

          variant: 'destructive',

        });

      }

    } catch (e) {

      toast({

        title: t('system.deleteFailed', 'ลบไม่สำเร็จ'),

        description: t('system.deleteFailedDesc', 'ไม่สามารถลบใบลาได้'),

        variant: 'destructive',

      });

    } finally {

      setDeleting(false);

    }

  };



  return (

    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 page-transition">

      {/* Hero Section (replace old top bar) */}

      <div className="relative overflow-hidden">

        <div className="absolute inset-0 z-0">
          <svg viewBox="0 0 1440 200" className="w-full h-24 md:h-32 wave-animation" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="url(#waveGradient)" fillOpacity="1" d="M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,133.3C840,107,960,85,1080,101.3C1200,117,1320,171,1380,197.3L1440,224L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z" />
            <defs>
              <linearGradient id="waveGradient" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3b82f6" />
                <stop offset="1" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        {/* Sidebar Trigger */}
        <div className="absolute top-4 left-4 z-20">
          <SidebarTrigger className="bg-white/90 hover:bg-white text-blue-700 border border-blue-200 hover:border-blue-300 shadow-lg backdrop-blur-sm" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center py-6 md:py-10">

          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/90 to-white/70 shadow-xl border-4 border-white/50 backdrop-blur-sm flex items-center justify-center mb-4 animate-bounce-in">

            <img src="/lovable-uploads/siamit.png" alt="Logo" className="w-12 h-12 rounded-full" />

          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-indigo-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent drop-shadow mb-2 flex items-center gap-2 animate-fade-in-up">

            <History className="w-8 h-8 text-blue-600" />

            {t('leave.leaveHistory')}

          </h1>

          <p className="text-base md:text-lg text-blue-900/80 mb-2 font-medium text-center max-w-2xl leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>

            {t('history.leaveHistoryTitle')}

          </p>

          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mt-3 animate-scale-in" style={{ animationDelay: '0.4s' }}></div>

        </div>

      </div>

      <div className="p-4 md:p-6 animate-fade-in">

        <div className="max-w-6xl mx-auto space-y-8">

          {/* Summary Stats */}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">

            <Card className="border-0 shadow-lg bg-gradient-to-br from-white/90 via-blue-50/50 to-blue-100/30 backdrop-blur rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 transform hover:scale-105 animate-stagger-1 card-entrance">

              <CardContent className="p-5 flex items-center gap-4">

                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110">

                  <Calendar className="w-6 h-6 text-white transition-all duration-300" />

                </div>

                <div>

                  <p className="text-2xl font-bold text-blue-800 transition-all duration-300 group-hover:scale-110">{totalLeaveDays}</p>

                  <p className="text-sm text-blue-600 font-medium leading-tight">{t('history.totalLeaveDays')}</p>

                </div>

              </CardContent>

            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-white/90 via-indigo-50/50 to-indigo-100/30 backdrop-blur rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 transform hover:scale-105 animate-stagger-2 card-entrance">

              <CardContent className="p-5 flex items-center gap-4">

                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110">

                  <Clock className="w-6 h-6 text-white transition-all duration-300" />

                </div>

                <div>

                  <p className="text-2xl font-bold text-indigo-800 transition-all duration-300 group-hover:scale-110">{totalLeaveHours}</p>

                  <p className="text-sm text-indigo-600 font-medium leading-tight">{t('history.totalLeaveHours')}</p>

                </div>

              </CardContent>

            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-white/90 via-green-50/50 to-green-100/30 backdrop-blur rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 transform hover:scale-105 animate-stagger-3 card-entrance">

              <CardContent className="p-5 flex items-center gap-4">

                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110">

                  <CheckCircle className="w-6 h-6 text-white transition-all duration-300" />

                </div>

                <div>

                  <p className="text-2xl font-bold text-green-700 transition-all duration-300 group-hover:scale-110">{approvedCount}</p>

                  <p className="text-sm text-green-600 font-medium leading-tight">{t('history.approvedRequests')}</p>

                </div>

              </CardContent>

            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-white/90 via-yellow-50/50 to-yellow-100/30 backdrop-blur rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 transform hover:scale-105 animate-stagger-4 card-entrance">

              <CardContent className="p-5 flex items-center gap-4">

                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110">

                  <Clock className="w-6 h-6 text-white transition-all duration-300" />

                </div>

                <div>

                  <p className="text-2xl font-bold text-yellow-700 transition-all duration-300 group-hover:scale-110">{pendingCount}</p>

                  <p className="text-sm text-yellow-600 font-medium leading-tight">{t('history.pendingRequests')}</p>

                </div>

              </CardContent>

            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-white/90 via-red-50/50 to-red-100/30 backdrop-blur rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 transform hover:scale-105 animate-stagger-5 card-entrance">

              <CardContent className="p-5 flex items-center gap-4">

                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110">

                  <XCircle className="w-6 h-6 text-white transition-all duration-300" />

                </div>

                <div>

                  <p className="text-2xl font-bold text-red-700 transition-all duration-300 group-hover:scale-110">{rejectedCount}</p>

                  <p className="text-sm text-red-600 font-medium leading-tight">{t('history.rejectedRequests')}</p>

                </div>

              </CardContent>

            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-white/90 via-purple-50/50 to-purple-100/30 backdrop-blur rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 transform hover:scale-105 animate-stagger-6 card-entrance">

              <CardContent className="p-5 flex items-center gap-4">

                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110">

                  <History className="w-6 h-6 text-white transition-all duration-300" />

                </div>

                <div>

                  <p className="text-2xl font-bold text-purple-700 transition-all duration-300 group-hover:scale-110">{retroactiveCount}</p>

                  <p className="text-sm text-purple-600 font-medium leading-tight">{t('history.retroactiveLeave')}</p>

                </div>

              </CardContent>

            </Card>

          </div>



          {/* Enhanced Filter Section */}

          <Card className="border-0 shadow-lg bg-gradient-to-br from-white/90 via-blue-50/50 to-indigo-100/30 backdrop-blur-sm rounded-xl animate-fade-in-up filter-toggle">

            <CardHeader className="pb-4">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md transition-all duration-300 ${

                    showFilters ? 'scale-110' : 'scale-100'

                  }`}>

                    <Filter className={`w-5 h-5 text-white transition-all duration-300 ${

                      showFilters ? 'animate-pulse' : ''

                    }`} />

                  </div>

                  <div>

                    <h3 className="text-xl font-bold text-gray-800">{t('history.filters', 'ตัวกรอง')}</h3>

                    <p className="text-sm text-gray-600">{t('history.filterDesc', 'กรองข้อมูลตามเงื่อนไขที่ต้องการ')}</p>

                  </div>

                </div>

                <Button

                  variant="outline"

                  size="sm"

                  onClick={() => setShowFilters(!showFilters)}

                  className={`border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 rounded-lg px-4 py-2 font-medium transform hover:scale-105 btn-press hover-glow ${

                    showFilters ? 'bg-blue-50 border-blue-300 shadow-md' : ''

                  }`}

                >

                  {showFilters ? (

                    <>

                      <X className="w-4 h-4 mr-2" />

                      {t('history.hideFilters', 'ซ่อนตัวกรอง')}

                    </>

                  ) : (

                    <>

                      <Filter className="w-4 h-4 mr-2" />

                      {t('history.showFilters', 'แสดงตัวกรอง')}

                    </>

                  )}

                </Button>

              </div>

            </CardHeader>

            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${

              showFilters ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0'

            }`}>

              <CardContent className="space-y-6 animate-slide-down filter-toggle">

                {/* Filter Grid */}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">

                  {/* Single Date Filter */}

                  <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>

                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">

                      <Calendar className="w-4 h-4 text-blue-600" />

                      {t('history.singleDate', 'เฉพาะวัน')}

                    </Label>

                    <Popover>

                      <PopoverTrigger asChild>

                        <Button

                          variant="outline"

                          className="w-full justify-start text-left font-normal bg-white/80 backdrop-blur border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 rounded-lg h-11 text-sm"

                        >

                          <Calendar className="mr-2 h-4 w-4 text-blue-600" />

                          {singleDate ? format(singleDate, "dd/MM/yyyy") : t('history.selectSingleDate', 'เลือกวันเดียว')}

                        </Button>

                      </PopoverTrigger>

                      <PopoverContent className="w-auto p-0 border-0 shadow-xl rounded-xl" align="start">

                        <CalendarComponent

                          mode="single"

                          selected={singleDate}

                          onSelect={date => setSingleDate(date)}

                          className="rounded-xl"

                        />

                      </PopoverContent>

                    </Popover>

                  </div>



                  {/* Leave Type Filter */}

                  <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>

                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">

                      <FileText className="w-4 h-4 text-green-600" />

                      {t('leave.type', 'ประเภทการลา')}

                    </Label>

                    <Select value={filterLeaveType || "all"} onValueChange={v => setFilterLeaveType(v === "all" ? "" : v)} disabled={leaveTypesLoading}>

                      <SelectTrigger className="bg-white/80 backdrop-blur border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-200 rounded-lg h-11 text-sm">

                        <SelectValue placeholder={

                          leaveTypesLoading 

                            ? t('common.loading', 'กำลังโหลด...') 

                            : leaveTypesError 

                              ? t('common.error', 'เกิดข้อผิดพลาด') 

                              : t('leaveTypes.all', 'ทั้งหมด')

                        } />

                      </SelectTrigger>

                      <SelectContent className="border-0 shadow-xl rounded-xl">

                        <SelectItem value="all" className="rounded-lg transition-all duration-200 hover:bg-blue-50 hover:scale-105">

                          {t('leaveTypes.all', 'ทั้งหมด')}

                        </SelectItem>

                        {leaveTypesLoading ? (

                          <SelectItem value="loading" disabled className="rounded-lg">

                            <div className="flex items-center gap-2">

                              <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>

                              {t('common.loading', 'กำลังโหลด...')}

                            </div>

                          </SelectItem>

                        ) : leaveTypesError ? (

                          <SelectItem value="error" disabled className="rounded-lg text-red-600">

                            <div className="flex items-center gap-2">

                              <XCircle className="w-4 h-4" />

                              {t('common.error', 'เกิดข้อผิดพลาด')}

                            </div>

                          </SelectItem>

                        ) : (

                          leaveTypes.map((lt) => (

                            <SelectItem key={lt.id} value={lt.id} className="rounded-lg transition-all duration-200 hover:bg-blue-50 hover:scale-105">

                              {i18n.language.startsWith('th') ? lt.leave_type_th : lt.leave_type_en}

                            </SelectItem>

                          ))

                        )}

                      </SelectContent>

                    </Select>

                    {leaveTypesError && (

                      <p className="text-xs text-red-600 mt-1">{leaveTypesError}</p>

                    )}

                  </div>



                  {/* Status Filter */}

                  <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>

                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">

                      <AlertCircle className="w-4 h-4 text-yellow-600" />

                      {t('leave.status', 'สถานะ')}

                    </Label>

                    <Select value={filterStatus || "all"} onValueChange={v => setFilterStatus(v === "all" ? "" : v)}>

                      <SelectTrigger className="bg-white/80 backdrop-blur border-yellow-200 hover:bg-yellow-50 hover:border-yellow-300 transition-all duration-200 rounded-lg h-11 text-sm">

                        <SelectValue placeholder={t('history.allStatuses', 'ทั้งหมด')} />

                      </SelectTrigger>

                      <SelectContent className="border-0 shadow-xl rounded-xl">

                        <SelectItem value="all" className="rounded-lg transition-all duration-200 hover:bg-blue-50 hover:scale-105">{t('leave.statusAll', 'ทุกสถานะ')}</SelectItem>

                        {statusOptions.map(status => (

                          <SelectItem key={status} value={status} className="rounded-lg transition-all duration-200 hover:bg-blue-50 hover:scale-105">

                            {t(`leave.${status}`, status)}

                          </SelectItem>

                        ))}

                      </SelectContent>

                    </Select>

                  </div>



                  {/* Retroactive Leave Filter - ปรับปรุงให้ใช้งานได้จริง */}

                  <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>

                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">

                      <History className="w-4 h-4 text-purple-600" />

                      {t('history.retroactiveLeave', 'การลาย้อนหลัง')}

                    </Label>

                    <Select value={filterRetroactive || "all"} onValueChange={v => setFilterRetroactive(v === "all" ? "" : v)}>

                      <SelectTrigger className="bg-white/80 backdrop-blur border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 rounded-lg h-11 text-sm">

                        <SelectValue placeholder={t('history.allTypes', 'ทั้งหมด')} />

                      </SelectTrigger>

                      <SelectContent className="border-0 shadow-xl rounded-xl">

                        <SelectItem value="all" className="rounded-lg transition-all duration-200 hover:bg-blue-50 hover:scale-105">

                          <div className="flex items-center gap-2">

                            <div className="w-3 h-3 rounded-full bg-gray-400"></div>

                            {t('history.allTypes', 'ทั้งหมด')}

                          </div>

                        </SelectItem>

                        <SelectItem value="normal" className="rounded-lg transition-all duration-200 hover:bg-blue-50 hover:scale-105">

                          <div className="flex items-center gap-2">

                            <div className="w-3 h-3 rounded-full bg-green-500"></div>

                            <CheckCircle className="w-4 h-4 text-green-600" />

                            {t('history.normalLeave', 'การลาปกติ')}

                          </div>

                        </SelectItem>

                        <SelectItem value="retroactive" className="rounded-lg transition-all duration-200 hover:bg-blue-50 hover:scale-105">

                          <div className="flex items-center gap-2">

                            <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></div>

                            <History className="w-4 h-4 text-purple-600" />

                            {t('history.retroactiveLeave', 'การลาย้อนหลัง')}

                          </div>

                        </SelectItem>

                      </SelectContent>

                    </Select>

                  </div>



                  {/* Month/Year Filter */}

                  <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>

                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">

                      <Clock className="w-4 h-4 text-indigo-600" />

                      {t('history.monthYear', 'เดือน/ปี')}

                    </Label>

                    <div className="flex gap-2">

                      <Select value={filterMonth ? filterMonth.toString() : "all"} onValueChange={v => setFilterMonth(v === "all" ? '' : Number(v))} disabled={!!singleDate}>

                        <SelectTrigger className="w-20 bg-white/80 backdrop-blur border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 rounded-lg h-11 text-sm">

                          <SelectValue placeholder={t('history.month', 'เดือน')} />

                        </SelectTrigger>

                        <SelectContent className="border-0 shadow-xl rounded-xl">

                          <SelectItem value="all" className="rounded-lg transition-all duration-200 hover:bg-blue-50 hover:scale-105">{t('history.allMonths', 'ทุกเดือน')}</SelectItem>

                          {allMonths.map(m => (

                            <SelectItem key={m} value={m.toString()} className="rounded-lg transition-all duration-200 hover:bg-blue-50 hover:scale-105">{currentMonthNames[m-1]}</SelectItem>

                          ))}

                        </SelectContent>

                      </Select>

                      <Select value={filterYear ? filterYear.toString() : "all"} onValueChange={v => setFilterYear(v === "all" ? '' : Number(v))} disabled={!!singleDate}>

                        <SelectTrigger className="w-20 bg-white/80 backdrop-blur border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 rounded-lg h-11 text-sm">

                          <SelectValue placeholder={t('history.year', 'ปี')} />

                        </SelectTrigger>

                        <SelectContent className="border-0 shadow-xl rounded-xl">

                          <SelectItem value="all" className="rounded-lg transition-all duration-200 hover:bg-blue-50 hover:scale-105">{t('history.allYears', 'ทุกปี')}</SelectItem>

                          {allYears.map(y => (

                            <SelectItem key={y} value={y.toString()} className="rounded-lg transition-all duration-200 hover:bg-blue-50 hover:scale-105">{y}</SelectItem>

                          ))}

                        </SelectContent>

                      </Select>

                    </div>

                  </div>

                </div>



                {/* Filter Actions */}

                <div className="flex justify-between items-center pt-4 border-t border-gray-200 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>

                  <div className="flex items-center gap-3">

                    {hasActiveFilters() && (

                      <Button

                        variant="outline"

                        size="sm"

                        onClick={clearAllFilters}

                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-300 rounded-lg px-4 py-2 font-medium transform hover:scale-105 hover:shadow-md btn-press hover-glow"

                      >

                        <X className="w-4 h-4 mr-2" />

                        {t('history.clearAllFilters', 'ล้างตัวกรองทั้งหมด')}

                      </Button>

                    )}

                    {hasActiveFilters() && (

                      <div className="flex items-center gap-2 text-sm text-gray-600">

                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>

                        {filterRetroactive === 'retroactive' ? (

                          <span className="flex items-center gap-1">

                            <History className="w-4 h-4 text-purple-600" />

                            {t('history.showingRetroactive', 'แสดงเฉพาะการลาย้อนหลัง')}

                          </span>

                        ) : filterRetroactive === 'normal' ? (

                          <span className="flex items-center gap-1">

                            <CheckCircle className="w-4 h-4 text-green-600" />

                            {t('history.showingNormal', 'แสดงเฉพาะการลาปกติ')}

                          </span>

                        ) : (

                          t('history.activeFilters', 'มีตัวกรองที่ใช้งานอยู่')

                        )}

                      </div>

                    )}

                  </div>

                  <div className="flex items-center gap-3">

                    <div className="text-sm text-gray-600">

                      {leaveHistory.length} {t('history.results', 'ผลลัพธ์')}

                    </div>

                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">

                      {leaveHistory.length}

                    </div>

                  </div>

                </div>

              </CardContent>

            </div>

          </Card>



          {/* Leave History List */}

          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>

            {loading ? (

              <div className="flex justify-center items-center py-12 animate-fade-in">

                <div className="text-center">

                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3 loading-pulse"></div>

                  <p className="text-base font-medium text-blue-600 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>{t('common.loading', 'กำลังโหลด...')}</p>

                  <p className="text-xs text-gray-500 mt-1 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>{t('history.loadingData', 'กำลังดึงข้อมูลประวัติการลา')}</p>

                </div>

              </div>

            ) : error ? (

              <div className="flex justify-center items-center py-12 animate-fade-in">

                <div className="text-center">

                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce-in">

                    <XCircle className="w-6 h-6 text-red-500" />

                  </div>

                  <p className="text-base font-medium text-red-600 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>{t('common.error', 'เกิดข้อผิดพลาด')}</p>

                  <p className="text-xs text-gray-500 mt-1 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>{error}</p>

                </div>

              </div>

            ) : leaveHistory.length === 0 ? (

              <div className="flex justify-center items-center py-12 animate-fade-in">

                <div className="text-center">

                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce-in">

                    <FileText className="w-6 h-6 text-gray-400" />

                  </div>

                  <p className="text-base font-medium text-gray-600 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>{t('history.noLeaveHistory', 'ไม่พบประวัติการลา')}</p>

                  <p className="text-xs text-gray-500 mt-1 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>{t('history.noLeaveHistoryDesc', 'ยังไม่มีประวัติการลาในระบบ')}</p>

                </div>

              </div>

            ) : leaveHistory.length === 0 ? (

              <div className="flex justify-center items-center py-12 animate-fade-in">

                <div className="text-center">

                  <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg animate-bounce-in">

                    <Filter className="w-6 h-6 text-gray-500" />

                  </div>

                  <p className="text-base font-medium text-gray-700 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>{t('history.noResultsForFilter', 'ไม่พบผลลัพธ์สำหรับตัวกรองที่เลือก')}</p>

                  <p className="text-xs text-gray-500 mt-1 mb-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>{t('history.tryDifferentFilter', 'ลองเปลี่ยนตัวกรองหรือล้างตัวกรองทั้งหมด')}</p>

                  <Button

                    variant="outline"

                    size="sm"

                    onClick={clearAllFilters}

                    className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 rounded-lg px-3 py-1.5 font-medium btn-press hover-glow animate-fade-in-up"

                    style={{ animationDelay: '0.6s' }}

                  >

                    <X className="w-3 h-3 mr-1" />

                    {t('history.clearAllFilters', 'ล้างตัวกรองทั้งหมด')}

                  </Button>

                </div>

              </div>

            ) : (

              leaveHistory.map((leave, index) => (

                <Card 

                  key={leave.id} 

                  className="border-0 shadow-lg bg-white/90 backdrop-blur rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 transform hover:scale-[1.02] hover-lift card-entrance"

                  style={{ animationDelay: `${index * 0.1}s` }}

                >

                  <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                    <div className="flex items-center gap-4">

                      <div className={`text-xl font-bold ${getTypeColor(leave.leaveTypeName_th || leave.leaveTypeName_en || leave.type)}`}>

                        {getLeaveTypeLabel(leave.type) || leave.leaveTypeName_th || leave.leaveTypeName_en || translateLeaveType(leave.type)}

                      </div>

                      <div className="flex flex-wrap gap-2">

                        {getStatusBadge(leave.status)}

                        {getRetroactiveBadge(leave)}

                      </div>

                    </div>

                    <div className="text-sm text-blue-400 font-medium md:text-right">

                      {formatDateLocalized(leave.submittedDate, i18n.language)}

                    </div>

                  </CardHeader>

                  <CardContent className="pt-0 pb-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      <div className="space-y-3">

                        <div className="flex items-center gap-3 text-base text-blue-900">

                          <Calendar className="w-5 h-5 text-blue-400" />

                          <span className="font-medium">{t('leave.startDate')}:</span>

                          <span>{formatDateLocalized(leave.startDate, i18n.language)}</span>

                        </div>

                        <div className="flex items-center gap-3 text-base text-blue-900">

                          <Calendar className="w-5 h-5 text-blue-400" />

                          <span className="font-medium">{t('leave.endDate')}:</span>

                          <span>{formatDateLocalized(leave.endDate, i18n.language)}</span>

                        </div>

                        {/* แสดงระยะเวลาตามประเภทการลา */}

                        {leave.startTime && leave.endTime ? (

                          // ถ้ามีเวลาเริ่มและสิ้นสุด แสดงเป็นชั่วโมง

                          <div className="space-y-2">

                            <div className="flex items-center gap-3 text-base text-blue-900">

                              <Clock className="w-5 h-5 text-blue-400" />

                              <span className="font-medium">{t('leave.duration')}:</span>

                              <span>{calcHours(leave.startTime, leave.endTime)} {hourUnit}</span>

                            </div>

                            <div className="flex items-center gap-3 text-sm text-blue-700">

                              <Clock className="w-4 h-4 text-blue-400" />

                              <span className="font-medium">{t('leave.startTime')}:</span>

                              <span>{leave.startTime}</span>

                              <span className="mx-1">-</span>

                              <span className="font-medium">{t('leave.endTime')}:</span>

                              <span>{leave.endTime}</span>

                            </div>

                          </div>

                        ) : (

                          // ถ้าไม่มีเวลา แสดงเป็นวัน

                          <div className="flex items-center gap-3 text-base text-blue-900">

                            <Clock className="w-5 h-5 text-blue-400" />

                            <span className="font-medium">{t('leave.duration')}:</span>

                            <span>{leave.days} {t('history.days')}</span>

                          </div>

                        )}

                        {isRetroactiveLeave(leave) && (

                          <div className="flex items-center gap-3 text-base text-purple-700">

                          </div>

                        )}



                      </div>

                      <div className="space-y-3">

                        <div className="flex items-start gap-3 text-base text-blue-900">

                          <FileText className="w-5 h-5 text-blue-400 mt-0.5" />

                          <div>

                            <span className="font-medium">{t('leave.reason')}:</span>

                            <p className="text-blue-500 text-sm">{leave.reason}</p>

                          </div>

                        </div>

                        {/* Approved by: และ Rejected by: แยกออกมาอยู่ล่างสุดของ Card */}

                        {leave.status === "approved" && leave.approvedBy && (

                          <div className="flex items-center gap-3 text-base text-green-700">

                            <CheckCircle className="w-5 h-5 text-green-500" />

                            <span className="font-medium">{t('leave.approvedBy')}:</span>

                            <span>{leave.approvedBy && !/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/.test(leave.approvedBy) ? leave.approvedBy : '-'}</span>

                          </div>

                        )}

                        {leave.status === "rejected" && (

                          <div className="space-y-4">

                            <div className="space-y-2">

                              <Label className="text-sm font-medium text-gray-600">{t('leave.rejectedBy')}</Label>

                              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">

                                <XCircle className="w-4 h-4 text-red-500" />

                                <span className="font-medium text-red-900 text-sm">{leave.rejectedBy || '-'}</span>

                              </div>

                            </div>

                            {leave.rejectionReason && (

                              <div className="space-y-2">

                                <Label className="text-sm font-medium text-gray-600">{t('leave.rejectionReason')}</Label>

                                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">

                                  <FileText className="w-4 h-4 text-red-500 mt-0.5" />

                                  <span className="text-red-900 leading-relaxed text-sm">{leave.rejectionReason}</span>

                                </div>

                              </div>

                            )}

                          </div>

                        )}

                        <div className="flex justify-end mt-6 gap-2">

                          <Button 

                            size="sm" 

                            variant="outline" 

                            onClick={() => handleViewDetails(leave.id)}

                            className="transition-all duration-300 transform hover:scale-105 hover:shadow-md hover:bg-blue-50 hover:border-blue-300 btn-press hover-glow text-sm px-4 py-2"

                          >

                            {t('common.viewDetails')}

                          </Button>

                          <AlertDialog open={showDeleteDialog && deleteLeaveId === leave.id} onOpenChange={setShowDeleteDialog}>

                            <AlertDialogTrigger asChild>

                              <Button 

                                size="sm" 

                                variant="destructive" 

                                onClick={() => handleDeleteLeave(leave.id)}

                                className="transition-all duration-300 transform hover:scale-105 hover:shadow-md btn-press hover-glow text-sm px-4 py-2"

                              >

                                <Trash2 className="w-4 h-4 mr-1" />

                                {t('common.delete')}

                              </Button>

                            </AlertDialogTrigger>

                            <AlertDialogContent>

                              <AlertDialogHeader>

                                <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>

                                <AlertDialogDescription>

                                  {t('leave.deleteConfirmMessage', 'คุณต้องการลบใบลานี้หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้')}

                                </AlertDialogDescription>

                              </AlertDialogHeader>

                              <AlertDialogFooter>

                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>

                                <AlertDialogAction 

                                  onClick={confirmDeleteLeave}

                                  disabled={deleting}

                                  className="bg-red-600 hover:bg-red-700"

                                >

                                  {deleting ? t('common.deleting', 'กำลังลบ...') : t('common.delete')}

                                </AlertDialogAction>

                              </AlertDialogFooter>

                            </AlertDialogContent>

                          </AlertDialog>

                        </div>

                      </div>

                    </div>

                  </CardContent>

                </Card>

              ))

            )}

            {/* Enhanced Pagination */}

            {(totalPages >= 1 || leaveHistory.length > 0) && (

              <div className="flex flex-col sm:flex-row justify-center items-center mt-8 gap-4 p-6 bg-gradient-to-r from-white/90 via-blue-50/30 to-indigo-50/30 backdrop-blur rounded-xl border border-blue-100 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>

                {/* Pagination Info */}

                <div className="flex items-center gap-4 text-sm text-gray-600">

                  <div className="flex items-center gap-2">

                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>

                    <span>{t('history.pageInfo', { page: page || 1, totalPages: totalPages || 1 })}</span>

                  </div>

                  <div className="w-px h-4 bg-gray-300"></div>

                  <div className="flex items-center gap-2">

                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>

                    <span>{leaveHistory.length} {t('history.results')}</span>

                  </div>

                </div>



                {/* Pagination Controls */}

                {totalPages > 1 && (

                  <div className="flex items-center gap-2">

                    {/* Previous Button */}

                    <Button

                      variant="outline"

                      size="sm"

                      onClick={() => setPage(Math.max(1, page - 1))}

                      disabled={page === 1}

                      className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 rounded-lg px-3 py-2 transform hover:scale-105 hover:shadow-md btn-press"

                    >

                      <ChevronLeft className="w-4 h-4" />

                    </Button>



                    {/* Page Numbers */}

                    <div className="flex items-center gap-1">

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

                            <Button

                              key={1}

                              variant={page === 1 ? "default" : "outline"}

                              size="sm"

                              onClick={() => setPage(1)}

                              className={`rounded-lg px-3 py-2 transition-all duration-300 transform hover:scale-105 hover:shadow-md ${page === 1 ? 'bg-blue-600 text-white' : 'border-blue-200 text-blue-700 hover:bg-blue-50'}`}

                            >

                              1

                            </Button>

                          );

                          if (start > 2) pages.push(

                            <span key="start-ellipsis" className="px-2 text-gray-400">...</span>

                          );

                        }

                        for (let i = start; i <= end; i++) {

                          pages.push(

                            <Button

                              key={i}

                              variant={page === i ? "default" : "outline"}

                              size="sm"

                              onClick={() => setPage(i)}

                              className={`rounded-lg px-3 py-2 transition-all duration-300 transform hover:scale-105 hover:shadow-md ${page === i ? 'bg-blue-600 text-white' : 'border-blue-200 text-blue-700 hover:bg-blue-50'}`}

                            >

                              {i}

                            </Button>

                          );

                        }

                        if (end < totalPages) {

                          if (end < totalPages - 1) pages.push(

                            <span key="end-ellipsis" className="px-2 text-gray-400">...</span>

                          );

                          pages.push(

                            <Button

                              key={totalPages}

                              variant={page === totalPages ? "default" : "outline"}

                              size="sm"

                              onClick={() => setPage(totalPages)}

                              className={`rounded-lg px-3 py-2 transition-all duration-300 transform hover:scale-105 hover:shadow-md ${page === totalPages ? 'bg-blue-600 text-white' : 'border-blue-200 text-blue-700 hover:bg-blue-50'}`}

                            >

                              {totalPages}

                            </Button>

                          );

                        }

                        return pages;

                      })()}

                    </div>



                    {/* Next Button */}

                    <Button

                      variant="outline"

                      size="sm"

                      onClick={() => setPage(Math.min(totalPages, page + 1))}

                      disabled={page === totalPages}

                      className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 rounded-lg px-3 py-2 transform hover:scale-105 hover:shadow-md btn-press"

                    >

                      <ChevronRight className="w-4 h-4" />

                    </Button>

                  </div>

                )}



                {/* Items per page select */}

                <div className="flex items-center gap-2">

                  <Select

                    value={limit.toString()}

                    onValueChange={(value) => {

                      setLimit(Number(value));

                      setPage(1);

                    }}

                  >

                    <SelectTrigger className="w-20 bg-white/90 backdrop-blur border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 rounded-lg h-9 transform hover:scale-105 hover:shadow-md">

                      <SelectValue />

                    </SelectTrigger>

                    <SelectContent className="border-0 shadow-xl rounded-xl">

                      {[5, 10, 20, 50].map(n => (

                        <SelectItem key={n} value={n.toString()} className="rounded-lg transition-all duration-200 hover:bg-blue-50 hover:scale-105">{n}</SelectItem>

                      ))}

                    </SelectContent>

                  </Select>

                  <span className="text-sm text-gray-600">{t('admin.itemsPerPage', 'รายการต่อหน้า')}</span>

                </div>

              </div>

            )}

          </div>

        </div>

      </div>

      {/* Detail Dialog */}

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>

        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">

          <DialogHeader>

            <DialogTitle>

              {t('common.viewDetails')}

            </DialogTitle>

            <DialogDescription>

              {t('leave.detailDescription', 'Detailed information about this leave request.')}

            </DialogDescription>

          </DialogHeader>

          

          {selectedLeave && (

            <div className="space-y-6">

              {/* Header Section */}

              <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">

                <CardContent className="p-6">

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-4">

                      <div className={`text-3xl font-bold ${getTypeColor(selectedLeave.leaveTypeName_th || selectedLeave.leaveTypeName_en || selectedLeave.type)}`}>

                        {getLeaveTypeLabel(selectedLeave.type) || selectedLeave.leaveTypeName_th || selectedLeave.leaveTypeName_en || translateLeaveType(selectedLeave.type)}

                      </div>

                    </div>

                    <div className="text-right">

                      <div className="text-sm text-gray-500">{t('history.submittedOn')}</div>

                      <div className="text-lg font-semibold text-blue-600">

                        {formatDateLocalized(selectedLeave.submittedDate || selectedLeave.createdAt, i18n.language)}

                      </div>

                    </div>

                  </div>

                  {/* Status badges moved here */}

                  <div className="flex flex-wrap gap-2 mt-4">

                    {getStatusBadge(selectedLeave.status)}

                    {getRetroactiveBadge(selectedLeave)}

                  </div>

                </CardContent>

              </Card>



              {/* Main Information Grid */}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left Column - Basic Info */}

                <Card className="border-0 shadow-md">

                  <CardHeader className="pb-3">

                    <div className="flex items-center gap-2">

                      <Calendar className="w-5 h-5 text-blue-600" />

                      <h3 className="text-lg font-semibold">{t('history.dateInformation')}</h3>

                    </div>

                  </CardHeader>

                  <CardContent className="space-y-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      <div className="space-y-2">

                        <Label className="text-sm font-medium text-gray-600">{t('leave.startDate')}</Label>

                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">

                          <Calendar className="w-4 h-4 text-blue-500" />

                          <span className="font-medium text-blue-900">

                            {formatDateLocalized(selectedLeave.startDate, i18n.language)}

                          </span>

                        </div>

                      </div>

                      <div className="space-y-2">

                        <Label className="text-sm font-medium text-gray-600">{t('leave.endDate')}</Label>

                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">

                          <Calendar className="w-4 h-4 text-blue-500" />

                          <span className="font-medium text-blue-900">

                            {formatDateLocalized(selectedLeave.endDate, i18n.language)}

                          </span>

                        </div>

                      </div>

                    </div>

                    {/* แสดงระยะเวลาตามประเภทการลา */}

                    {selectedLeave.startTime && selectedLeave.endTime ? (

                      // ถ้ามีเวลาเริ่มและสิ้นสุด แสดงเป็นชั่วโมง

                      <div className="space-y-4">

                        <div className="space-y-2">

                          <Label className="text-sm font-medium text-gray-600">{t('leave.duration')}</Label>

                          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">

                            <Clock className="w-4 h-4 text-blue-500" />

                            <span className="font-medium text-blue-900">

                              {calcHours(selectedLeave.startTime, selectedLeave.endTime)} {hourUnit}

                            </span>

                          </div>

                        </div>

                        <div className="space-y-2">

                          <Label className="text-sm font-medium text-gray-600">{t('history.leaveTime')}</Label>

                          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">

                            <Clock className="w-4 h-4 text-blue-500" />

                            <span className="font-medium text-blue-900">

                              {selectedLeave.startTime} - {selectedLeave.endTime}

                            </span>

                          </div>

                        </div>

                      </div>

                    ) : (

                      // ถ้าไม่มีเวลา แสดงเป็นวัน

                      <div className="space-y-2">

                        <Label className="text-sm font-medium text-gray-600">{t('leave.duration')}</Label>

                        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">

                          <Clock className="w-4 h-4 text-green-500" />

                          <span className="font-medium text-green-900">

                            {selectedLeave.days || 1} {t('history.days')}

                          </span>

                        </div>

                      </div>

                    )}

                    {isRetroactiveLeave(selectedLeave) && (

                      <div className="space-y-2">

                        <Label className="text-sm font-medium text-purple-600">{t('history.retroactiveLeave')}</Label>

                        <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">

                          <History className="w-4 h-4 text-purple-500" />

                          <span className="text-purple-700">{t('history.retroactiveLeave')}</span>

                        </div>

                      </div>

                    )}

                  </CardContent>

                </Card>



                {/* Right Column - Status & Approval */}

                <Card className="border-0 shadow-md">

                  <CardHeader className="pb-3">

                    <div className="flex items-center gap-2">

                      <CheckCircle className="w-5 h-5 text-green-600" />

                      <h3 className="text-lg font-semibold">{t('history.statusAndApproval')}</h3>

                    </div>

                  </CardHeader>

                  <CardContent className="space-y-4">

                    <div className="space-y-2">

                      <Label className="text-sm font-medium text-gray-600">{t('leave.status')}</Label>

                      <div className="flex items-center gap-2">

                        {getStatusBadge(selectedLeave.status)}

                      </div>

                    </div>

                    

                    {selectedLeave.status === "approved" && selectedLeave.name && (

                      <div className="space-y-2">

                        <Label className="text-sm font-medium text-gray-600">{t('leave.approvedBy')}</Label>

                        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">

                          <CheckCircle className="w-4 h-4 text-green-500" />

                          <span className="font-medium text-green-900">{selectedLeave.name}</span>

                        </div>

                      </div>

                    )}

                    

                    {selectedLeave.status === "rejected" && (

                      <div className="space-y-4">

                        <div className="space-y-2">

                          <Label className="text-sm font-medium text-gray-600">{t('leave.rejectedBy')}</Label>

                          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">

                            <XCircle className="w-4 h-4 text-red-500" />

                            <span className="font-medium text-red-900">{selectedLeave.rejectedBy || '-'}</span>

                          </div>

                        </div>

                        {selectedLeave.rejectionReason && (

                          <div className="space-y-2">

                            <Label className="text-sm font-medium text-gray-600">{t('leave.rejectionReason')}</Label>

                            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">

                              <FileText className="w-4 h-4 text-red-500 mt-0.5" />

                              <span className="text-red-900 leading-relaxed">{selectedLeave.rejectionReason}</span>

                            </div>

                          </div>

                        )}

                      </div>

                    )}

                  </CardContent>

                </Card>

              </div>



              {/* Reason Section */}

              <Card className="border-0 shadow-md">

                <CardHeader className="pb-3">

                  <div className="flex items-center gap-2">

                    <FileText className="w-5 h-5 text-orange-600" />

                    <h3 className="text-lg font-semibold">{t('leave.reason')}</h3>

                  </div>

                </CardHeader>

                <CardContent>

                  <div className="p-4 bg-orange-50 rounded-lg">

                    <p className="text-orange-900 leading-relaxed">

                      {selectedLeave.reason || t('history.noReasonProvided')}

                    </p>

                  </div>

                </CardContent>

              </Card>



              {/* Contact Information */}

              {selectedLeave.contact && (

                <Card className="border-0 shadow-md">

                  <CardHeader className="pb-3">

                    <div className="flex items-center gap-2">

                      <User className="w-5 h-5 text-teal-600" />

                      <h3 className="text-lg font-semibold">{t('history.contactInformation')}</h3>

                    </div>

                  </CardHeader>

                  <CardContent>

                    <div className="p-4 bg-teal-50 rounded-lg">

                      <p className="text-teal-900 font-medium">{selectedLeave.contact}</p>

                    </div>

                  </CardContent>

                </Card>

              )}



              {/* Attachments Section */}

              {selectedLeave.attachments && Array.isArray(selectedLeave.attachments) && selectedLeave.attachments.length > 0 && (

                <Card className="border-0 shadow-md">

                  <CardHeader className="pb-3">

                    <div className="flex items-center gap-2">

                      <FileText className="w-5 h-5 text-indigo-600" />

                      <h3 className="text-lg font-semibold">{t('leave.attachments')}</h3>

                      <Badge variant="secondary" className="ml-2">

                        {selectedLeave.attachments.length} {t('leave.files')}

                      </Badge>

                    </div>

                  </CardHeader>

                  <CardContent>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                      {selectedLeave.attachments.map((attachment: string, index: number) => {

                        const fileName = attachment.split('/').pop() || attachment;

                        const fileExtension = fileName.split('.').pop()?.toLowerCase();

                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(fileExtension || '');

                        const isPDF = fileExtension === 'pdf';

                        const isDocument = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(fileExtension || '');

                        

                        // Construct the correct file path - always prepend /leave-uploads/ if not already present

                        const filePath = attachment.startsWith('/leave-uploads/') ? attachment : `/leave-uploads/${attachment}`;

                        const authenticatedFilePath = createAuthenticatedFileUrl(filePath);

                        

                        return (

                          <div key={index} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-all duration-300 hover:shadow-md">

                            {isImage ? (

                              <div className="space-y-3">

                                <div className="relative group cursor-pointer" onClick={() => {

                                  setSelectedImage(authenticatedFilePath);

                                  setShowImagePreview(true);

                                }}>

                                  <img 

                                    src={authenticatedFilePath} 

                                    alt={fileName}

                                    className="w-full h-32 object-cover rounded-lg border transition-all duration-300 group-hover:scale-105"

                                    onError={(e) => {

                                      const target = e.target as HTMLImageElement;

                                      target.style.display = 'none';

                                    }}

                                  />

                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center">

                                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300">

                                      <FileText className="w-8 h-8 text-white" />

                                    </div>

                                  </div>

                                </div>

                                <div className="flex items-center justify-between">

                                  <span className="text-sm text-gray-600 truncate flex-1 mr-2">{fileName}</span>

                                  <div className="flex gap-1">

                                    <Button 

                                      size="sm" 

                                      variant="outline"

                                      onClick={() => {

                                        setSelectedImage(authenticatedFilePath);

                                        setShowImagePreview(true);

                                      }}

                                      className="text-xs px-2 py-1"

                                    >

                                      {t('common.view')}

                                    </Button>

                                    <Button 

                                      size="sm" 

                                      variant="outline"

                                      onClick={() => {

                                        const link = document.createElement('a');

                                        link.href = authenticatedFilePath;

                                        link.download = fileName;

                                        link.click();

                                      }}

                                      className="text-xs px-2 py-1"

                                    >

                                      {t('common.download')}

                                    </Button>

                                  </div>

                                </div>

                              </div>

                            ) : (

                              <div className="space-y-3">

                                <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">

                                  {isPDF ? (

                                    <FileText className="w-8 h-8 text-red-500" />

                                  ) : isDocument ? (

                                    <FileText className="w-8 h-8 text-blue-500" />

                                  ) : (

                                    <FileText className="w-8 h-8 text-gray-400" />

                                  )}

                                </div>

                                <div className="flex items-center justify-between">

                                  <span className="text-sm text-gray-600 truncate flex-1 mr-2">{fileName}</span>

                                  <div className="flex gap-1">

                                    <Button 

                                      size="sm" 

                                      variant="outline"

                                      onClick={() => window.open(authenticatedFilePath, '_blank')}

                                      className="text-xs px-2 py-1"

                                    >

                                      {t('common.view')}

                                    </Button>

                                    <Button 

                                      size="sm" 

                                      variant="outline"

                                      onClick={() => {

                                        const link = document.createElement('a');

                                        link.href = authenticatedFilePath;

                                        link.download = fileName;

                                        link.click();

                                      }}

                                      className="text-xs px-2 py-1"

                                    >

                                      {t('common.download')}

                                    </Button>

                                  </div>

                                </div>

                              </div>

                            )}

                          </div>

                        );

                      })}

                    </div>

                  </CardContent>

                </Card>

              )}





            </div>

          )}

          

          <DialogFooter className="pt-6 border-t">

            <Button variant="outline" onClick={() => setShowDetailDialog(false)} className="btn-press hover-glow">

              {t('common.close')}

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>



      {/* Image Preview Dialog */}

      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>

        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-black/95">

          <DialogHeader className="absolute top-4 right-4 z-10">

            <DialogTitle className="sr-only">Image Preview</DialogTitle>

            <Button

              variant="outline"

              size="sm"

              onClick={() => setShowImagePreview(false)}

              className="bg-white/20 text-white border-white/30 hover:bg-white/30"

            >

              <X className="w-4 h-4" />

            </Button>

          </DialogHeader>

          

          {selectedImage && (

            <div className="flex items-center justify-center h-full p-4">

              <img 

                src={selectedImage} 

                alt="Preview"

                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"

                onError={(e) => {

                  const target = e.target as HTMLImageElement;

                  target.style.display = 'none';

                }}

              />

            </div>

          )}

        </DialogContent>

      </Dialog>



      <style>{`

        .glass-card-history {

          background: rgba(255,255,255,0.8);

          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.10);

          backdrop-filter: blur(12px);

          -webkit-backdrop-filter: blur(12px);

          border-radius: 2rem;

          border: 1px solid rgba(255,255,255,0.18);

        }



        @keyframes slide-down {

          from {

            opacity: 0;

            transform: translateY(-20px);

          }

          to {

            opacity: 1;

            transform: translateY(0);

          }

        }



        @keyframes fade-in-up {

          from {

            opacity: 0;

            transform: translateY(30px);

          }

          to {

            opacity: 1;

            transform: translateY(0);

          }

        }



        @keyframes fade-in {

          from {

            opacity: 0;

          }

          to {

            opacity: 1;

          }

        }



        @keyframes scale-in {

          from {

            opacity: 0;

            transform: scale(0.95);

          }

          to {

            opacity: 1;

            transform: scale(1);

          }

        }



        @keyframes slide-in-left {

          from {

            opacity: 0;

            transform: translateX(-30px);

          }

          to {

            opacity: 1;

            transform: translateX(0);

          }

        }



        @keyframes slide-in-right {

          from {

            opacity: 0;

            transform: translateX(30px);

          }

          to {

            opacity: 1;

            transform: translateX(0);

          }

        }



        @keyframes bounce-in {

          0% {

            opacity: 0;

            transform: scale(0.3);

          }

          50% {

            opacity: 1;

            transform: scale(1.05);

          }

          70% {

            transform: scale(0.9);

          }

          100% {

            opacity: 1;

            transform: scale(1);

          }

        }



        @keyframes float {

          0%, 100% {

            transform: translateY(0px);

          }

          50% {

            transform: translateY(-10px);

          }

        }



        @keyframes shimmer {

          0% {

            background-position: -200px 0;

          }

          100% {

            background-position: calc(200px + 100%) 0;

          }

        }



        @keyframes gradient-shift {

          0% {

            background-position: 0% 50%;

          }

          50% {

            background-position: 100% 50%;

          }

          100% {

            background-position: 0% 50%;

          }

        }



        .animate-slide-down {

          animation: slide-down 0.5s ease-out forwards;

        }



        .animate-fade-in-up {

          animation: fade-in-up 0.6s ease-out forwards;

          opacity: 0;

        }



        .animate-fade-in {

          animation: fade-in 0.8s ease-out forwards;

        }



        .animate-scale-in {

          animation: scale-in 0.6s ease-out forwards;

        }



        .animate-slide-in-left {

          animation: slide-in-left 0.7s ease-out forwards;

        }



        .animate-slide-in-right {

          animation: slide-in-right 0.7s ease-out forwards;

        }



        .animate-bounce-in {

          animation: bounce-in 0.8s ease-out forwards;

        }



        .animate-float {

          animation: float 3s ease-in-out infinite;

        }



        .animate-shimmer {

          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);

          background-size: 200px 100%;

          animation: shimmer 2s infinite;

        }



        .animate-gradient-shift {

          background-size: 200% 200%;

          animation: gradient-shift 3s ease infinite;

        }



        .animate-fade-in-up:nth-child(1) { animation-delay: 0.1s; }

        .animate-fade-in-up:nth-child(2) { animation-delay: 0.2s; }

        .animate-fade-in-up:nth-child(3) { animation-delay: 0.3s; }

        .animate-fade-in-up:nth-child(4) { animation-delay: 0.4s; }

        .animate-fade-in-up:nth-child(5) { animation-delay: 0.5s; }

        .animate-fade-in-up:nth-child(6) { animation-delay: 0.6s; }



        /* Stagger animation for cards */

        .animate-stagger-1 { animation-delay: 0.1s; }

        .animate-stagger-2 { animation-delay: 0.2s; }

        .animate-stagger-3 { animation-delay: 0.3s; }

        .animate-stagger-4 { animation-delay: 0.4s; }

        .animate-stagger-5 { animation-delay: 0.5s; }



        /* Hover effects */

        .hover-lift {

          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        }



        .hover-lift:hover {

          transform: translateY(-8px);

          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);

        }



        .hover-glow {

          transition: all 0.3s ease;

        }



        .hover-glow:hover {

          box-shadow: 0 0 30px rgba(59, 130, 246, 0.3);

        }



        /* Loading animation */

        .loading-pulse {

          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

        }



        @keyframes pulse {

          0%, 100% {

            opacity: 1;

          }

          50% {

            opacity: 0.5;

          }

        }



        /* Wave animation for hero section */

        .wave-animation {

          animation: wave 6s ease-in-out infinite;

        }



        @keyframes wave {

          0%, 100% {

            transform: translateY(0);

          }

          50% {

            transform: translateY(-10px);

          }

        }



        /* Card entrance animation */

        .card-entrance {

          animation: cardEntrance 0.8s ease-out forwards;

          opacity: 0;

          transform: translateY(20px);

        }



        @keyframes cardEntrance {

          to {

            opacity: 1;

            transform: translateY(0);

          }

        }



        /* Filter toggle animation */

        .filter-toggle {

          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);

        }



        /* Button press animation */

        .btn-press {

          transition: transform 0.1s ease;

        }



        .btn-press:active {

          transform: scale(0.95);

        }



        /* Smooth page transitions */

        .page-transition {

          animation: pageTransition 0.6s ease-out forwards;

        }



        @keyframes pageTransition {

          from {

            opacity: 0;

            transform: translateY(20px);

          }

          to {

            opacity: 1;

            transform: translateY(0);

          }

        }

      `}</style>

    </div>

  );

};



export default LeaveHistory;