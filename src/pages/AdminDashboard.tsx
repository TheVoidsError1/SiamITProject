import React, { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Clock, TrendingUp, AlertCircle, CheckCircle, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const { toast } = useToast();

  const [adminName, setAdminName] = useState<string>("");
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetch("/api/admin/list")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setAdminName(data.data[0].admin_name);
        }
      });

    setLoading(true);
    fetch("/api/leave-request/full")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // แยก pending กับ recent
          const pending = data.data.filter((item: any) => !item.status || item.status === "pending");
          const recent = data.data.filter((item: any) => item.status === "approved");
          setPendingRequests(pending);
          setRecentRequests(recent);
        } else {
          setError("ไม่สามารถโหลดข้อมูลคำขอลาได้");
        }
      })
      .catch(() => setError("เกิดข้อผิดพลาดในการเชื่อมต่อ API"))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = (id: number, employeeName: string) => {
    const token = localStorage.getItem('token');

    fetch(`/api/leave-request/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'approved' }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          toast({ title: "อนุมัติเรียบร้อย! ✅", description: `อนุมัติคำขอลาของ ${employeeName} แล้ว` });
          // รีเฟรชข้อมูล
          refreshLeaveRequests();
        }
      });
  };

  const handleReject = (id: number, employeeName: string) => {
    const token = localStorage.getItem('token');

    fetch(`/api/leave-request/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'rejected' }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          toast({ title: "ไม่อนุมัติคำขอ ❌", description: `ไม่อนุมัติคำขอลาของ ${employeeName}`, variant: "destructive" });
          // รีเฟรชข้อมูล
          refreshLeaveRequests();
        }
      });
  };

  // เพิ่มฟังก์ชันสำหรับรีเฟรชข้อมูล
  const refreshLeaveRequests = () => {
    setLoading(true);
    fetch("/api/leave-request/full")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const pending = data.data.filter((item: any) => !item.status || item.status === "pending");
          const recent = data.data.filter((item: any) => item.status === "approved");
          setPendingRequests(pending);
          setRecentRequests(recent);
        } else {
          setError("ไม่สามารถโหลดข้อมูลคำขอลาได้");
        }
      })
      .catch(() => setError("เกิดข้อผิดพลาดในการเชื่อมต่อ API"))
      .finally(() => setLoading(false));
  };

  const stats = [
    {
      title: "คำขอรออนุมัติ",
      value: "8",
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "อนุมัติในเดือนนี้",
      value: "24",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "พนักงานทั้งหมด",
      value: "45",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "วันลาเฉลี่ย",
      value: "12.5",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              จัดการระบบ {adminName && `- ผู้ดูแล: ${adminName}`}
            </h1>
            <p className="text-sm text-gray-600">
              แดชบอร์ดสำหรับผู้บริหาร
            </p>
          </div>
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
              <TabsTrigger value="pending">คำขอรออนุมัติ</TabsTrigger>
              <TabsTrigger value="recent">ประวัติล่าสุด</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              <Card className="border-0 shadow-lg">
                <CardHeader className="gradient-bg text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    คำขอลาที่รออนุมัติ
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    กรุณาพิจารณาอนุมัติคำขอลาของพนักงาน
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {loading ? (
                    <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูล...</div>
                  ) : error ? (
                    <div className="text-center py-10 text-red-500">{error}</div>
                  ) : (
                    <div className="space-y-4">
                      {pendingRequests.map((request) => (
                        <div 
                          key={request.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{request.user?.User_name || "-"}</h3>
                              <p className="text-sm text-gray-600">{request.leaveType}</p>
                            </div>
                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                              รออนุมัติ
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700">วันที่ลา:</p>
                              <p className="text-sm text-gray-600">
                                {format(new Date(request.startDate), "dd MMM", { locale: th })} - {format(new Date(request.endDate), "dd MMM yyyy", { locale: th })}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">ส่งคำขอเมื่อ:</p>
                              <p className="text-sm text-gray-600">
                                {request.createdAt ? format(new Date(request.createdAt), "dd MMMM yyyy", { locale: th }) : "-"}
                              </p>
                            </div>
                          </div>
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700">เหตุผล:</p>
                            <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                          </div>
                          <div className="flex gap-3">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(request.id, request.user?.User_name || "")}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              อนุมัติ
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleReject(request.id, request.user?.User_name || "")}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              ไม่อนุมัติ
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-2" />
                              ดูรายละเอียด
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
                    ประวัติการอนุมัติล่าสุด
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    รายการคำขอลาที่ประมวลผลแล้ว
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {loading ? (
                    <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูล...</div>
                  ) : error ? (
                    <div className="text-center py-10 text-red-500">{error}</div>
                  ) : (
                    <div className="space-y-4">
                      {recentRequests.map((request) => (
                        <div 
                          key={request.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{request.user?.User_name || "-"}</h3>
                              <p className="text-sm text-gray-600">{request.leaveType}</p>
                            </div>
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              อนุมัติแล้ว
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700">วันที่ลา:</p>
                              <p className="text-sm text-gray-600">
                                {format(new Date(request.startDate), "dd MMM", { locale: th })} - {format(new Date(request.endDate), "dd MMM yyyy", { locale: th })}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">อนุมัติเมื่อ:</p>
                              <p className="text-sm text-gray-600">
                                {request.approvedTime ? format(new Date(request.approvedTime), "dd MMMM yyyy HH:mm", { locale: th }) : "-"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
