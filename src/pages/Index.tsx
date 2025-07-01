import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from "react";
import axios from "axios";

const Index = () => {
  const { user } = useAuth();
  const [dbUser, setDbUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    if (user?.id) {
      axios.get(`/api/users/${user.id}`)
        .then(res => {
          setDbUser({ name: res.data.data.name });
        })
        .catch(() => {
          // ถ้าไม่สามารถดึงข้อมูลจาก API ได้ ให้ใช้ข้อมูลจาก AuthContext
          setDbUser({ name: user.full_name || 'ผู้ใช้' });
        });
    } else if (user?.full_name) {
      // ถ้ามีข้อมูลชื่อผู้ใช้ใน AuthContext แล้ว ให้ใช้เลย
      setDbUser({ name: user.full_name });
    }
  }, [user]);

  const stats = [
    {
      title: "วันลาคงเหลือ",
      value: "12",
      unit: "วัน",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "วันลาที่ใช้แล้ว",
      value: "8",
      unit: "วัน",
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "คำขอที่รออนุมัติ",
      value: "2",
      unit: "คำขอ",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "อัตราการอนุมัติ",
      value: "95",
      unit: "%",
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
              ระบบจัดการการลา
            </h1>
            <p className="text-sm text-gray-600">
              ยินดีต้อนรับเข้าสู่ระบบลาออนไลน์ของบริษัทสยามไอที
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <div className="gradient-bg rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">
              สวัสดี {
                user?.role === 'admin'
                  ? (dbUser?.name || user?.full_name || 'แอดมิน')
                  : (dbUser?.name || user?.full_name || 'ผู้ใช้')
              }! 👋
            </h2>
            <p className="text-blue-100 mb-6">
              วันนี้เป็นวันที่ {new Date().toLocaleDateString('th-TH', {
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
                ยื่นคำขอลาใหม่
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
                การกระทำด่วน
              </CardTitle>
              <CardDescription>
                เข้าถึงฟังก์ชันที่ใช้บ่อยได้อย่างรวดเร็ว
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/leave-request">
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  ยื่นคำขอลาใหม่
                </Button>
              </Link>
              <Link to="/leave-history">
                <Button className="w-full justify-start" variant="outline">
                  <Clock className="w-4 h-4 mr-2" />
                  ดูประวัติการลา
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                สถิติการลาล่าสุด
              </CardTitle>
              <CardDescription>
                ข้อมูลการใช้วันลาในเดือนนี้
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">ลาป่วย</span>
                  <span className="font-medium">2 วัน</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">ลาพักผ่อน</span>
                  <span className="font-medium">5 วัน</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">ลากิจ</span>
                  <span className="font-medium">1 วัน</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
