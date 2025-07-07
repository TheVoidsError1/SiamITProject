<<<<<<< HEAD
=======

>>>>>>> origin/db_yod
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
<<<<<<< HEAD
import { useEffect, useState } from "react";

const Index = () => {
  const stats = [
    {
      title: "วันลาคงเหลือ",
      value: "12",
      unit: "วัน",
=======
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Index = () => {
  const { t } = useTranslation();

  const stats = [
    {
      title: t('main.daysRemaining'),
      value: "12",
      unit: t('common.days'),
>>>>>>> origin/db_yod
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
<<<<<<< HEAD
      title: "วันลาที่ใช้แล้ว",
      value: "8",
      unit: "วัน",
=======
      title: t('main.daysUsed'),
      value: "8",
      unit: t('common.days'),
>>>>>>> origin/db_yod
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
<<<<<<< HEAD
      title: "คำขอที่รออนุมัติ",
      value: "2",
      unit: "คำขอ",
=======
      title: t('main.pendingRequests'),
      value: "2",
      unit: t('main.requests'),
>>>>>>> origin/db_yod
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
<<<<<<< HEAD
      title: "อัตราการอนุมัติ",
=======
      title: t('main.approvalRate'),
>>>>>>> origin/db_yod
      value: "95",
      unit: "%",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

<<<<<<< HEAD
  const [leaveStats, setLeaveStats] = useState({ sick: 0, vacation: 0, business: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState("");

  useEffect(() => {
    setLoadingStats(true);
    const token = localStorage.getItem("token");
    fetch("/api/leave-request/statistics-by-type", {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLeaveStats(data.data);
        } else {
          setErrorStats("ไม่สามารถโหลดข้อมูลสถิติการลาได้");
        }
      })
      .catch(() => setErrorStats("เกิดข้อผิดพลาดในการเชื่อมต่อ API"))
      .finally(() => setLoadingStats(false));
  }, []);

=======
>>>>>>> origin/db_yod
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
<<<<<<< HEAD
              ระบบจัดการการลา
            </h1>
            <p className="text-sm text-gray-600">
              ยินดีต้อนรับเข้าสู่ระบบลาออนไลน์ของบริษัทสยามไอที
            </p>
          </div>
=======
              {t('main.leaveManagementSystem')}
            </h1>
            <p className="text-sm text-gray-600">
              {t('main.welcomeMessage')}
            </p>
          </div>
          <LanguageSwitcher />
>>>>>>> origin/db_yod
        </div>
      </div>

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <div className="gradient-bg rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
<<<<<<< HEAD
            <h2 className="text-3xl font-bold mb-2">สวัสดี สมชาย ใจดี! 👋</h2>
            <p className="text-blue-100 mb-6">
              วันนี้เป็นวันที่ {new Date().toLocaleDateString('th-TH', {
=======
            <h2 className="text-3xl font-bold mb-2">{t('main.hello')} สมชาย ใจดี! 👋</h2>
            <p className="text-blue-100 mb-6">
              {t('main.today')} {new Date().toLocaleDateString('th-TH', {
>>>>>>> origin/db_yod
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
            <Link to="/leave-request">
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-blue-50 font-medium"
              >
<<<<<<< HEAD
                ยื่นคำขอลาใหม่
=======
                {t('main.newLeaveRequest')}
>>>>>>> origin/db_yod
              </Button>
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full rainbow-gradient opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.title} 
                className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      {stat.value}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        {stat.unit}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
<<<<<<< HEAD
                การกระทำด่วน
              </CardTitle>
              <CardDescription>
                เข้าถึงฟังก์ชันที่ใช้บ่อยได้อย่างรวดเร็ว
=======
                {t('main.quickActions')}
              </CardTitle>
              <CardDescription>
                {t('main.quickActionsDesc')}
>>>>>>> origin/db_yod
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/leave-request">
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
<<<<<<< HEAD
                  ยื่นคำขอลาใหม่
=======
                  {t('main.newLeaveRequest')}
>>>>>>> origin/db_yod
                </Button>
              </Link>
              <Link to="/leave-history">
                <Button className="w-full justify-start" variant="outline">
                  <Clock className="w-4 h-4 mr-2" />
<<<<<<< HEAD
                  ดูประวัติการลา
=======
                  {t('leave.leaveHistory')}
>>>>>>> origin/db_yod
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
<<<<<<< HEAD
                สถิติการลาล่าสุด
              </CardTitle>
              <CardDescription>
                ข้อมูลการใช้วันลาในเดือนนี้
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="text-center py-6 text-gray-500">กำลังโหลดข้อมูล...</div>
              ) : errorStats ? (
                <div className="text-center py-6 text-red-500">{errorStats}</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">ลาป่วย</span>
                    <span className="font-medium">{leaveStats.sick} วัน</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">ลาพักผ่อน</span>
                    <span className="font-medium">{leaveStats.vacation} วัน</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">ลากิจ</span>
                    <span className="font-medium">{leaveStats.business} วัน</span>
                  </div>
                </div>
              )}
=======
                {t('main.recentLeaveStats')}
              </CardTitle>
              <CardDescription>
                {t('main.recentLeaveStatsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t('leaveTypes.sick')}</span>
                  <span className="font-medium">2 {t('common.days')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t('leaveTypes.vacation')}</span>
                  <span className="font-medium">5 {t('common.days')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t('leaveTypes.personal')}</span>
                  <span className="font-medium">1 {t('common.days')}</span>
                </div>
              </div>
>>>>>>> origin/db_yod
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default Index;
=======
export default Index;
>>>>>>> origin/db_yod
