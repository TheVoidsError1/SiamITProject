import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInCalendarDays } from "date-fns";
import { th } from "date-fns/locale";
import { AlertCircle, CheckCircle, Clock, Eye, TrendingUp, Users, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // ลบ state ที่ไม่ได้ใช้จริง
  // const [adminName, setAdminName] = useState<string>("");
  // const [userCount, setUserCount] = useState<number>(0);
  // const [approvedThisMonth, setApprovedThisMonth] = useState<number>(0);
  // const [pendingCount, setPendingCount] = useState<number>(0);
  // const [averageDayOff, setAverageDayOff] = useState<number>(0);

  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [historyRequests, setHistoryRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingRequest, setRejectingRequest] = useState<any | null>(null);
  const [dashboardStats, setDashboardStats] = useState({
    pendingCount: 0,
    approvedCount: 0,
    userCount: 0,
    averageDayOff: 0,
  });

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
    fetch("http://localhost:3001/api/leave-request/history", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setHistoryRequests(data.data);
        } else {
          setHistoryRequests([]);
        }
      })
      .catch(() => setHistoryRequests([]))
      .finally(() => setLoading(false));
  };

  // โหลด leave request ที่ pending จาก API
  useEffect(() => {
    const fetchPending = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch("http://localhost:3001/api/leave-request/pending", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === "success") {
          setPendingRequests(data.data);
        } else {
          setError(t('admin.loadError'));
        }
      } catch (e) {
        setError(t('admin.connectionError'));
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, [t]);

  useEffect(() => {
    fetchHistoryRequests();
  }, [t]);

  useEffect(() => {
    fetch("http://localhost:3001/api/leave-request/dashboard-stats")
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setDashboardStats(data.data);
        }
      });
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
                              <p className="text-sm text-gray-600">{request.leaveTypeName}</p>
                            </div>
                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                              {t('admin.pending')}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700">{t('leave.date')}:</p>
                              <p className="text-sm text-gray-600">
                                {request.startDate} - {request.endDate}
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
                            <Button size="sm" variant="outline" onClick={() => handleViewDetails(request)}>
                              <Eye className="w-4 h-4 mr-2" />
                              {t('admin.viewDetails')}
                            </Button>
                          </div>
                        </div>
                      ))}
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
                  {loading ? (
                    <div className="text-center py-10 text-gray-500">{t('common.loading')}</div>
                  ) : (
                    <div className="space-y-4">
                      {historyRequests.length === 0 && (
                        <div className="text-center text-gray-500">{t('admin.noApprovalHistory')}</div>
                      )}
                      {historyRequests.map((request) => {
                        // คำนวณจำนวนวันลา
                        const start = new Date(request.startDate);
                        const end = new Date(request.endDate);
                        const leaveDays = differenceInCalendarDays(end, start) + 1;
                        // แปลงวันที่เป็นภาษาไทย
                        const startStr = format(start, "d MMM yyyy", { locale: th });
                        const endStr = format(end, "d MMM yyyy", { locale: th });
                        // วันที่อนุมัติ/ไม่อนุมัติ
                        let statusDate = "-";
                        if (request.status === "approved" && request.approvedTime) {
                          statusDate = format(new Date(request.approvedTime), "d MMMM yyyy", { locale: th });
                        } else if (request.status === "rejected" && request.rejectedTime) {
                          statusDate = format(new Date(request.rejectedTime), "d MMMM yyyy", { locale: th });
                        }
                        return (
                          <div
                            key={request.id}
                            className="relative border border-gray-200 rounded-lg p-6 flex flex-col md:flex-row md:items-end md:justify-between"
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

                            {/* ฝั่งซ้ายล่าง */}
                            <div className="flex-1">
                              <div className="font-bold text-lg mb-1">{request.user?.User_name || "-"}</div>
                              <div className="text-base text-gray-700 mb-2">{request.leaveTypeName}</div>
                              <div className="text-sm text-gray-700 mb-1">
                                {t('leave.date')}: {startStr} - {endStr} ({leaveDays} {t('leave.day')})
                              </div>
                            </div>
                            {/* ฝั่งขวาล่าง (วันที่อนุมัติ) */}
                            <div className="flex flex-col items-end text-right gap-2 mt-4 md:mt-0 md:ml-8 min-w-[180px]">
                              <div className="text-sm text-gray-700">
                                {request.status === "approved"
                                  ? `${t('admin.approvedWhen')} ${statusDate !== '-' ? statusDate : '-'}`
                                  : request.status === "rejected"
                                    ? `${t('admin.rejectedWhen')} ${statusDate !== '-' ? statusDate : '-'}`
                                    : ''}
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
                      <span className="font-semibold text-blue-800">{t('leave.position', 'ตำแหน่ง')}:</span> {selectedRequest.employeeType || "-"}
                    </div>
                    <div>
                      <span className="font-semibold text-blue-800">{t('leave.department', 'แผนก')}:</span> {selectedRequest.user?.department || "-"}
                    </div>
                    <div>
                      <span className="font-semibold text-blue-800">{t('leave.type', 'ประเภทการลา')}:</span> {selectedRequest.leaveTypeName}
                    </div>
                    <div>
                      <span className="font-semibold text-blue-800">{t('leave.reason', 'เหตุผล')}:</span> {selectedRequest.reason}
                    </div>
                    <div>
                      <span className="font-semibold text-blue-800">{t('leave.date', 'วันที่ลา')}:</span> {selectedRequest.startDate} - {selectedRequest.endDate}
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
