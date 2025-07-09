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
import { Avatar } from "@/components/ui/avatar";

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
      title: 'อนุมัติทั้งหมด',
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 relative overflow-x-hidden">
      {/* Floating/Parallax Background Shapes */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[350px] h-[350px] rounded-full bg-gradient-to-br from-blue-200 via-indigo-100 to-purple-100 opacity-30 blur-2xl animate-float-slow" />
        <div className="absolute bottom-0 right-0 w-[250px] h-[250px] rounded-full bg-gradient-to-tr from-purple-200 via-blue-100 to-indigo-100 opacity-20 blur-xl animate-float-slow2" />
        <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full bg-blue-100 opacity-10 blur-xl animate-pulse-slow" style={{transform:'translate(-50%,-50%)'}} />
      </div>
      {/* Topbar */}
      <div className="border-b bg-white/80 backdrop-blur-sm z-10 relative shadow-lg">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight drop-shadow-lg animate-slide-in-left">{t('navigation.adminDashboard')}</h1>
            <p className="text-sm text-blue-500 animate-slide-in-left delay-100">{t('admin.dashboardDesc')}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>
      <div className="p-6 animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card 
                  key={stat.title} 
                  className="glass shadow-xl border-0 hover:scale-[1.03] hover:shadow-2xl transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <CardContent className="p-7 flex items-center gap-4">
                    <div className={`w-16 h-16 ${stat.bgColor} rounded-full flex items-center justify-center shadow-lg animate-float`}>
                      <Icon className={`w-8 h-8 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold text-blue-900 drop-shadow">{stat.value}</p>
                      <p className="text-base text-blue-500 font-medium">{stat.title}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {/* Main Content */}
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md glass bg-white/60 backdrop-blur-lg rounded-xl shadow-lg mb-4">
              <TabsTrigger value="pending" className="text-blue-700 font-bold text-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-400 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all">{t('admin.pendingRequests')}</TabsTrigger>
              <TabsTrigger value="recent" className="text-blue-700 font-bold text-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-400 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all">{t('admin.recentHistory')}</TabsTrigger>
            </TabsList>
            {/* Pending Requests */}
            <TabsContent value="pending" className="space-y-4">
              <Card className="glass shadow-2xl border-0 animate-fade-in-up">
                <CardHeader className="bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-400 text-white rounded-t-2xl p-5 shadow-lg">
                  <CardTitle className="flex items-center gap-3 text-2xl font-bold animate-slide-in-left">
                    <AlertCircle className="w-6 h-6" />
                    {t('admin.pendingLeaveRequests')}
                  </CardTitle>
                  <CardDescription className="text-blue-100 text-sm animate-slide-in-left delay-100">
                    {t('admin.pendingLeaveRequestsDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="text-lg text-center py-10">{t('common.loading')}</div>
                  ) : error ? (
                    <div className="text-lg text-center py-10 text-red-500">{error}</div>
                  ) : (
                    <div className="space-y-4 p-6">
                      {pendingRequests.length === 0 && (
                        <div className="text-center text-gray-500 text-base py-8 animate-fade-in-up">{t('admin.noPendingRequests')}</div>
                      )}
                      {pendingRequests.map((request, idx) => (
                        <div 
                          key={request.id}
                          className="glass bg-gradient-to-br from-white/80 via-blue-50/80 to-indigo-100/80 border-0 rounded-2xl p-5 shadow-md hover:shadow-xl transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-pop-in"
                          style={{ animationDelay: `${idx * 60}ms` }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-lg text-blue-900 mb-1 truncate">{typeof request.user === "string" ? JSON.parse(request.user).User_name : request.user?.User_name || "-"}</div>
                            <div className="text-base text-blue-700 mb-1">{request.leaveTypeName}</div>
                            <div className="text-sm text-gray-700 mb-1">{t('leave.date')}: {request.startDate} - {request.endDate}</div>
                          </div>
                          <Badge variant="outline" className="text-xs font-bold rounded-full px-4 py-1 bg-yellow-100 text-yellow-700 border-yellow-200 shadow">{t('admin.pending')}</Badge>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button 
                              size="sm" 
                              className="rounded-full px-4 py-2 font-bold bg-gradient-to-r from-green-500 to-emerald-400 text-white shadow hover:scale-105 transition"
                              onClick={() => handleApprove(request.id, typeof request.user === "string" ? JSON.parse(request.user).User_name : request.user?.User_name || "")}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />{t('admin.approve')}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="rounded-full px-4 py-2 font-bold shadow hover:scale-105 transition"
                              onClick={() => handleReject(request.id, typeof request.user === "string" ? JSON.parse(request.user).User_name : request.user?.User_name || "")}
                            >
                              <XCircle className="w-4 h-4 mr-1" />{t('admin.reject')}
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-full px-4 py-2 font-bold border-blue-200 text-blue-700 hover:bg-blue-50 shadow" onClick={() => handleViewDetails(request)}>
                              <Eye className="w-4 h-4 mr-1" />{t('admin.viewDetails')}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            {/* History Requests */}
            <TabsContent value="recent" className="space-y-4">
              <Card className="glass shadow-2xl border-0 animate-fade-in-up">
                <CardHeader className="bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-400 text-white rounded-t-2xl p-5 shadow-lg">
                  <CardTitle className="flex items-center gap-3 text-2xl font-bold animate-slide-in-left">
                    <Clock className="w-6 h-6" />
                    {t('admin.recentApprovalHistory')}
                  </CardTitle>
                  <CardDescription className="text-blue-100 text-sm animate-slide-in-left delay-100">
                    {t('admin.recentApprovalHistoryDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="text-lg text-center py-10">{t('common.loading')}</div>
                  ) : (
                    <div className="space-y-4 p-6">
                      {historyRequests.length === 0 && (
                        <div className="text-center text-gray-500 text-base py-8 animate-fade-in-up">{t('admin.noApprovalHistory')}</div>
                      )}
                      {historyRequests.map((request, idx) => {
                        // Format date
                        const startStr = request.startDate;
                        const endStr = request.endDate;
                        const leaveDays = request.startDate && request.endDate ? differenceInCalendarDays(new Date(request.endDate), new Date(request.startDate)) + 1 : '-';
                        return (
                          <div
                            key={request.id}
                            className="relative glass bg-gradient-to-br from-white/80 via-blue-50/80 to-indigo-100/80 border-0 rounded-2xl p-5 shadow-md hover:shadow-xl transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-pop-in"
                            style={{ animationDelay: `${idx * 60}ms` }}
                          >
                            <Badge
                              className={
                                (request.status === "approved"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-red-100 text-red-800 border-red-200") +
                                " flex items-center absolute right-6 top-6 rounded-full px-3 py-1 font-bold shadow"
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
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-lg text-blue-900 mb-1 truncate">{request.user?.User_name || "-"}</div>
                              <div className="text-base text-blue-700 mb-1">{request.leaveTypeName}</div>
                              <div className="text-sm text-gray-700 mb-1">{t('leave.date')}: {startStr} - {endStr} ({leaveDays} {t('leave.days')})</div>
                              <div className="text-xs text-gray-500">{t('leave.reason')}: {request.reason}</div>
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
                      <span className="font-semibold text-blue-800">เวลาที่ลา:</span> {selectedRequest?.startTime && selectedRequest?.endTime
                        ? `${selectedRequest.startTime} - ${selectedRequest.endTime}`
                        : 'ไม่มีการลาเป็น ชม.'}
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
