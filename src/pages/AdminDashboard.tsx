import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { differenceInCalendarDays, format } from "date-fns";
import { th } from "date-fns/locale";
import { AlertCircle, CheckCircle, Clock, Eye, TrendingUp, Users, XCircle, FileText } from "lucide-react";
import React, { useEffect, useState } from "react";
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

const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

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
  const [departments, setDepartments] = useState<{ id: string; department_name: string }[]>([]);
  const [positions, setPositions] = useState<{ id: string; position_name: string }[]>([]);
  // --- เพิ่ม state สำหรับ filter เดือน/ปี ---
  const [filterMonth, setFilterMonth] = useState<number | ''>('');
  const [filterYear, setFilterYear] = useState<number | ''>('');
  // --- เพิ่ม state สำหรับ items per page ---
  const [historyLimit, setHistoryLimit] = useState(5);
  const [pendingLimit, setPendingLimit] = useState(4);
  const [pendingLeaveTypes, setPendingLeaveTypes] = useState<{ id: string; leave_type: string }[]>([]);
  const [pendingLeaveTypesLoading, setPendingLeaveTypesLoading] = useState(false);
  const [pendingLeaveTypesError, setPendingLeaveTypesError] = useState<string | null>(null);
  const [pendingFilterLeaveType, setPendingFilterLeaveType] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('');
  // --- เพิ่ม state สำหรับ show more/less ของแต่ละ request ---
  const [expandedRejection, setExpandedRejection] = useState<{ [id: string]: boolean }>({});

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
      value: dashboardStats.approvedCount.toString(),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: t('admin.rejected'),
      value: dashboardStats.rejectedCount?.toString() || '0',
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
    {
      title: t('admin.averageLeaveDays'),
      value: dashboardStats.averageDayOff.toString(),
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
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
    const token = localStorage.getItem('token');
    if (!token) {
      toast({ title: "ไม่พบ token", description: "กรุณาเข้าสู่ระบบใหม่", variant: "destructive" });
      return;
    }
    const approverName = localStorage.getItem('user_name'); // สมมติว่าเก็บชื่อไว้

    fetch(`http://localhost:3001/api/leave-request/${id}/status`, {
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
          toast({ title: t('admin.approveSuccess'), description: `${t('admin.approveSuccessDesc')} ${employeeName}` });
          setPendingRequests(prev => prev.filter(r => r.id !== id));
          fetchHistoryRequests();
          refreshLeaveRequests(); // <-- เพิ่มบรรทัดนี้
        } else {
          toast({ title: t('admin.rejectError'), description: data.message, variant: "destructive" });
        }
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
    fetch(`http://localhost:3001/api/leave-request/${rejectingRequest.id}/status`, {
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
    fetch("http://localhost:3001/api/leave-request/pending", {
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

  const fetchHistoryRequests = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    // --- ส่ง page, limit, month, year, status ไป backend ---
    let url = `http://localhost:3001/api/leave-request/history?page=${historyPage}&limit=${historyLimit}`;
    if (filterMonth) url += `&month=${filterMonth}`;
    if (filterYear) url += `&year=${filterYear}`;
    if (historyStatusFilter) url += `&status=${historyStatusFilter}`;
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setHistoryRequests(data.data);
          setHistoryTotalPages(data.totalPages || 1);
        } else {
          setHistoryRequests([]);
          setHistoryTotalPages(1);
        }
      })
      .catch(() => {
        setHistoryRequests([]);
        setHistoryTotalPages(1);
      })
      .finally(() => setLoading(false));
  };

  // โหลด leave request ที่ pending จาก API
  useEffect(() => {
    const fetchPending = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        // --- ส่ง page, limit ไป backend ---
        let url = `http://localhost:3001/api/leave-request/pending?page=${pendingPage}&limit=${pendingLimit}`;
        if (pendingFilterLeaveType) url += `&leaveType=${pendingFilterLeaveType}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === "success") {
          setPendingRequests(data.data);
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
  }, [t, pendingPage, pendingLimit, pendingFilterLeaveType]);

  useEffect(() => {
    fetchHistoryRequests();
  }, [t, historyPage, filterMonth, filterYear, historyLimit, historyStatusFilter]);

  useEffect(() => {
    let url = "http://localhost:3001/api/leave-request/dashboard-stats";
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
        const res = await fetch('http://localhost:3001/api/departments', {
          headers: { Authorization: `Bearer ${token}` },
        });
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
        const res = await fetch('http://localhost:3001/api/positions', {
          headers: { Authorization: `Bearer ${token}` },
        });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {t('navigation.adminDashboard')}
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
                  <div className="flex flex-wrap gap-4 items-center mb-6">
                    <label className="text-sm font-medium">{t('leave.type')}</label>
                    {pendingLeaveTypesLoading ? (
                      <span className="text-gray-500 text-sm">{t('common.loading')}</span>
                    ) : pendingLeaveTypesError ? (
                      <span className="text-red-500 text-sm">{pendingLeaveTypesError}</span>
                    ) : (
                      <select
                        className="border rounded px-2 py-1"
                        value={pendingFilterLeaveType}
                        onChange={e => { setPendingFilterLeaveType(e.target.value); setPendingPage(1); }}
                      >
                        <option value="">{t('leave.allTypes')}</option>
                        {pendingLeaveTypes.map((lt) => (
                          <option key={lt.id} value={lt.id}>
                            {t(`leaveTypes.${lt.leave_type}`, lt.leave_type)}
                          </option>
                        ))}
                      </select>
                    )}
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
                              <p className="text-sm text-gray-600">{request.leaveTypeName ? String(t(`leaveTypes.${String(request.leaveTypeName)}`, String(request.leaveTypeName))) : '-'}</p>
                            </div>
                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                              {t('admin.pending')}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700">{t('leave.date')}:</p>
                              <p className="text-sm text-gray-600">
                                {request.startTime && request.endTime
                                  ? `${formatDateLocalized(request.startDate)} - ${formatDateLocalized(request.endDate)} (${calcHours(request.startTime, request.endTime)} ${hourUnit}, ${request.startTime} - ${request.endTime})`
                                  : `${formatDateLocalized(request.startDate)} - ${formatDateLocalized(request.endDate)}`}
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
                  <div className="flex flex-wrap gap-4 items-center mb-6">
                    <label className="text-sm font-medium">{t('history.filterByMonthYear')}</label>
                    <select
                      className="border rounded px-2 py-1"
                      value={filterMonth}
                      onChange={e => {
                        const value = e.target.value ? Number(e.target.value) : '';
                        setFilterMonth(value);
                        if (value && !filterYear) {
                          const currentYear = new Date().getFullYear();
                          setFilterYear(currentYear);
                        }
                      }}
                    >
                      <option value="">{t('history.allMonths')}</option>
                      {monthNames.map((name, i) => (
                        <option key={i+1} value={i+1}>{name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-24"
                      placeholder={t('history.year')}
                      value={filterYear}
                      min={2000}
                      max={2100}
                      onChange={e => setFilterYear(e.target.value ? Number(e.target.value) : '')}
                    />
                    <select
                      className="border rounded px-2 py-1"
                      value={historyStatusFilter}
                      onChange={e => { setHistoryStatusFilter(e.target.value); setHistoryPage(1); }}
                    >
                      <option value="">{t('admin.allStatuses', 'ทุกสถานะ')}</option>
                      <option value="approved">{t('leave.approved')}</option>
                      <option value="rejected">{t('leave.rejected')}</option>
                    </select>
                    <button
                      className="ml-2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                      onClick={() => { setFilterMonth(''); setFilterYear(''); setHistoryStatusFilter(''); }}
                      type="button"
                    >
                      {t('history.clearFilter')}
                    </button>
                  </div>
                  {loading ? (
                    <div className="text-center py-10 text-gray-500">{t('common.loading')}</div>
                  ) : historyRequests.filter(request => request.status !== "pending").length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                      {filterMonth || filterYear
                        ? t('admin.noDataForSelectedMonthYear', 'ไม่พบข้อมูลในเดือน/ปีที่เลือก')
                        : t('admin.noApprovalHistory')}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {historyRequests.filter(request => request.status !== "pending").map((request) => {
                        // คำนวณจำนวนวันลา
                        const start = new Date(request.startDate);
                        const end = new Date(request.endDate);
                        const leaveDays = differenceInCalendarDays(end, start) + 1;
                        // แปลงวันที่เป็นภาษาไทย
                        const startStr = formatDateLocalized(request.startDate);
                        const endStr = formatDateLocalized(request.endDate);
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
                            <Badge
                              className={
                                (request.status === "approved"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-red-100 text-red-800 border-red-200") +
                                " flex items-center absolute right-6 top-6"
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

                            {/* ข้อมูล leave หลัก */}
                            <div className="flex-1">
                              <div className="font-bold text-lg mb-1">{request.user?.User_name || "-"}</div>
                              <div className="text-base text-gray-700 mb-2">{request.leaveTypeName ? String(t(`leaveTypes.${String(request.leaveTypeName)}`, String(request.leaveTypeName))) : '-'}</div>
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
                              <div className="flex justify-end">
                                <button
                                  className="px-4 py-1 rounded border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-medium transition"
                                  onClick={() => handleViewDetails(request)}
                                >
                                  <Eye className="w-4 h-4 inline mr-1" /> {t('admin.viewDetails', 'ดูรายละเอียด')}
                                </button>
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
            <DialogDescription asChild>
              {selectedRequest && (
                <div className="space-y-3 text-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <div>
                      <span className="font-semibold text-blue-800">{t('leave.employeeName', 'ชื่อพนักงาน')}:</span> {typeof selectedRequest.user === "string"
                        ? JSON.parse(selectedRequest.user).User_name
                        : selectedRequest.user?.User_name || "-"}
                    </div>
                    <div>
                      <span className="font-semibold text-blue-800">{t('leave.position', 'ตำแหน่ง')}:</span> {
                        (() => {
                          const posId = selectedRequest.user?.position || selectedRequest.employeeType;
                          const pos = positions.find(p => p.id === posId);
                          return pos ? pos.position_name : posId || "-";
                        })()
                      }
                    </div>
                    <div>
                      <span className="font-semibold text-blue-800">{t('leave.department', 'แผนก')}:</span> {
                        (() => {
                          const deptId = selectedRequest.user?.department;
                          const dept = departments.find(d => d.id === deptId);
                          return dept ? dept.department_name : deptId || "-";
                        })()
                      }
                    </div>
                    <div>
                      <span className="font-semibold text-blue-800">{t('leave.type', 'ประเภทการลา')}:</span> {selectedRequest.leaveTypeName ? String(t(`leaveTypes.${String(selectedRequest.leaveTypeName)}`, String(selectedRequest.leaveTypeName))) : '-'}
                    </div>
                    <div>
                      <span className="font-semibold text-blue-800">{t('leave.reason', 'เหตุผล')}:</span> {selectedRequest.reason}
                    </div>
                    <div>
                      <span className="font-semibold text-blue-800">{t('leave.date', 'วันที่ลา')}:</span> {formatDateLocalized(selectedRequest.startDate)} - {formatDateLocalized(selectedRequest.endDate)}{selectedRequest.startTime && selectedRequest.endTime
                        ? ` (${calcHours(selectedRequest.startTime, selectedRequest.endTime)} ${hourUnit}, ${selectedRequest.startTime} - ${selectedRequest.endTime})`
                        : ''}
                    </div>
                    <div>
                      <span className="font-semibold text-blue-800">{t('leave.submittedDate', 'วันที่ส่งคำขอ')}:</span> {selectedRequest.createdAt ? selectedRequest.createdAt.split('T')[0] : "-"}
                    </div>
                    <div>
                      <span className="font-semibold text-blue-800">{t('leave.contact', 'เบอร์ติดต่อ')}:</span> {selectedRequest.contact || "-"}
                    </div>
                    <div>
                      <span className="font-semibold text-blue-800">{t('leave.leaveTime', 'เวลาที่ลา:')}</span> {selectedRequest?.startTime && selectedRequest?.endTime
                        ? `${selectedRequest.startTime} - ${selectedRequest.endTime}`
                        : t('leave.noHourlyLeave', 'ไม่มีการลาเป็น ชม.')}
                    </div>
              
                  </div>
                  {selectedRequest.imgLeave && (
                    <div className="flex flex-col items-center mt-4">
                      <span className="font-semibold mb-2 text-blue-800">{t('leave.attachment', 'ไฟล์แนบ')}:</span>
                      <img
                        src={`/leave-uploads/${selectedRequest.imgLeave}`}
                        alt="แนบไฟล์"
                        className="rounded-xl border-2 border-blue-200 shadow max-w-xs bg-white"
                        style={{ marginTop: 8 }}
                      />
                    </div>
                  )}
                </div>
              )}
            </DialogDescription>
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
            <DialogTitle>กรุณาระบุเหตุผลในการไม่อนุมัติ</DialogTitle>
          </DialogHeader>
          <textarea
            className="w-full border rounded p-2 mt-2"
            rows={3}
            placeholder="กรอกเหตุผล..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>ย้อนกลับ</Button>
            <Button variant="destructive" onClick={confirmReject} disabled={!rejectReason.trim()}>ยืนยัน</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
