import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { differenceInCalendarDays, format } from "date-fns";
import { th } from "date-fns/locale";
import { AlertCircle, CheckCircle, Clock, Eye, FileText, Users, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type LeaveRequest = {
  id: number;
  Repid: string; // หรือ user_id
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  createdAt?: string;
  // เพิ่ม field อื่นๆ ตามที่ backend ส่งมา
};

// --- เพิ่ม helper สำหรับ clamp ข้อความ ---
const clampLines = 3;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user, showSessionExpiredDialog } = useAuth();

  // ลบ state ที่ไม่ได้ใช้จริง
  // const [adminName, setAdminName] = useState<string>("");
  // const [userCount, setUserCount] = useState<number>(0);
  // const [approvedThisMonth, setApprovedThisMonth] = useState<number>(0);
  // const [pendingCount, setPendingCount] = useState<number>(0);
  // const [averageDayOff, setAverageDayOff] = useState<number>(0);

  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  // --- เพิ่ม state สำหรับ paging ---
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingTotalPages, setPendingTotalPages] = useState(1);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [historyRequests, setHistoryRequests] = useState<any[]>([]);
  // --- เพิ่ม state สำหรับ paging ---
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingRequest, setRejectingRequest] = useState<any | null>(null);
  const [dashboardStats, setDashboardStats] = useState<{
    pendingCount: number;
    approvedCount: number;
    userCount: number;
    averageDayOff: number;
    rejectedCount?: number;
  }>({
    pendingCount: 0,
    approvedCount: 0,
    userCount: 0,
    averageDayOff: 0,
  });
  const [departments, setDepartments] = useState<{ id: string; department_name_th: string; department_name_en: string }[]>([]);
  const [positions, setPositions] = useState<{ id: string; position_name_th: string; position_name_en: string }[]>([]);
  // --- เพิ่ม state สำหรับ filter เดือน/ปี (ใช้ filter จริง) ---
  const [filterMonth, setFilterMonth] = useState<number | ''>('');
  const [filterYear, setFilterYear] = useState<number | ''>('');
  // --- เพิ่ม state สำหรับ items per page ---
  const [historyLimit, setHistoryLimit] = useState(5);
  const [pendingLimit, setPendingLimit] = useState(5);
  const [pendingLeaveTypes, setPendingLeaveTypes] = useState<{ id: string; leave_type: string; leave_type_th: string; leave_type_en: string }[]>([]);
  const [pendingLeaveTypesLoading, setPendingLeaveTypesLoading] = useState(false);
  const [pendingLeaveTypesError, setPendingLeaveTypesError] = useState<string | null>(null);
  const [pendingFilterLeaveType, setPendingFilterLeaveType] = useState('');
  // --- state สำหรับ filter สถานะ ---
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all'); // default เป็น all (All status)
  // --- เพิ่ม state สำหรับ show more/less ของแต่ละ request ---
  const [expandedRejection, setExpandedRejection] = useState<{ [id: string]: boolean }>({});
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approvingRequest, setApprovingRequest] = useState<any | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [pendingDateRange, setPendingDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  // 1. เพิ่ม state
  const [pendingSingleDate, setPendingSingleDate] = useState<Date | undefined>(undefined);
  const [recentSingleDate, setRecentSingleDate] = useState<Date | undefined>(undefined);
  // --- เพิ่ม state สำหรับ filter ย้อนหลัง ---
  const [pendingBackdatedFilter, setPendingBackdatedFilter] = useState('all'); // all | backdated | normal
  const [historyBackdatedFilter, setHistoryBackdatedFilter] = useState('all'); // all | backdated | normal
  const [historyFilterLeaveType, setHistoryFilterLeaveType] = useState('');

  // --- เพิ่ม state สำหรับ pending filter (Recent History) ---
  const [pendingFilterMonth, setPendingFilterMonth] = useState(filterMonth);
  const [pendingFilterYear, setPendingFilterYear] = useState(filterYear);
  const [pendingHistoryStatusFilter, setPendingHistoryStatusFilter] = useState(historyStatusFilter);
  const [pendingHistoryFilterLeaveType, setPendingHistoryFilterLeaveType] = useState(historyFilterLeaveType);
  const [pendingRecentSingleDate, setPendingRecentSingleDate] = useState(recentSingleDate);
  const [pendingHistoryBackdatedFilter, setPendingHistoryBackdatedFilter] = useState(historyBackdatedFilter);

  // --- เพิ่ม state สำหรับ pending filter (Pending Tab) ---
  const [pendingPendingFilterLeaveType, setPendingPendingFilterLeaveType] = useState(pendingFilterLeaveType);
  const [pendingPendingDateRange, setPendingPendingDateRange] = useState(pendingDateRange);
  const [pendingPendingSingleDate, setPendingPendingSingleDate] = useState(pendingSingleDate);
  const [pendingPendingBackdatedFilter, setPendingPendingBackdatedFilter] = useState(pendingBackdatedFilter);
  const [pendingPendingPage, setPendingPendingPage] = useState(pendingPage);
  // เพิ่ม state สำหรับ month/year
  const [pendingPendingMonth, setPendingPendingMonth] = useState<number | ''>('');
  const [pendingPendingYear, setPendingPendingYear] = useState<number | ''>('');

  // ปรับการคำนวณสถิติให้ใช้ข้อมูลจาก leave request ที่ดึงมา
  const pendingCount = pendingRequests.length;
  const approvedThisMonth = recentRequests.filter(r => {
    const now = new Date();
    const approvedDate = r.approvedTime ? new Date(r.approvedTime) : null;
    return approvedDate && approvedDate.getMonth() === now.getMonth() && approvedDate.getFullYear() === now.getFullYear();
  }).length;
  // สมมุติว่าพนักงานทั้งหมดคือ user ที่มีใน leave request
  const userCount = Array.from(new Set([...pendingRequests, ...recentRequests].map(r => r.user?.id))).length;
  // วันลาเฉลี่ย (ถ้ามีข้อมูล)
  const averageDayOff = recentRequests.length > 0 ?
    (
      recentRequests.reduce((sum, r) => {
        const start = r.startDate ? new Date(r.startDate) : null;
        const end = r.endDate ? new Date(r.endDate) : null;
        if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
          return sum + ((end.getTime() - start.getTime()) / (1000*60*60*24) + 1);
        }
        return sum;
      }, 0) / recentRequests.length
    ).toFixed(1)
    : 0;

  const stats = [
    {
      title: t('admin.pendingRequests'),
      value: dashboardStats.pendingCount.toString(),
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: t('admin.allapproved'),
      value: approvedCount.toString(), // ใช้ค่าที่อัปเดตตาม filter
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: t('admin.rejected'),
      value: rejectedCount.toString(), // ใช้ค่าที่อัปเดตตาม filter
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: t('admin.totalEmployees'),
      value: dashboardStats.userCount.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
  ];

  // --- เพิ่มฟังก์ชันแปลงวันที่ตามภาษา ---
  const formatDateLocalized = (dateStr: string) => {
    const date = new Date(dateStr);
    // แปลงเป็นเวลาท้องถิ่นไทย
    if (i18n.language === 'th') {
      const buddhistYear = date.getFullYear() + 543;
      const time = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${date.getDate().toString().padStart(2, '0')} ${format(date, 'MMM', { locale: th })} ${buddhistYear}, ${time}`;
    }
    // ภาษาอื่น
    return format(date, 'dd MMM yyyy, HH:mm');
  };

  // --- เพิ่มฟังก์ชันแปลงวันที่แบบไม่มีเวลา ---
  const formatDateOnly = (dateStr: string) => {
    const date = new Date(dateStr);
    if (i18n.language === 'th') {
      const buddhistYear = date.getFullYear() + 543;
      return `${date.getDate().toString().padStart(2, '0')} ${format(date, 'MMM', { locale: th })} ${buddhistYear}`;
    }
    return format(date, 'dd MMM yyyy');
  };

  // --- เพิ่มฟังก์ชันคำนวณชั่วโมง ---
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
    return `${hours}.${mins.toString().padStart(2, '0')}`;
  };
  const hourUnit = i18n.language === 'th' ? 'ชม' : 'Hours';

  const handleApprove = (id: string, employeeName: string) => {
    setApprovingRequest({ id, employeeName });
    setShowApproveDialog(true);
  };

  const confirmApprove = () => {
    if (!approvingRequest) return;
    const token = localStorage.getItem('token');
    if (!token) {
      toast({ title: "ไม่พบ token", description: "กรุณาเข้าสู่ระบบใหม่", variant: "destructive" });
      return;
    }
    const approverName = localStorage.getItem('user_name');
    fetch(`${API_BASE_URL}/api/leave-request/${approvingRequest.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'approved', statusby: approverName }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          toast({ title: t('admin.approveSuccess'), description: `${t('admin.approveSuccessDesc')} ${approvingRequest.employeeName}` });
          setPendingRequests(prev => prev.filter(r => r.id !== approvingRequest.id));
          fetchHistoryRequests();
          refreshLeaveRequests();
        } else {
          toast({ title: t('admin.rejectError'), description: data.message, variant: "destructive" });
        }
      })
      .finally(() => {
        setShowApproveDialog(false);
        setApprovingRequest(null);
      });
  };

  const handleReject = (id: string, employeeName: string) => {
    setRejectingRequest({ id, employeeName });
    setRejectReason("");
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    if (!rejectingRequest) return;
    const token = localStorage.getItem('token');
    if (!token) {
      toast({ title: "ไม่พบ token", description: "กรุณาเข้าสู่ระบบใหม่", variant: "destructive" });
      return;
    }
    fetch(`${API_BASE_URL}/api/leave-request/${rejectingRequest.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'rejected', rejectedReason: rejectReason }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          toast({ title: t('admin.rejectSuccess'), description: `${t('admin.rejectSuccessDesc')} ${rejectingRequest.employeeName}`, variant: "destructive" });
          setPendingRequests(prev => prev.filter(r => r.id !== rejectingRequest.id));
          fetchHistoryRequests();
          refreshLeaveRequests(); // <-- เพิ่มบรรทัดนี้
        } else {
          toast({ title: t('admin.rejectError'), description: data.message, variant: "destructive" });
        }
      })
      .finally(() => {
        setShowRejectDialog(false);
        setRejectingRequest(null);
        setRejectReason("");
      });
  };

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setShowDetailDialog(true);
  };

  // เพิ่มฟังก์ชันสำหรับรีเฟรชข้อมูล
  const refreshLeaveRequests = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      showSessionExpiredDialog();
      return;
    }
    fetch(`${API_BASE_URL}/api/leave-request/pending`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setPendingRequests(data.data);
          setError(""); // clear error
        } else {
          setPendingRequests([]);
          setError(""); // ไม่ต้องแสดง error
        }
      })
      .catch(() => {
        setPendingRequests([]);
        setError(""); // ไม่ต้องแสดง error
      })
      .finally(() => setLoading(false));
  };

  // ปรับ fetchHistoryRequests
  const fetchHistoryRequests = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      showSessionExpiredDialog();
      return;
    }
    let url = `${API_BASE_URL}/api/leave-request/history?page=${historyPage}&limit=${historyLimit}`;
    if (filterMonth) url += `&month=${filterMonth}`;
    if (filterYear) url += `&year=${filterYear}`;
    // ในการสร้าง url ให้ส่ง status=approved,rejected ถ้าเลือก all
    if (historyStatusFilter === 'all') {
      url += `&status=approved,rejected,backdated`;
    } else if (historyStatusFilter !== 'all') {
      url += `&status=${historyStatusFilter}`;
    }
    if (historyBackdatedFilter === 'backdated') url += `&backdated=1`;
    else if (historyBackdatedFilter === 'normal') url += `&backdated=0`;
    if (recentSingleDate) {
      url += `&date=${format(recentSingleDate, 'yyyy-MM-dd')}`;
    } else {
      if (dateRange.from) url += `&startDate=${format(dateRange.from, 'yyyy-MM-dd')}`;
      if (dateRange.to) url += `&endDate=${format(dateRange.to, 'yyyy-MM-dd')}`;
    }
    if (historyFilterLeaveType) url += `&leaveType=${historyFilterLeaveType}`;
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) {
          showSessionExpiredDialog();
          return;
        }
        return res.json();
      })
      .then(data => {
        if (data.status === "success") {
          let filtered = data.data;
          // เรียงลำดับตาม createdAt จากใหม่ไปเก่า (ล่าสุดขึ้นก่อน)
          filtered = filtered.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
          setHistoryRequests(filtered);
          setHistoryTotalPages(data.totalPages || 1);
          setApprovedCount(data.approvedCount || 0);
          setRejectedCount(data.rejectedCount || 0);
        } else {
          setHistoryRequests([]);
          setHistoryTotalPages(1);
          setApprovedCount(0);
          setRejectedCount(0);
        }
      })
      .catch(() => {
        setHistoryRequests([]);
        setHistoryTotalPages(1);
        setApprovedCount(0);
        setRejectedCount(0);
      })
      .finally(() => setLoading(false));
  };

  // โหลด leave request ที่ pending จาก API
  useEffect(() => {
    const fetchPending = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          showSessionExpiredDialog();
          return;
        }
        let url = `${API_BASE_URL}/api/leave-request/pending?page=${pendingPage}&limit=${pendingLimit}`;
        if (pendingFilterLeaveType) url += `&leaveType=${pendingFilterLeaveType}`;
        if (pendingBackdatedFilter === 'backdated') url += `&backdated=1`;
        else if (pendingBackdatedFilter === 'normal') url += `&backdated=0`;
        if (pendingSingleDate) {
          url += `&date=${format(pendingSingleDate, 'yyyy-MM-dd')}`;
        } else {
          if (pendingDateRange.from) url += `&startDate=${format(pendingDateRange.from, 'yyyy-MM-dd')}`;
          if (pendingDateRange.to) url += `&endDate=${format(pendingDateRange.to, 'yyyy-MM-dd')}`;
        }
        // ใช้ filterMonth, filterYear (ไม่ใช่ pendingPendingMonth/Year)
        if (filterMonth) url += `&month=${filterMonth}`;
        if (filterYear) url += `&year=${filterYear}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) {
          showSessionExpiredDialog();
          return;
        }
        const data = await res.json();
        if (data.status === "success") {
          let filtered = data.data;
          // กรองย้อนหลังฝั่ง frontend ถ้า API ไม่กรองให้
          if (pendingBackdatedFilter === 'backdated') {
            filtered = filtered.filter(r => r.backdated === 1 || r.backdated === "1" || r.backdated === true);
          } else if (pendingBackdatedFilter === 'normal') {
            filtered = filtered.filter(r => r.backdated !== 1 && r.backdated !== "1" && r.backdated !== true);
          }
          setPendingRequests(filtered);
          setPendingTotalPages(data.totalPages || 1);
        } else {
          setPendingRequests([]);
          setPendingTotalPages(1);
          setError(t('admin.loadError'));
        }
      } catch (e) {
        setPendingRequests([]);
        setPendingTotalPages(1);
        setError(t('admin.connectionError'));
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, [t, pendingPage, pendingLimit, pendingFilterLeaveType, pendingDateRange, pendingSingleDate, pendingBackdatedFilter, filterMonth, filterYear]);

  useEffect(() => {
    fetchHistoryRequests();
  }, [t, historyPage, filterMonth, filterYear, historyLimit, historyStatusFilter, dateRange, recentSingleDate, historyBackdatedFilter, historyFilterLeaveType]);

  useEffect(() => {
    let url = `${API_BASE_URL}/api/leave-request/dashboard-stats`;
    const params = [];
    if (filterMonth) params.push(`month=${filterMonth}`);
    if (filterYear) params.push(`year=${filterYear}`);
    if (params.length > 0) url += `?${params.join("&")}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setDashboardStats(data.data);
        }
      });
  }, [filterMonth, filterYear]);

  useEffect(() => {
    // ดึง department
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          showSessionExpiredDialog();
          return;
        }
        const res = await fetch(`${API_BASE_URL}/api/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          showSessionExpiredDialog();
          return;
        }
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.data)) {
          setDepartments(data.data);
        }
      } catch {}
    };
    // ดึง position
    const fetchPositions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          showSessionExpiredDialog();
          return;
        }
        const res = await fetch(`${API_BASE_URL}/api/positions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          showSessionExpiredDialog();
          return;
        }
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.data)) {
          setPositions(data.data);
        }
      } catch {}
    };
    fetchDepartments();
    fetchPositions();
  }, []);

  // รายชื่อเดือนรองรับ i18n
  const monthNames = i18n.language === 'th'
    ? ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Fetch leave types for pending filter
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      setPendingLeaveTypesLoading(true);
      setPendingLeaveTypesError(null);
      try {
        const res = await fetch('/api/leave-types');
        const data = await res.json();
        if (data.success) {
          setPendingLeaveTypes(data.data);
        } else {
          setPendingLeaveTypes([]);
          setPendingLeaveTypesError(data.message || 'Failed to fetch leave types');
        }
      } catch (err: any) {
        setPendingLeaveTypes([]);
        setPendingLeaveTypesError(err.message || 'Failed to fetch leave types');
      } finally {
        setPendingLeaveTypesLoading(false);
      }
    };
    fetchLeaveTypes();
  }, []);

  // --- ฟังก์ชัน apply filter ---
  const applyHistoryFilters = () => {
    setFilterMonth(pendingFilterMonth);
    setFilterYear(pendingFilterYear);
    setHistoryStatusFilter(pendingHistoryStatusFilter);
    setHistoryFilterLeaveType(pendingHistoryFilterLeaveType);
    setRecentSingleDate(pendingRecentSingleDate);
    setHistoryBackdatedFilter(pendingHistoryBackdatedFilter);
    setHistoryPage(1);
  };

  // --- ปรับ clearHistoryFilters ให้รีเซ็ต pending ด้วย ---
  const clearHistoryFilters = () => {
    setFilterMonth('');
    setFilterYear('');
    setHistoryStatusFilter('all');
    setDateRange({ from: undefined, to: undefined });
    setRecentSingleDate(undefined);
    setHistoryPage(1);
    setHistoryBackdatedFilter('all');
    setHistoryFilterLeaveType('');
    // reset pending
    setPendingFilterMonth('');
    setPendingFilterYear('');
    setPendingHistoryStatusFilter('all');
    setPendingHistoryFilterLeaveType('');
    setPendingRecentSingleDate(undefined);
    setPendingHistoryBackdatedFilter('all');
  };

  // --- ฟังก์ชัน apply filter ---
  const applyPendingFilters = () => {
    setPendingFilterLeaveType(pendingPendingFilterLeaveType);
    setPendingDateRange(pendingPendingDateRange);
    setPendingSingleDate(pendingPendingSingleDate);
    setPendingBackdatedFilter(pendingPendingBackdatedFilter);
    setPendingPage(1);
    setFilterMonth(pendingPendingMonth);
    setFilterYear(pendingPendingYear);
  };

  // --- ปรับ clearPendingFilters ให้รีเซ็ต pending ด้วย ---
  const clearPendingFilters = () => {
    setPendingFilterLeaveType('');
    setPendingDateRange({ from: undefined, to: undefined });
    setPendingSingleDate(undefined);
    setPendingPage(1);
    setPendingBackdatedFilter('all');
    setPendingPendingFilterLeaveType('');
    setPendingPendingDateRange({ from: undefined, to: undefined });
    setPendingPendingSingleDate(undefined);
    setPendingPendingBackdatedFilter('all');
    setPendingPendingPage(1);
    setPendingPendingMonth('');
    setPendingPendingYear('');
    setFilterMonth('');
    setFilterYear('');
  };

  const getLeaveTypeLabel = (typeId: string) => {
    const found = pendingLeaveTypes.find(lt => lt.id === typeId || lt.leave_type === typeId);
    if (!found) return typeId;
    return i18n.language.startsWith('th') ? found.leave_type_th : found.leave_type_en;
  };

  // Add a function to fetch leave request details by ID for recent history
  const handleViewDetailsWithFetch = async (request: any) => {
    setShowDetailDialog(true);
    setSelectedRequest(null); // Show loading state if needed
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showSessionExpiredDialog();
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/leave-request/detail/${request.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedRequest({ ...data.data, ...request });
      } else {
        setSelectedRequest(request); // fallback
      }
    } catch {
      setSelectedRequest(request); // fallback
    }
  };

  // --- State สำหรับลบใบลา ---
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingRequest, setDeletingRequest] = useState<any | null>(null);

  // --- ฟังก์ชันลบใบลา ---
  const handleDelete = (request: any) => {
    setDeletingRequest(request);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingRequest) return;
    const token = localStorage.getItem('token');
    if (!token) {
      showSessionExpiredDialog();
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/leave-request/${deletingRequest.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success || data.status === 'success') {
        toast({ title: t('system.deleteSuccess', 'ลบสำเร็จ'), description: t('system.deleteSuccessDesc', 'ลบใบลาสำเร็จ') });
        setShowDeleteDialog(false);
        setDeletingRequest(null);
        refreshLeaveRequests();
        fetchHistoryRequests();
      } else {
        toast({ title: t('common.error'), description: data.message || t('system.deleteError', 'ลบไม่สำเร็จ'), variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: t('common.error'), description: t('system.deleteError', 'ลบไม่สำเร็จ'), variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {t('navigation.adminDashboard', i18n.language === 'th' ? 'แดชบอร์ดผู้ดูแลระบบ' : 'Admin Dashboard')}
            </h1>
            <p className="text-sm text-gray-600">
              {t('admin.dashboardDesc')}
            </p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="p-6 animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card 
                  key={stat.title} 
                  className="border-0 shadow-md hover:shadow-lg transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Main Content */}
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="pending">{t('admin.pendingRequests')}</TabsTrigger>
              <TabsTrigger value="recent">{t('admin.recentHistory')}</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              <Card className="border-0 shadow-lg">
                <CardHeader className="gradient-bg text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {t('admin.pendingLeaveRequests')}
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    {t('admin.pendingLeaveRequestsDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {/* --- ใน JSX ส่วน Pending Tab Filter --- */}
                  <div className="mb-2 flex flex-wrap gap-4 items-end">
                    <div className="flex flex-col min-w-[140px]">
                      <label className="text-xs font-medium mb-1">{t('leave.type', 'Leave Type')}</label>
                      <select
                        className="border rounded px-2 py-1"
                        value={pendingPendingFilterLeaveType}
                        onChange={e => setPendingPendingFilterLeaveType(e.target.value)}
                      >
                        <option value="">{t('leave.type', 'Leave Type')}</option>
                        {pendingLeaveTypes.map(lt => (
                          <option key={lt.id} value={lt.id}>
                            {i18n.language.startsWith('th') ? lt.leave_type_th : lt.leave_type_en}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col min-w-[120px]">
                      <label className="text-xs font-medium mb-1">{t('history.month', 'Month')}</label>
                      <select
                        className="border rounded px-2 py-1"
                        value={pendingPendingMonth}
                        onChange={e => {
                          const month = e.target.value ? Number(e.target.value) : '';
                          setPendingPendingMonth(month);
                          // ถ้าเลือกเดือนแต่ยังไม่ได้เลือกปี ให้ default เป็นปีปัจจุบัน
                          if (month && !pendingPendingYear) {
                            setPendingPendingYear(new Date().getFullYear());
                          }
                        }}
                      >
                        <option value="">{t('history.allMonths', 'All months')}</option>
                        {monthNames.map((name, i) => (
                          <option key={i+1} value={i+1}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col min-w-[120px]">
                      <label className="text-xs font-medium mb-1">{t('history.year', 'Year')}</label>
                      <input
                        type="number"
                        className="border rounded px-2 py-1"
                        placeholder={t('history.year', 'Year')}
                        value={pendingPendingYear}
                        min={2000}
                        max={2100}
                        onChange={e => setPendingPendingYear(e.target.value ? Number(e.target.value) : '')}
                      />
                    </div>
                    <div className="flex flex-col min-w-[120px]">
                      <label className="text-xs font-medium mb-1">{t('leave.backdatedFilter', 'Backdated')}</label>
                      <select
                        className="border rounded px-2 py-1"
                        value={pendingPendingBackdatedFilter}
                        onChange={e => setPendingPendingBackdatedFilter(e.target.value)}
                      >
                        <option value="all">{t('leave.backdatedAll', 'All')}</option>
                        <option value="backdated">{t('leave.backdatedOnly', 'Backdated only')}</option>
                        <option value="normal">{t('leave.notBackdatedOnly', 'Non-backdated only')}</option>
                      </select>
                    </div>
                    <div className="flex flex-col min-w-[80px]">
                      <label className="text-xs font-medium mb-1 opacity-0">{t('common.confirm')}</label>
                      <button
                        className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        onClick={applyPendingFilters}
                        type="button"
                      >
                        {t('common.confirm')}
                      </button>
                    </div>
                    <div className="flex flex-col min-w-[80px]">
                      <label className="text-xs font-medium mb-1 opacity-0">{t('history.clearFilter', 'Clear filter')}</label>
                      <button
                        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                        onClick={clearPendingFilters}
                        type="button"
                      >
                        {t('history.clearFilter')}
                      </button>
                    </div>
                  </div>
                  {loading ? (
                    <div className="text-center py-10 text-gray-500">{t('common.loading')}</div>
                  ) : error ? (
                    <div className="text-center py-10 text-red-500">{error}</div>
                  ) : (
                    <div className="space-y-4">
                      {pendingRequests.length === 0 && (
                        <div className="text-center text-gray-500">{t('admin.noPendingRequests')}</div>
                      )}
                      {pendingRequests.map((request) => (
                        <div 
                          key={request.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {typeof request.user === "string"
                                  ? JSON.parse(request.user).User_name
                                  : request.user?.User_name || "-"}
                              </h3>
                              <p className="text-sm text-gray-600">{i18n.language.startsWith('th') ? request.leaveTypeName_th : request.leaveTypeName_en}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-orange-600 border-orange-200">
                                {t('admin.pending')}
                              </Badge>
                              {request.backdated === 1 ? (
                                <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs ml-0.5">
                                  {t('leave.backdated', 'ย้อนหลัง')}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700">{t('leave.date')}:</p>
                              <p className="text-sm text-gray-600">
                                {request.startTime && request.endTime
                                  ? `${formatDateOnly(request.startDate)} - ${formatDateOnly(request.endDate)} (${calcHours(request.startTime, request.endTime)} ${hourUnit}, ${request.startTime} - ${request.endTime})`
                                  : `${formatDateOnly(request.startDate)} - ${formatDateOnly(request.endDate)}`}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">{t('leave.leaveTime', 'เวลาที่ลา:')}</p>
                              <p className="text-sm text-gray-600">
                                {request.startTime && request.endTime
                                  ? `${request.startTime} - ${request.endTime}`
                                  : t('leave.noHourlyLeave', 'ไม่มีการลาเป็น ชม.')}
                              </p>
                            </div>
                          </div>
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700">{t('leave.reason')}:</p>
                            <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                          </div>
                          {/* เพิ่มแสดงวันที่ส่งคำขอ */}
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700">{t('leave.submittedDate', 'วันที่ส่งคำขอ')}:</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {request.createdAt ? formatDateLocalized(request.createdAt) : '-'}
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(request.id, typeof request.user === "string" ? JSON.parse(request.user).User_name : request.user?.User_name || "")}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {t('admin.approve')}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleReject(request.id, typeof request.user === "string" ? JSON.parse(request.user).User_name : request.user?.User_name || "")}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              {t('admin.reject')}
                            </Button>
                            <button
                              className="mt-3 px-4 py-1 rounded border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-medium transition"
                              onClick={() => handleViewDetails(request)}
                            >
                              <Eye className="w-4 h-4 inline mr-1" /> {t('admin.viewDetails', 'ดูรายละเอียด')}
                            </button>
                            {user?.role === 'superadmin' && (
                              <button
                                className="mt-3 px-4 py-1 rounded border border-red-500 text-red-600 hover:bg-red-50 text-xs font-medium transition"
                                onClick={() => handleDelete(request)}
                              >
                                🗑 {t('common.delete', 'ลบ')}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {/* --- ปุ่มเปลี่ยนหน้า --- */}
                      {(
                        <div className="flex flex-wrap justify-center mt-6 gap-2 items-center">
                          {/* --- Pagination with ellipsis --- */}
                          {(() => {
                            const pages = [];
                            const maxPageButtons = 5;
                            let start = Math.max(1, pendingPage - 2);
                            let end = Math.min(pendingTotalPages, start + maxPageButtons - 1);
                            if (end - start < maxPageButtons - 1) {
                              start = Math.max(1, end - maxPageButtons + 1);
                            }
                            if (start > 1) {
                              pages.push(
                                <button key={1} onClick={() => setPendingPage(1)} className={`px-3 py-1 rounded border ${pendingPage === 1 ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'} transition`}>1</button>
                              );
                              if (start > 2) pages.push(<span key="start-ellipsis">...</span>);
                            }
                            for (let i = start; i <= end; i++) {
                              pages.push(
                                <button key={i} onClick={() => setPendingPage(i)} className={`px-3 py-1 rounded border ${pendingPage === i ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'} transition`} disabled={pendingPage === i}>{i}</button>
                              );
                            }
                            if (end < pendingTotalPages) {
                              if (end < pendingTotalPages - 1) pages.push(<span key="end-ellipsis">...</span>);
                              pages.push(
                                <button key={pendingTotalPages} onClick={() => setPendingPage(pendingTotalPages)} className={`px-3 py-1 rounded border ${pendingPage === pendingTotalPages ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'} transition`}>{pendingTotalPages}</button>
                              );
                            }
                            return pages;
                          })()}
                          {/* --- Items per page select --- */}
                          <select
                            className="ml-4 border rounded px-2 py-1 text-sm"
                            value={pendingLimit}
                            onChange={e => {
                              setPendingLimit(Number(e.target.value));
                              setPendingPage(1);
                            }}
                          >
                            {[5, 10, 20, 50].map(n => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                          <span className="ml-2 text-sm text-gray-500">{t('admin.itemsPerPage')}</span>
                          <span className="ml-2 text-sm text-gray-500">{t('admin.pageInfo', { page: pendingPage, totalPages: pendingTotalPages })}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recent" className="space-y-4">
              <Card className="border-0 shadow-lg">
                <CardHeader className="gradient-bg text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    {t('admin.recentApprovalHistory')}
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    {t('admin.recentApprovalHistoryDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {/* --- ใน JSX ส่วน Recent History Filter --- */}
                  <div className="mb-2 flex flex-wrap gap-4 items-end">
                    <div className="flex flex-col min-w-[140px]">
                      <label className="text-xs font-medium mb-1">{t('leave.type', 'Leave Type')}</label>
                      <select
                        className="border rounded px-2 py-1"
                        value={pendingHistoryFilterLeaveType}
                        onChange={e => setPendingHistoryFilterLeaveType(e.target.value)}
                      >
                        <option value="">{t('leave.type', 'Leave Type')}</option>
                        {pendingLeaveTypes.map(lt => (
                          <option key={lt.id} value={lt.id}>
                            {i18n.language.startsWith('th') ? lt.leave_type_th : lt.leave_type_en}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col min-w-[120px]">
                      <label className="text-xs font-medium mb-1">{t('history.month', 'Month')}</label>
                      <select
                        className="border rounded px-2 py-1"
                        value={pendingFilterMonth}
                        onChange={e => {
                          const value = e.target.value ? Number(e.target.value) : '';
                          setPendingFilterMonth(value);
                          if (value && !pendingFilterYear) {
                            const currentYear = new Date().getFullYear();
                            setPendingFilterYear(currentYear);
                          }
                        }}
                      >
                        <option value="">{t('history.allMonths', 'All months')}</option>
                        {monthNames.map((name, i) => (
                          <option key={i+1} value={i+1}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col min-w-[120px]">
                      <label className="text-xs font-medium mb-1">{t('history.year', 'Year')}</label>
                      <input
                        type="number"
                        className="border rounded px-2 py-1"
                        placeholder={t('history.year', 'Year')}
                        value={pendingFilterYear}
                        min={2000}
                        max={2100}
                        onChange={e => setPendingFilterYear(e.target.value ? Number(e.target.value) : '')}
                      />
                    </div>
                    <div className="flex flex-col min-w-[120px]">
                      <label className="text-xs font-medium mb-1">{t('leave.status', 'Status')}</label>
                      <select
                        className="border rounded px-2 py-1"
                        value={pendingHistoryStatusFilter}
                        onChange={e => setPendingHistoryStatusFilter(e.target.value)}
                      >
                        <option value="all">{t('admin.allStatuses', 'All status')}</option>
                        <option value="approved">{t('leave.approved', 'Approved')}</option>
                        <option value="rejected">{t('leave.rejected', 'Rejected')}</option>
                      </select>
                    </div>
                    <div className="flex flex-col min-w-[120px]">
                      <label className="text-xs font-medium mb-1">{t('leave.backdatedFilter', 'Backdated')}</label>
                      <select
                        className="border rounded px-2 py-1"
                        value={pendingHistoryBackdatedFilter}
                        onChange={e => setPendingHistoryBackdatedFilter(e.target.value)}
                      >
                        <option value="all">{t('leave.backdatedAll', 'All')}</option>
                        <option value="backdated">{t('leave.backdatedOnly', 'Backdated only')}</option>
                        <option value="normal">{t('leave.notBackdatedOnly', 'Non-backdated only')}</option>
                      </select>
                    </div>
                    <div className="flex flex-col min-w-[80px]">
                      <label className="text-xs font-medium mb-1 opacity-0">{t('common.confirm')}</label>
                      <button
                        className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        onClick={applyHistoryFilters}
                        type="button"
                      >
                        {t('common.confirm')}
                      </button>
                    </div>
                    <div className="flex flex-col min-w-[80px]">
                      <label className="text-xs font-medium mb-1 opacity-0">{t('history.clearFilter', 'Clear filter')}</label>
                      <button
                        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                        onClick={clearHistoryFilters}
                        type="button"
                      >
                        {t('history.clearFilter')}
                      </button>
                    </div>
                  </div>
                  {/* History Tab Filter */}
                  {/* <div className="flex items-center gap-2">
                    <label className="text-xs font-medium">{t('leave.backdatedLabel', 'ย้อนหลัง')}</label>
                    <select className="border rounded px-2 py-1 text-xs" value={historyBackdatedFilter} onChange={e => { setHistoryBackdatedFilter(e.target.value); setHistoryPage(1); }}>
                      <option value="all">{t('leave.backdatedAll', 'ทั้งหมด')}</option>
                      <option value="backdated">{t('leave.backdatedOnly', 'เฉพาะย้อนหลัง')}</option>
                      <option value="normal">{t('leave.notBackdatedOnly', 'เฉพาะไม่ย้อนหลัง')}</option>
                    </select>
                  </div> */}
                  {loading ? (
                    <div className="text-center py-10 text-gray-500">{t('common.loading')}</div>
                  ) : historyRequests.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                      {filterMonth || filterYear
                        ? t('admin.noDataForSelectedMonthYear', 'ไม่พบข้อมูลในเดือน/ปีที่เลือก')
                        : t('admin.noApprovalHistory')}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {historyRequests.map((request) => {
                        // คำนวณจำนวนวันลา
                        const start = new Date(request.startDate);
                        const end = new Date(request.endDate);
                        const leaveDays = differenceInCalendarDays(end, start) + 1;
                        // แปลงวันที่เป็นภาษาไทย
                        const startStr = formatDateOnly(request.startDate);
                        const endStr = formatDateOnly(request.endDate);
                        // วันที่อนุมัติ/ไม่อนุมัติ
                        let statusDate = "-";
                        if (request.status === "approved" && request.approvedTime) {
                          statusDate = formatDateLocalized(request.approvedTime);
                        } else if (request.status === "rejected" && request.rejectedTime) {
                          statusDate = formatDateLocalized(request.rejectedTime);
                        }
                        return (
                          <div
                            key={request.id}
                            className="relative border border-gray-200 rounded-lg p-6 flex flex-col gap-4"
                          >
                            {/* Badge มุมขวาบน */}
                            <div className="flex items-center gap-2 absolute right-6 top-6">
                              <Badge
                                className={
                                  (request.status === "approved"
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : "bg-red-100 text-red-800 border-red-200") +
                                  " flex items-center"
                                }
                              >
                                {request.status === "approved" ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-1" /> {t('admin.approved')}
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4 mr-1" /> {t('admin.rejected')}
                                  </>
                                )}
                              </Badge>
                              {/* --- ใน Recent History Tab (badge) --- */}
                              {request.backdated === 1 ? (
                                <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs ml-0.5">{t('leave.backdated', 'ย้อนหลัง')}</span>
                              ) : null}
                            </div>

                            {/* ข้อมูล leave หลัก */}
                            <div className="flex-1">
                              <div className="font-bold text-lg mb-1">{request.user?.User_name || "-"}</div>
                              <div className="text-base text-gray-700 mb-2">{i18n.language.startsWith('th') ? request.leaveTypeName_th : request.leaveTypeName_en}</div>
                              <div className="text-sm text-gray-700 mb-1">
                                {t('leave.date')}: {startStr} - {endStr}{request.startTime && request.endTime
                                  ? ` (${calcHours(request.startTime, request.endTime)} ${hourUnit}, ${request.startTime} - ${request.endTime})`
                                  : ` (${leaveDays} ${t('leave.day')})`}
                              </div>
                            </div>
                            {/* กล่องล่าง: สถานะซ้าย, ปุ่มขวา */}
                            <div className="flex flex-row justify-between items-end mt-2 gap-2">
                              {/* กล่องสถานะซ้ายล่าง */}
                              <div className="w-fit p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  {request.status === "approved" ? (
                                    <>
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                      <span>{t('admin.approvedWhen')} {statusDate !== '-' ? statusDate : '-'}</span>
                                    </>
                                  ) : request.status === "rejected" ? (
                                    <>
                                      <XCircle className="w-4 h-4 text-red-500" />
                                      <span>{t('admin.rejectedWhen')} {statusDate !== '-' ? statusDate : '-'}</span>
                                    </>
                                  ) : null}
                                </div>
                                {/* ชื่อ admin ที่อนุมัติ/ไม่อนุมัติ */}
                                {request.status === "approved" && request.approvedBy && (
                                  <div className="flex items-center gap-1 text-xs text-green-700 mt-1">
                                    <span className="font-semibold">{t('admin.by')}</span>
                                    <span>{request.approvedBy}</span>
                                  </div>
                                )}
                                {request.status === "rejected" && request.rejectedBy && (
                                  <div className="flex items-center gap-1 text-xs text-red-700 mt-1">
                                    <span className="font-semibold">{t('admin.by')}</span>
                                    <span>{request.rejectedBy}</span>
                                  </div>
                                )}
                                {/* เหตุผลที่ไม่อนุมัติ */}
                                {request.status === "rejected" && request.rejectionReason && (
                                  <div className="flex items-start gap-2 text-xs text-red-500 mt-2">
                                    <FileText className="w-4 h-4 mt-0.5" />
                                    <div className="max-w-xs">
                                      <span className="font-semibold">{t('leave.rejectionReason')}:</span>
                                      <span className="ml-1">
                                        <span
                                          className={
                                            expandedRejection[request.id]
                                              ? ''
                                              : 'line-clamp-3 block max-h-[4.5em] overflow-hidden'
                                          }
                                          style={{ whiteSpace: 'pre-line' }}
                                        >
                                          {request.rejectionReason}
                                        </span>
                                        {request.rejectionReason.length > 80 && (
                                          <button
                                            className="ml-2 text-blue-600 underline cursor-pointer"
                                            onClick={() => setExpandedRejection(prev => ({ ...prev, [request.id]: !prev[request.id] }))}
                                          >
                                            {expandedRejection[request.id]
                                              ? t('common.showLess', 'ย่อ')
                                              : t('common.showMore', 'ดูเพิ่มเติม')}
                                          </button>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {/* ปุ่มดูรายละเอียด ขวาล่าง */}
                              <div className="flex justify-end gap-2">
                                <button
                                  className="px-4 py-1 rounded border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-medium transition"
                                  onClick={() => handleViewDetailsWithFetch(request)}
                                >
                                  <Eye className="w-4 h-4 inline mr-1" /> {t('admin.viewDetails', 'ดูรายละเอียด')}
                                </button>
                                {user?.role === 'superadmin' && (
                                  <button
                                    className="px-4 py-1 rounded border border-red-500 text-red-600 hover:bg-red-50 text-xs font-medium transition"
                                    onClick={() => handleDelete(request)}
                                  >
                                    🗑 {t('common.delete', 'ลบ')}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {/* --- ปุ่มเปลี่ยนหน้า --- */}
                      <div className="flex flex-wrap justify-center mt-6 gap-2 items-center">
                        {/* --- Pagination with ellipsis --- */}
                        {(() => {
                          const pages = [];
                          const maxPageButtons = 5;
                          let start = Math.max(1, historyPage - 2);
                          let end = Math.min(historyTotalPages, start + maxPageButtons - 1);
                          if (end - start < maxPageButtons - 1) {
                            start = Math.max(1, end - maxPageButtons + 1);
                          }
                          if (start > 1) {
                            pages.push(
                              <button key={1} onClick={() => setHistoryPage(1)} className={`px-3 py-1 rounded border ${historyPage === 1 ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'} transition`}>1</button>
                            );
                            if (start > 2) pages.push(<span key="start-ellipsis">...</span>);
                          }
                          for (let i = start; i <= end; i++) {
                            pages.push(
                              <button key={i} onClick={() => setHistoryPage(i)} className={`px-3 py-1 rounded border ${historyPage === i ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'} transition`} disabled={historyPage === i}>{i}</button>
                            );
                          }
                          if (end < historyTotalPages) {
                            if (end < historyTotalPages - 1) pages.push(<span key="end-ellipsis">...</span>);
                            pages.push(
                              <button key={historyTotalPages} onClick={() => setHistoryPage(historyTotalPages)} className={`px-3 py-1 rounded border ${historyPage === historyTotalPages ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'} transition`}>{historyTotalPages}</button>
                            );
                          }
                          return pages;
                        })()}
                        {/* --- Items per page select --- */}
                        <select
                          className="ml-4 border rounded px-2 py-1 text-sm"
                          value={historyLimit}
                          onChange={e => {
                            setHistoryLimit(Number(e.target.value));
                            setHistoryPage(1);
                          }}
                        >
                          {[5, 10, 20, 50].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                        <span className="ml-2 text-sm text-gray-500">{t('admin.itemsPerPage')}</span>
                        <span className="ml-2 text-sm text-gray-500">{t('admin.pageInfo', { page: historyPage, totalPages: historyTotalPages })}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent
          className="w-[95vw] max-w-2xl border border-blue-200 bg-white rounded-2xl shadow-xl p-8"
          style={{ maxWidth: 700 }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-2 text-center text-blue-900">{t('leave.detailTitle', 'รายละเอียดการลา')}</DialogTitle>
            <DialogDescription>
              {selectedRequest ? '' : ''}
            </DialogDescription>
            {selectedRequest && (
              <div className="space-y-3 text-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  <div>
                    <span className="font-semibold text-blue-800">{t('leave.employeeName', 'ชื่อพนักงาน')}:</span> {typeof selectedRequest.user === "string"
                      ? JSON.parse(selectedRequest.user).User_name
                      : selectedRequest.user?.User_name || "-"}
                  </div>
                  <div>
                    <span className="font-semibold text-blue-800">{t('leave.position', 'ตำแหน่ง')}:</span> {(() => {
                      const posId = selectedRequest.user?.position || selectedRequest.employeeType;
                      const pos = positions.find(p => p.id === posId);
                      const posName = pos ? (i18n.language.startsWith('th') ? pos.position_name_th : pos.position_name_en) : posId || "-";
                      return String(t(`positions.${posName}`, posName)) || String(posName) || '';
                    })()}
                  </div>
                  <div>
                    <span className="font-semibold text-blue-800">{t('leave.department', 'แผนก')}:</span> {(() => {
                      const deptId = selectedRequest.user?.department;
                      const dept = departments.find(d => d.id === deptId);
                      const deptName = dept ? (i18n.language.startsWith('th') ? dept.department_name_th : dept.department_name_en) : deptId || "-";
                      return String(t(`departments.${deptName}`, deptName)) || String(deptName) || '';
                    })()}
                  </div>
                  <div>
                    <span className="font-semibold text-blue-800">{t('leave.type', 'ประเภทการลา')}:</span> {
  i18n.language.startsWith('th')
    ? (selectedRequest.leaveTypeName_th || getLeaveTypeLabel(selectedRequest.leaveType) || selectedRequest.leaveTypeName_en || selectedRequest.leaveType)
    : (selectedRequest.leaveTypeName_en || getLeaveTypeLabel(selectedRequest.leaveType) || selectedRequest.leaveTypeName_th || selectedRequest.leaveType)
}
                  </div>
                  <div>
                    <span className="font-semibold text-blue-800">{t('leave.reason', 'เหตุผล')}:</span> {selectedRequest.reason}
                  </div>
                  <div>
                    <span className="font-semibold text-blue-800">{t('leave.date', 'วันที่ลา')}:</span> {formatDateOnly(selectedRequest.startDate)} - {formatDateOnly(selectedRequest.endDate)}{selectedRequest.startTime && selectedRequest.endTime
                    ? ` (${calcHours(selectedRequest.startTime, selectedRequest.endTime)} ${hourUnit}, ${selectedRequest.startTime} - ${selectedRequest.endTime})`
                    : ''}
                  </div>
                  <div>
                    <span className="font-semibold text-blue-800">{t('leave.submittedDate', 'วันที่ส่งคำขอ')}:</span> {selectedRequest.createdAt ? selectedRequest.createdAt.split('T')[0] : "-"}
                  </div>
                  <div>
                    <span className="font-semibold text-blue-800">{t('leave.contactMethod', 'ช่องทางการติดต่อ')}:</span> {selectedRequest.contact || selectedRequest.contactInfo || selectedRequest.user?.contact || selectedRequest.data?.contact || "-"}
                  </div>
                  <div>
                    <span className="font-semibold text-blue-800">{t('leave.leaveTime', 'เวลาที่ลา:')}</span> {selectedRequest?.startTime && selectedRequest?.endTime
                    ? `${selectedRequest.startTime} - ${selectedRequest.endTime}`
                    : t('leave.noHourlyLeave', 'ไม่มีการลาเป็น ชม.')}
                  </div>
              
                </div>
                {/* Section: Attachments/Images */}
                {(() => {
                  // รองรับทั้ง array และ string หลาย field
                  const files =
                    (Array.isArray(selectedRequest.attachments) && selectedRequest.attachments.length > 0)
                      ? selectedRequest.attachments
                      : (typeof selectedRequest.attachments === 'string' && selectedRequest.attachments)
                        ? [selectedRequest.attachments]
                        : (Array.isArray(selectedRequest.attachment) && selectedRequest.attachment.length > 0)
                          ? selectedRequest.attachment
                          : (typeof selectedRequest.attachment === 'string' && selectedRequest.attachment)
                            ? [selectedRequest.attachment]
                            : (Array.isArray(selectedRequest.file) && selectedRequest.file.length > 0)
                              ? selectedRequest.file
                              : (typeof selectedRequest.file === 'string' && selectedRequest.file)
                                ? [selectedRequest.file]
                                : [];
                  // imgLeave (string)
                  const imgLeave = selectedRequest.imgLeave;
                  if (files.length > 0) {
                    return (
                      <div className="flex flex-col items-center mt-4">
                        <span className="font-semibold mb-2 text-blue-800">{t('leave.attachment', 'ไฟล์แนบ')}:</span>
                        <div className="flex flex-wrap gap-4 justify-center">
                          {files.map((file: string, idx: number) => {
                            const ext = file.split('.').pop()?.toLowerCase();
                            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '');
                            const fileUrl = `/leave-uploads/${file}`;
                            return (
                              <div key={file} className="flex flex-col items-center">
                                {isImage ? (
                                  <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={fileUrl}
                                      alt={`แนบไฟล์ ${idx + 1}`}
                                      className="rounded-xl border-2 border-blue-200 shadow max-w-xs bg-white"
                                      style={{ marginTop: 8 }}
                                    />
                                  </a>
                                ) : (
                                  <a
                                    href={fileUrl}
                                    download
                                    className="flex items-center gap-2 px-3 py-2 border rounded bg-gray-50 hover:bg-gray-100 text-blue-700"
                                    style={{ marginTop: 8 }}
                                  >
                                    <span role="img" aria-label="file">📄</span> {file}
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  } else if (imgLeave) {
                    // กรณี imgLeave เป็น string
                    return (
                      <div className="flex flex-col items-center mt-4">
                        <span className="font-semibold mb-2 text-blue-800">{t('leave.attachment', 'ไฟล์แนบ')}:</span>
                        <img
                          src={`/leave-uploads/${imgLeave}`}
                          alt="แนบไฟล์"
                          className="rounded-xl border-2 border-blue-200 shadow max-w-xs bg-white"
                          style={{ marginTop: 8 }}
                        />
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </DialogHeader>
          <DialogFooter className="flex justify-center mt-6">
            <Button className="px-8 py-2 text-lg rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow" onClick={() => setShowDetailDialog(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog สำหรับป้อนเหตุผลไม่อนุมัติ */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('admin.rejectReasonTitle', 'กรุณาระบุเหตุผลในการไม่อนุมัติ')}</DialogTitle>
          </DialogHeader>
          <textarea
            className="w-full border rounded p-2 mt-2"
            rows={3}
            placeholder={t('admin.rejectReasonPlaceholder', 'กรอกเหตุผล...')}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>{t('common.back', 'ย้อนกลับ')}</Button>
            <Button variant="destructive" onClick={confirmReject} disabled={!rejectReason.trim()}>{t('common.confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog สำหรับยืนยันการอนุมัติ */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('admin.approveConfirmTitle', 'ยืนยันการอนุมัติ')}</DialogTitle>
            <DialogDescription>
              {t('admin.approveConfirmDesc', { name: approvingRequest?.employeeName || '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>{t('common.cancel', 'ยกเลิก')}</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={confirmApprove}>{t('common.confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog สำหรับยืนยันการลบ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('system.confirmDeleteLeave', 'ยืนยันการลบใบลา')}</DialogTitle>
            <DialogDescription>
              {t('system.confirmDeleteLeaveDesc', 'คุณต้องการลบใบลานี้หรือไม่?')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>{t('common.cancel', 'ยกเลิก')}</Button>
            <Button variant="destructive" onClick={confirmDelete}>{t('common.confirm', 'ยืนยัน')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
