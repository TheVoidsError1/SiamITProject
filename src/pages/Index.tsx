import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, TrendingUp, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import NotificationBell from "@/components/NotificationBell";
import { Avatar } from "@/components/ui/avatar";
import { holidays } from "@/constants/holidays";
import { getUpcomingThaiHolidays, getThaiHolidaysByMonth } from "@/constants/getThaiHolidays";

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
  }, [t]);

  // Chart data for demo
  const chartData = [
    { name: t('leaveTypes.sick'), value: leaveStats.sick },
    { name: t('leaveTypes.vacation'), value: leaveStats.vacation },
    { name: t('leaveTypes.personal'), value: leaveStats.business },
  ];

  // MOCK: Recent notifications
  const recentNotifications = [
    { id: 1, title: 'คำขอลาได้รับการอนุมัติ', message: 'ลาพักผ่อน 15-17 มี.ค. ได้รับการอนุมัติ', time: '2 ชม.ที่แล้ว', type: 'success' },
    { id: 2, title: 'เตือนวันลาคงเหลือ', message: 'คุณมีวันลาพักผ่อนเหลือ 7 วัน', time: '1 วันที่แล้ว', type: 'info' },
    { id: 3, title: 'คำขอลาถูกปฏิเสธ', message: 'ลาธุรกิจ 10 มี.ค. ถูกปฏิเสธ', time: '3 วันที่แล้ว', type: 'error' },
  ];
  // MOCK: Recent leave requests
  const recentLeaves = [
    { id: 1, type: t('leaveTypes.sick'), date: '12 มี.ค. 67', status: 'approved' },
    { id: 2, type: t('leaveTypes.vacation'), date: '5-7 มี.ค. 67', status: 'pending' },
    { id: 3, type: t('leaveTypes.personal'), date: '1 มี.ค. 67', status: 'rejected' },
  ];
  // Upcoming holidays (Thai calendar, 3 next)
  const upcomingHolidays = getUpcomingThaiHolidays(3);
  // State สำหรับเลือกเดือน/ปี
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const months = [
    t('month.jan'), t('month.feb'), t('month.mar'), t('month.apr'), t('month.may'), t('month.jun'),
    t('month.jul'), t('month.aug'), t('month.sep'), t('month.oct'), t('month.nov'), t('month.dec')
  ];
  const holidaysOfMonth = getThaiHolidaysByMonth(selectedYear, selectedMonth);
  // MOCK: Announcements
  const announcements = [
    { id: 1, title: 'ปรับปรุงระบบ', message: 'ระบบจะปิดปรับปรุง 20 มี.ค. 22:00-23:00 น.' },
    { id: 2, title: 'กิจกรรมบริษัท', message: 'เชิญร่วมกิจกรรม Outing 30 เม.ย. ลงทะเบียนได้ที่ HR' },
  ];
  // MOCK: User summary
  const user = { name: 'สมชาย ใจดี', position: t('positions.employee'), department: t('departments.hr'), avatar: '', email: 'somchai@company.com' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-indigo-900 transition-colors relative overflow-x-hidden">
      {/* Parallax/Floating Background Shapes */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[350px] h-[350px] rounded-full bg-gradient-to-br from-blue-200 via-indigo-100 to-purple-100 opacity-30 blur-2xl animate-float-slow" />
        <div className="absolute bottom-0 right-0 w-[250px] h-[250px] rounded-full bg-gradient-to-tr from-purple-200 via-blue-100 to-indigo-100 opacity-20 blur-xl animate-float-slow2" />
        <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full bg-blue-100 opacity-10 blur-xl animate-pulse-slow" style={{transform:'translate(-50%,-50%)'}} />
      </div>
      {/* Top Bar */}
      <div className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
        <div className="flex h-14 items-center px-3 gap-3">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-500 to-purple-500 tracking-tight drop-shadow-lg animate-fade-in-up">{t('main.leaveManagementSystem')}</h1>
            <p className="text-sm text-blue-500 dark:text-blue-200 animate-fade-in-up delay-100">{t('main.welcomeMessage')}</p>
          </div>
          <NotificationBell />
          <LanguageSwitcher />
          {/* Dark mode toggle */}
          <button
            className="ml-2 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            onClick={() => { document.documentElement.classList.toggle('dark'); }}
            aria-label="Toggle dark mode"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-yellow-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.07l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.93l-.71-.71" />
              <circle cx="12" cy="12" r="5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-3 space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <div className="relative rounded-2xl p-5 text-white overflow-hidden glass shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in-up bg-gradient-to-tr from-blue-100 via-indigo-200 to-purple-100">
          <div className="z-10 flex-1 space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-1 drop-shadow-lg animate-slide-in-left" style={{ color: '#2563eb' }}>{t('main.hello')} สมชาย ใจดี! 👋</h2>
            <p className="mb-3 text-base font-medium animate-slide-in-left delay-100" style={{ color: '#6366f1' }}>
              {t('main.today')} {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
            <Link to="/leave-request">
              <Button 
                size="default" 
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-blue-100 font-bold shadow-lg border-0 px-6 py-2 text-base rounded-lg animate-bounce-in"
              >
                {t('main.newLeaveRequest')}
              </Button>
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full" style={{ background: 'linear-gradient(90deg, #fffbe6 0%, #ffe082 100%)', opacity: 0.18, transform: 'translateY(-50%) translateX(50%)' }}></div>
          <div className="flex-1 flex items-center justify-center animate-float">
            <img src="/public/lovable-uploads/siamit.png" alt="Logo" className="w-28 h-28 object-contain drop-shadow-2xl animate-float" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.title} 
                className="group border-0 shadow-xl bg-white/60 backdrop-blur-lg rounded-xl flex flex-col items-center justify-center py-5 px-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:bg-white/80 relative overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center mb-1 shadow group-hover:scale-110 transition-transform duration-200 animate-pop-in`}> <Icon className={`w-6 h-6 ${stat.color}`} /> </div>
                  <div className="text-2xl font-extrabold text-blue-800 group-hover:text-blue-900 transition-colors animate-pop-in delay-100">
                    {stat.value}
                    <span className="text-sm font-normal text-blue-400 ml-1">{stat.unit}</span>
                  </div>
                  <div className="text-sm text-blue-600 font-medium mt-1 text-center opacity-90 animate-pop-in delay-200">
                    {stat.title}
                  </div>
                </div>
                {/* Glass shine effect */}
                <div className="absolute left-0 top-0 w-full h-full pointer-events-none overflow-hidden">
                  <div className="absolute -left-1/2 -top-1/2 w-2/3 h-2/3 bg-white/40 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-all duration-300 animate-shine" />
                </div>
              </Card>
            );
          })}
        </div>

        {/* --- NEW: User Summary, Notifications, Holidays, Announcements --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* User Summary */}
          <Card className="glass shadow-xl border-0 flex flex-col items-center justify-center p-5 animate-fade-in-up">
            <Avatar className="w-16 h-16 mb-2">
              {/* If user.avatar, show image, else fallback */}
              <span className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200 text-blue-900 font-bold text-2xl rounded-full">
                {user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
              </span>
            </Avatar>
            <div className="text-lg font-bold text-blue-900 mt-1">{user.name}</div>
            <div className="text-sm text-blue-500">{user.position}</div>
            <div className="text-xs text-blue-400 mb-1">{user.department}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </Card>
          {/* Recent Notifications */}
          <Card className="glass shadow-xl border-0 p-0 animate-fade-in-up">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-blue-700 text-base font-bold animate-slide-in-left">
                <Bell className="w-5 h-5 text-blue-500" />
                {t('main.recentNotifications') || 'แจ้งเตือนล่าสุด'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
              {recentNotifications.map((n, idx) => (
                <div key={n.id} className={`flex items-start gap-2 p-2 rounded-xl glass bg-gradient-to-br from-white/80 via-blue-50/80 to-indigo-100/80 shadow border-0 transition-all duration-200 animate-pop-in ${n.type === 'success' ? 'border-green-200' : n.type === 'error' ? 'border-red-200' : 'border-blue-200'}`} style={{ animationDelay: `${idx * 60}ms` }}>
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full ${n.type === 'success' ? 'bg-green-100 text-green-600' : n.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    <Bell className="w-4 h-4" />
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-blue-900">{n.title}</div>
                    <div className="text-xs text-gray-500">{n.message}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{n.time}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          {/* Upcoming Holidays/Events Section */}
          <Card className="glass shadow-xl border-0 p-0 animate-fade-in-up">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-blue-700 text-base font-bold animate-slide-in-left">
                <Calendar className="w-5 h-5 text-blue-500" />
                {t('main.upcomingHolidays') || 'วันหยุด/กิจกรรม'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-6 h-6 text-blue-400 animate-bounce" />
                <h2 className="text-xl font-bold text-blue-900 drop-shadow">{t('main.upcomingHolidays')}</h2>
              </div>
              {/* Dropdown เลือกเดือน/ปี */}
              <div className="flex gap-2 mb-2">
                <select
                  className="rounded-lg border px-2 py-1 text-blue-700 bg-white/80 shadow"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                >
                  {months.map((m, idx) => (
                    <option key={idx} value={idx}>{m}</option>
                  ))}
                </select>
                <select
                  className="rounded-lg border px-2 py-1 text-blue-700 bg-white/80 shadow"
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                >
                  {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                    <option key={y} value={y}>{y + 543}</option>
                  ))}
                </select>
              </div>
              <ul className="space-y-2">
                {holidaysOfMonth.length === 0 ? (
                  <li className="text-blue-500 italic">{t('main.noUpcomingHolidays')}</li>
                ) : (
                  holidaysOfMonth.map(h => (
                    <li key={h.date} className="flex items-center gap-3 bg-white/60 rounded-xl px-4 py-2 shadow hover:bg-blue-50 transition animate-pop-in">
                      <span className="font-bold text-blue-700 w-24">{new Date(h.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <span className="text-blue-900 font-medium">{h.name}</span>
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>
          {/* Announcements */}
          <Card className="glass shadow-xl border-0 p-0 animate-fade-in-up">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-blue-700 text-base font-bold animate-slide-in-left">
                <Bell className="w-5 h-5 text-purple-500" />
                {t('main.announcements') || 'ข่าวสารบริษัท'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
              {announcements.map((a, idx) => (
                <div key={a.id} className="flex items-start gap-2 p-2 rounded-xl glass bg-gradient-to-br from-white/80 via-blue-50/80 to-indigo-100/80 shadow border-0 animate-pop-in" style={{ animationDelay: `${idx * 60}ms` }}>
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">
                    <Bell className="w-4 h-4" />
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-blue-900">{a.title}</div>
                    <div className="text-xs text-gray-500">{a.message}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        {/* --- END NEW SECTION --- */}

        {/* Quick Actions & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Quick Actions */}
          <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-lg rounded-xl p-0 flex flex-col justify-between min-h-[180px] animate-fade-in-up">
            <CardHeader className="pb-2 flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-blue-700 text-lg font-bold animate-slide-in-left">
                <Calendar className="w-5 h-5 text-blue-500" />
                {t('main.quickActions')}
              </CardTitle>
              <CardDescription className="text-blue-400 text-sm animate-slide-in-left delay-100">
                {t('main.quickActionsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
              <Link to="/leave-request">
                <Button className="w-full justify-start btn-blue-outline-lg text-base py-2 px-3 gap-2 animate-pop-in" variant="outline">
                  <Calendar className="w-5 h-5" />
                  {t('main.newLeaveRequest')}
                </Button>
              </Link>
              <Link to="/leave-history">
                <Button className="w-full justify-start btn-blue-outline-lg text-base py-2 px-3 gap-2 animate-pop-in delay-100" variant="outline">
                  <Clock className="w-5 h-5" />
                  {t('leave.leaveHistory')}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Leave Stats */}
          <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-lg rounded-xl p-0 flex flex-col min-h-[180px] animate-fade-in-up">
            <CardHeader className="pb-2 flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-blue-700 text-lg font-bold animate-slide-in-left">
                <TrendingUp className="w-5 h-5 text-green-500" />
                {t('main.recentLeaveStats')}
              </CardTitle>
              <CardDescription className="text-blue-400 text-sm animate-slide-in-left delay-100">
                {t('main.recentLeaveStatsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
              {loadingStats ? (
                <div className="text-center py-6 text-gray-500 animate-pulse text-base">{t('common.loading')}</div>
              ) : errorStats ? (
                <div className="text-center py-6 text-red-500 animate-shake text-base">{errorStats}</div>
              ) : (
                <div className="space-y-2">
                  <div className="bg-blue-50 rounded-xl p-3 animate-fade-in-up">
                    <ResponsiveContainer width="100%" height={110}>
                      <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ef" />
                        <XAxis dataKey="name" stroke="#60a5fa" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} stroke="#60a5fa" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip wrapperStyle={{ borderRadius: 10, background: '#fff', color: '#2563eb', fontWeight: 500, fontSize: 13 }} />
                        <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} isAnimationActive={true} animationDuration={900} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex justify-between items-center text-blue-700 text-sm font-medium">
                      <span>{t('leaveTypes.sick')}</span>
                      <span className="font-bold text-lg">{leaveStats.sick} <span className="text-sm font-normal text-blue-400">{t('common.days')}</span></span>
                    </div>
                    <div className="flex justify-between items-center text-blue-700 text-sm font-medium">
                      <span>{t('leaveTypes.vacation')}</span>
                      <span className="font-bold text-lg">{leaveStats.vacation} <span className="text-sm font-normal text-blue-400">{t('common.days')}</span></span>
                    </div>
                    <div className="flex justify-between items-center text-blue-700 text-sm font-medium">
                      <span>{t('leaveTypes.personal')}</span>
                      <span className="font-bold text-lg">{leaveStats.business} <span className="text-sm font-normal text-blue-400">{t('common.days')}</span></span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Recent Leave Requests */}
        <Card className="glass shadow-xl border-0 animate-fade-in-up mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-blue-700 text-lg font-bold animate-slide-in-left">
              <Clock className="w-5 h-5 text-blue-500" />
              {t('main.recentLeaveRequests') || 'คำขอลาล่าสุด'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-0">
            {recentLeaves.map((l, idx) => (
              <div key={l.id} className={`flex items-center gap-3 p-3 rounded-xl glass bg-gradient-to-br from-white/80 via-blue-50/80 to-indigo-100/80 shadow border-0 animate-pop-in`} style={{ animationDelay: `${idx * 60}ms` }}>
                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-base">
                  {l.type[0]}
                </span>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-blue-900">{l.type}</div>
                  <div className="text-xs text-gray-500">{l.date}</div>
                </div>
                <span className={`text-xs font-bold rounded-full px-3 py-1 ${l.status === 'approved' ? 'bg-green-100 text-green-600' : l.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>{l.status === 'approved' ? t('leave.approved') : l.status === 'pending' ? t('leave.pending') : t('leave.rejected')}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <style>{`
          .btn-blue-outline-lg {
            border: 1.5px solid #3b82f6;
            color: #2563eb;
            border-radius: 1rem;
            font-weight: 500;
            background: transparent;
            font-size: 1.1rem;
            transition: background 0.15s, color 0.15s;
          }
          .btn-blue-outline-lg:hover {
            background: #eff6ff;
            color: #1e293b;
          }
          .animate-float { animation: float 3s ease-in-out infinite alternate; }
          .animate-float-slow { animation: float 8s ease-in-out infinite alternate; }
          .animate-float-slow2 { animation: float 12s ease-in-out infinite alternate; }
          .animate-fade-in { animation: fadeIn 1.2s cubic-bezier(0.23, 1, 0.32, 1); }
          .animate-fade-in-up { animation: fadeInUp 1.1s cubic-bezier(0.23, 1, 0.32, 1); }
          .animate-slide-in-left { animation: slideInLeft 1.1s cubic-bezier(0.23, 1, 0.32, 1); }
          .animate-pop-in { animation: popIn 0.7s cubic-bezier(0.23, 1, 0.32, 1); }
          .animate-bounce-in { animation: bounceIn 1.2s cubic-bezier(0.23, 1, 0.32, 1); }
          .animate-shine { animation: shine 2.5s linear infinite; }
          .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
          @keyframes float { 0% { transform: translateY(0); } 100% { transform: translateY(-18px); } }
          @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
          @keyframes fadeInUp { 0% { opacity: 0; transform: translateY(40px); } 100% { opacity: 1; transform: translateY(0); } }
          @keyframes slideInLeft { 0% { opacity: 0; transform: translateX(-40px); } 100% { opacity: 1; transform: translateX(0); } }
          @keyframes popIn { 0% { opacity: 0; transform: scale(0.7); } 100% { opacity: 1; transform: scale(1); } }
          @keyframes bounceIn { 0% { opacity: 0; transform: scale(0.7); } 60% { opacity: 1; transform: scale(1.1); } 100% { transform: scale(1); } }
          @keyframes shine { 0% { left: -100%; } 100% { left: 100%; } }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        `}</style>
      </div>
    </div>
  );
};

export default Index;
