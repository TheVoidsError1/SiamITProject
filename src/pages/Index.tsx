import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ToastAction } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/utils";
import { format as formatDateFns } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar, Clock, TrendingUp, Users, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

const Index = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Function to format date based on current language
  const formatCurrentDate = () => {
    const currentLanguage = i18n.language;
    const locale = currentLanguage === 'th' ? 'th-TH' : 'en-US';
    
    return new Date().toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };
  
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState([
    { title: t('main.daysRemaining'), value: "-", unit: t('common.days'), icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-50" },
    { title: t('main.daysUsed'), value: "-", unit: t('common.days'), icon: Clock, color: "text-green-600", bgColor: "bg-green-50" },
    { title: t('main.pendingRequests'), value: "-", unit: t('main.requests'), icon: Users, color: "text-orange-600", bgColor: "bg-orange-50" },
    { title: t('main.approvalRate'), value: "-", unit: "%", icon: TrendingUp, color: "text-purple-600", bgColor: "bg-purple-50" },
  ]);
  const [leaveStats, setLeaveStats] = useState({ sick: 0, vacation: 0, business: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState("");
  const [recentLeaveStats, setRecentLeaveStats] = useState<Record<string, { days: number; hours: number; quota?: number }>>({});
  const [loadingRecentStats, setLoadingRecentStats] = useState(true);
  const [errorRecentStats, setErrorRecentStats] = useState("");
  // Days remaining state (now for backdated requests)
  const [backdatedCount, setBackdatedCount] = useState<number | null>(null);
  const [loadingBackdated, setLoadingBackdated] = useState(true);
  const [errorBackdated, setErrorBackdated] = useState("");
  // Days used state
  const [daysUsed, setDaysUsed] = useState<{ days: number, hours: number } | null>(null);
  const [loadingDaysUsed, setLoadingDaysUsed] = useState(true);
  const [errorDaysUsed, setErrorDaysUsed] = useState("");
  // Recent leave requests state
  const [recentLeaves, setRecentLeaves] = useState<Array<{
    leavetype: string,
    leavetype_th?: string,
    leavetype_en?: string,
    duration: string,
    startdate: string,
    status: string
  }>>([]);
  const [loadingRecentLeaves, setLoadingRecentLeaves] = useState(true);
  const [errorRecentLeaves, setErrorRecentLeaves] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  // เพิ่ม state สำหรับ days used จาก filter
  const [filteredDaysUsed, setFilteredDaysUsed] = useState<number>(0);
  // เพิ่ม state สำหรับ hours used จาก filter
  const [filteredHoursUsed, setFilteredHoursUsed] = useState<number>(0);
  // เพิ่ม state สำหรับ totalDays/totalHours จาก recent leave stats
  const [recentTotalDays, setRecentTotalDays] = useState<number>(0);
  const [recentTotalHours, setRecentTotalHours] = useState<number>(0);

  const { showSessionExpiredDialog } = useAuth();

  // เพิ่มฟังก์ชันสำหรับเรียก API พร้อม month/year
  const fetchDashboardStats = (month?: number, year?: number) => {
    setLoadingStats(true);
    const token = localStorage.getItem("token");
    let url = "/api/dashboard-stats";
    if (month && year) url += `?month=${month}&year=${year}`;
    else if (year) url += `?year=${year}`;
    fetchWithAuth(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    }, undefined, showSessionExpiredDialog)
      ?.then((res) => res && res.json())
      .then((data) => {
        if (data && data.status === "success" && data.data) {
          setStats([
            { title: t('main.daysRemaining'), value: data.data.remainingDays, unit: t('common.days'), icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-50" },
            { title: t('main.daysUsed'), value: data.data.daysUsed, unit: t('common.days'), icon: Clock, color: "text-green-600", bgColor: "bg-green-50" },
            { title: t('main.pendingRequests'), value: data.data.pendingRequests, unit: t('main.requests'), icon: Users, color: "text-orange-600", bgColor: "bg-orange-50" },
            { title: t('main.approvalRate'), value: data.data.approvalRate, unit: "%", icon: TrendingUp, color: "text-purple-600", bgColor: "bg-purple-50" },
          ]);
          // อัปเดต filteredDaysUsed และ filteredHoursUsed สำหรับ Days Used card
          setFilteredDaysUsed(data.data.daysUsed || 0);
          setFilteredHoursUsed(data.data.hoursUsed || 0);
          const stats = data.data.leaveTypeStats || {};
          setLeaveStats({
            sick: stats["ลาป่วย"] || stats["sick"] || 0,
            vacation: stats["ลาพักผ่อน"] || stats["vacation"] || 0,
            business: stats["ลากิจ"] || stats["business"] || 0,
          });
        } else {
          setErrorStats(t('error.cannotLoadStats'));
        }
      })
      .catch(() => setErrorStats(t('error.apiConnectionError')))
      .finally(() => setLoadingStats(false));
  };

  // ปรับ useEffect ดึง /dashboard-recent-leave-stats ให้ส่ง month/year ไปกับ API
  useEffect(() => {
    setLoadingRecentStats(true);
    setErrorRecentStats("");
    const token = localStorage.getItem("token");
    let url = `/api/dashboard-recent-leave-stats`;
    if (selectedMonth && selectedYear) url += `?month=${selectedMonth}&year=${selectedYear}`;
    else if (selectedYear) url += `?year=${selectedYear}`;
    fetchWithAuth(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    }, logout, showSessionExpiredDialog)
      .then((res) => res && res.json())
      .then((data) => {
        if (data.status === "success" && data.data) {
          console.log('Recent leave stats data:', data.data); // Debug log
          setRecentLeaveStats(data.data.leaveTypeStats || {});
          setRecentTotalDays(data.data.totalDays || 0);
          setRecentTotalHours(data.data.totalHours || 0);
        } else {
          setErrorRecentStats(t('error.cannotLoadStats'));
        }
      })
      .catch(() => setErrorRecentStats(t('error.apiConnectionError')))
      .finally(() => setLoadingRecentStats(false));
  }, [selectedMonth, selectedYear, t, logout]);

  useEffect(() => {
    setLoadingBackdated(true);
    setErrorBackdated("");
    const token = localStorage.getItem("token");
    let url = "/api/my-backdated";
    if (selectedMonth && selectedYear) url += `?month=${selectedMonth}&year=${selectedYear}`;
    else if (selectedYear) url += `?year=${selectedYear}`;
    fetchWithAuth(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    }, logout, showSessionExpiredDialog)
      ?.then((res) => res && res.json())
      .then((data) => {
        if (data.status === "success" && data.data) {
          setBackdatedCount(data.data.count);
        } else {
          setErrorBackdated(t('error.apiConnectionError'));
        }
      })
      .catch(() => setErrorBackdated(t('error.apiConnectionError')))
      .finally(() => setLoadingBackdated(false));
  }, [selectedMonth, selectedYear, t, logout]);

  // useEffect เรียก fetchDashboardStats เมื่อ selectedMonth/selectedYear เปลี่ยน
  useEffect(() => {
    fetchDashboardStats(selectedMonth, selectedYear);
    // eslint-disable-next-line
  }, [selectedMonth, selectedYear, t, logout]);

  // Fetch days used
  useEffect(() => {
    setLoadingDaysUsed(true);
    setErrorDaysUsed("");
    const token = localStorage.getItem("token");
    let url = `/api/day-used`;
    if (selectedMonth && selectedYear) url += `?month=${selectedMonth}&year=${selectedYear}`;
    else if (selectedYear) url += `?year=${selectedYear}`;
    fetchWithAuth(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    }, logout, showSessionExpiredDialog)
      ?.then((res) => res && res.json())
      .then((data) => {
        if (data.status === "success" && data.data) {
          setDaysUsed(data.data);
        } else {
          setErrorDaysUsed(t('error.apiConnectionError'));
        }
      })
      .catch(() => setErrorDaysUsed(t('error.apiConnectionError')))
      .finally(() => setLoadingDaysUsed(false));
  }, [selectedMonth, selectedYear, t, logout]);

  // Fetch recent leave requests
  useEffect(() => {
    setLoadingRecentLeaves(true);
    setErrorRecentLeaves("");
    const token = localStorage.getItem("token");
    let url = `/api/recent-leave-requests`;
    if (selectedMonth && selectedYear) url += `?month=${selectedMonth}&year=${selectedYear}`;
    else if (selectedYear) url += `?year=${selectedYear}`;
    fetchWithAuth(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    }, logout, showSessionExpiredDialog)
      ?.then((res) => res && res.json())
      .then((data) => {
        if (data.status === "success" && data.data) {
          setRecentLeaves(data.data);
        } else {
          setErrorRecentLeaves(t('error.apiConnectionError'));
        }
      })
      .catch(() => setErrorRecentLeaves(t('error.apiConnectionError')))
      .finally(() => setLoadingRecentLeaves(false));
  }, [selectedMonth, selectedYear, t, logout]);

  // Localized date formatter for dashboard welcome section
  const formatFullDateLocalized = (date: Date) => {
    if (i18n.language === "th") {
      // วันจันทร์ที่ 14 กรกฎาคม 2568
      const weekday = formatDateFns(date, "EEEE", { locale: th });
      const day = date.getDate();
      const month = formatDateFns(date, "MMMM", { locale: th });
      const year = date.getFullYear() + 543;
      return `วัน${weekday}ที่ ${day} ${month} ${year}`;
    } else {
      // Monday, July 14, 2025
      return formatDateFns(date, "EEEE, MMMM d, yyyy");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {t('main.leaveManagementSystem')}
            </h1>
            <p className="text-sm text-gray-600">
              {t('main.welcomeMessage')}
            </p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      {/* ลด mt ของ Welcome Section และเพิ่ม pb ของ container หลัก */}
      <div className="p-6 pb-8 space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <div className="gradient-bg rounded-2xl p-6 text-white relative overflow-hidden mt-0">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-1">{t('main.hello')} {user?.full_name || t('common.user')}! 👋</h2>
            <p className="text-base text-blue-100 mb-3">
              {t('main.today')} {formatFullDateLocalized(new Date())}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              {/* Removed New Leave Request button */}
              <Popover open={showMonthPicker} onOpenChange={setShowMonthPicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white/80 text-blue-700 border-blue-200">
                    <CalendarIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">
                      {selectedMonth ? `${selectedMonth}/${selectedYear}` : `${selectedYear}`}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="flex flex-col items-center">
                    <div className="flex gap-2 mb-2">
                      <Button size="icon" variant="ghost" onClick={() => setSelectedYear(y => y - 1)}>
                        &lt;
                      </Button>
                      <span className="font-semibold text-lg">{selectedYear}</span>
                      <Button size="icon" variant="ghost" onClick={() => setSelectedYear(y => y + 1)}>
                        &gt;
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <Button
                        size="sm"
                        variant={selectedMonth === null ? "default" : "outline"}
                        className="w-16"
                        onClick={() => {
                          setSelectedMonth(null);
                          setShowMonthPicker(false);
                        }}
                      >
                        {t('common.allMonths')}
                      </Button>
                      {[...Array(12)].map((_, i) => (
                        <Button
                          key={i}
                          size="sm"
                          variant={selectedMonth === i + 1 ? "default" : "outline"}
                          className="w-16"
                          onClick={() => {
                            setSelectedMonth(i + 1);
                            setShowMonthPicker(false);
                          }}
                        >
                          {formatDateFns(new Date(selectedYear, i, 1), "MMM", { locale: i18n.language === 'th' ? th : undefined })}
                        </Button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full rainbow-gradient opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Backdated Requests Card (API-connected) */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md p-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-0.5">
                <p className="text-2xl font-bold">
                  {loadingBackdated ? (
                    <span>{t('common.loading')}</span>
                  ) : errorBackdated ? (
                    <span className="text-red-500">{errorBackdated}</span>
                  ) : backdatedCount !== null ? (
                    <span className="font-bold">{backdatedCount}</span>
                  ) : (
                    <span>-</span>
                  )}
                </p>
                <p className="text-base text-muted-foreground">
                  {t('main.backdatedRequests', 'Backdated Requests')}
                </p>
              </div>
            </CardContent>
          </Card>
          {/* Days Used Card (API-connected) */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md p-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-0.5">
                <p className="text-2xl font-bold">
                  {loadingDaysUsed ? (
                    <span>{t('common.loading')}</span>
                  ) : errorDaysUsed ? (
                    <span className="text-red-500">{errorDaysUsed}</span>
                  ) : daysUsed ? (
                    <>
                      <span className="font-bold">{daysUsed.days}</span>
                      <span className="text-base font-normal text-muted-foreground ml-1">{t('common.days')}</span>
                      {daysUsed.hours > 0 && (
                        <>
                          <span className="font-bold ml-2">{daysUsed.hours}</span>
                          <span className="text-base font-normal text-muted-foreground ml-1">{t('common.hour')}</span>
                        </>
                      )}
                    </>
                  ) : (
                    <span>-</span>
                  )}
                </p>
                <p className="text-base text-muted-foreground">
                  {t('main.daysUsed')}
                </p>
              </div>
            </CardContent>
          </Card>
          {/* Other stats cards (skip days remaining and days used from stats array) */}
          {stats.slice(2).map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.title} 
                className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md p-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-0.5">
                    <p className="text-2xl font-bold">
                      {stat.value}
                      <span className="text-base font-normal text-muted-foreground ml-1">
                        {stat.unit}
                      </span>
                    </p>
                    <p className="text-base text-muted-foreground">
                      {stat.title}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card className="border-0 shadow-md p-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <Calendar className="w-4 h-4 text-blue-600" />
                {t('main.quickActions')}
              </CardTitle>
              <CardDescription className="text-base">
                {t('main.quickActionsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/leave-request">
                <Button className="w-full justify-start text-base px-2 py-1" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  {t('main.newLeaveRequest')}
                </Button>
              </Link>
              <Link to="/leave-history">
                <Button className="w-full justify-start text-base px-2 py-1" variant="outline">
                  <Clock className="w-4 h-4 mr-2" />
                  {t('leave.leaveHistory')}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Leave Statistics (3 latest leave requests) */}
          <Card className="border-0 shadow-md p-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <TrendingUp className="w-4 h-4 text-green-600" />
                {t('main.recentLeaveStats')}
              </CardTitle>
              <CardDescription className="text-base">
                {t('main.recentLeaveStatsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRecentLeaves ? (
                <div className="text-center py-3 text-gray-500 text-base">{t('common.loading')}</div>
              ) : errorRecentLeaves ? (
                <div className="text-center py-3 text-red-500 text-base">{errorRecentLeaves}</div>
              ) : recentLeaves.length === 0 ? (
                <div className="text-center py-3 text-gray-500 text-base">{t('leave.noHistory')}</div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2 font-semibold text-base text-muted-foreground pb-1 border-b">
                    <span>{t('leave.leaveType', 'Leave Type')}</span>
                    <span>{t('leave.duration', 'Duration')}</span>
                    <span>{t('leave.status', 'Status')}</span>
                    <span>{t('leave.startDate', 'Start Date')}</span>
                  </div>
                  {recentLeaves.map((leave, idx) => {
                    // Helper to format duration with translation
                    const formatDuration = (duration: string) => {
                      // Expecting format like "2 day" or "1 day" or "1 hour"
                      const match = duration.match(/(\d+)\s*(day|hour)/i);
                      if (!match) return duration;
                      const count = Number(match[1]);
                      const unit = match[2].toLowerCase();
                      if (unit === "day") {
                        return `${count} ${t(`leave.day`, count === 1 ? t('leave.day') : t('leave.day'))}`;
                      } else if (unit === "hour") {
                        return `${count} ${t(`leave.hour`, count === 1 ? t('leave.hour') : t('leave.hour'))}`;
                      }
                      return duration;
                    };
                    return (
                      <div key={idx} className="grid grid-cols-4 gap-2 items-center border-b last:border-b-0 py-2">
                        <span className="text-base font-medium">{
                          i18n.language === 'th'
                            ? (leave.leavetype_th || leave.leavetype || t(`leaveTypes.${leave.leavetype}`, leave.leavetype))
                            : (leave.leavetype_en || leave.leavetype || t(`leaveTypes.${leave.leavetype}_en`, leave.leavetype))
                        }</span>
                        <span className="text-base">{formatDuration(leave.duration)}</span>
                        <span className={`text-base font-semibold ${leave.status === 'approved' ? 'text-green-600' : leave.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>{t(`leave.${leave.status}`, leave.status)}</span>
                        <span className="text-base text-muted-foreground">{leave.startdate ? formatDateFns(new Date(leave.startdate), 'dd/MM/yyyy') : '-'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
