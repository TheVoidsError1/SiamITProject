import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import i18n from "@/i18n";
import NotificationBell from "@/components/NotificationBell";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { fetchWithAuth } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useNavigate } from "react-router-dom";

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
  const [recentLeaveStats, setRecentLeaveStats] = useState({
    sick: { days: 0, hours: 0 },
    vacation: { days: 0, hours: 0 },
    personal: { days: 0, hours: 0 }
  });
  const [loadingRecentStats, setLoadingRecentStats] = useState(true);
  const [errorRecentStats, setErrorRecentStats] = useState("");
  // Days remaining state
  const [daysRemaining, setDaysRemaining] = useState<{ days: number, hours: number } | null>(null);
  const [loadingDaysRemaining, setLoadingDaysRemaining] = useState(true);
  const [errorDaysRemaining, setErrorDaysRemaining] = useState("");
  // Days used state
  const [daysUsed, setDaysUsed] = useState<{ days: number, hours: number } | null>(null);
  const [loadingDaysUsed, setLoadingDaysUsed] = useState(true);
  const [errorDaysUsed, setErrorDaysUsed] = useState("");

  const showSessionExpiredToast = () => {
    toast({
      title: t('auth.sessionExpired'),
      description: t('auth.pleaseLoginAgain'),
      variant: "destructive",
      action: (
        <ToastAction altText={t('common.ok')} onClick={() => { logout(); navigate("/login"); }}>{t('common.ok')}</ToastAction>
      ),
    });
  };

  useEffect(() => {
    setLoadingStats(true);
    const token = localStorage.getItem("token");
    fetchWithAuth("/api/dashboard-stats", {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    }, undefined, showSessionExpiredToast)
      ?.then((res) => res && res.json())
      .then((data) => {
        if (data && data.status === "success" && data.data) {
          setStats([
            { title: t('main.daysRemaining'), value: data.data.remainingDays, unit: t('common.days'), icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-50" },
            { title: t('main.daysUsed'), value: data.data.daysUsed, unit: t('common.days'), icon: Clock, color: "text-green-600", bgColor: "bg-green-50" },
            { title: t('main.pendingRequests'), value: data.data.pendingRequests, unit: t('main.requests'), icon: Users, color: "text-orange-600", bgColor: "bg-orange-50" },
            { title: t('main.approvalRate'), value: data.data.approvalRate, unit: "%", icon: TrendingUp, color: "text-purple-600", bgColor: "bg-purple-50" },
          ]);
          // Map leaveTypeStats to leaveStats for display
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
  }, [t, logout]);

  useEffect(() => {
    setLoadingRecentStats(true);
    setErrorRecentStats("");
    const token = localStorage.getItem("token");
    fetchWithAuth("/api/dashboard-recent-leave-stats", {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    }, logout)
      .then((res) => res && res.json())
      .then((data) => {
        if (data.status === "success" && data.data) {
          setRecentLeaveStats(data.data);
        } else {
          setErrorRecentStats(t('error.cannotLoadStats'));
        }
      })
      .catch(() => setErrorRecentStats(t('error.apiConnectionError')))
      .finally(() => setLoadingRecentStats(false));
  }, [t, logout]);

  useEffect(() => {
    setLoadingDaysRemaining(true);
    setErrorDaysRemaining("");
    const token = localStorage.getItem("token");
    fetchWithAuth("/api/leave-days-remaining", {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    }, logout)
      .then((res) => res && res.json())
      .then((data) => {
        if (data.status === "success" && data.data) {
          setDaysRemaining(data.data);
        } else {
          setErrorDaysRemaining(t('error.cannotLoadStats'));
        }
      })
      .catch(() => setErrorDaysRemaining(t('error.apiConnectionError')))
      .finally(() => setLoadingDaysRemaining(false));
  }, [t, logout]);

  useEffect(() => {
    setLoadingDaysUsed(true);
    setErrorDaysUsed("");
    const token = localStorage.getItem("token");
    fetchWithAuth("/api/day-used", {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    }, logout)
      .then((res) => res && res.json())
      .then((data) => {
        if (data.status === "success" && data.data) {
          setDaysUsed(data.data);
        } else {
          setErrorDaysUsed(t('error.cannotLoadStats'));
        }
      })
      .catch(() => setErrorDaysUsed(t('error.apiConnectionError')))
      .finally(() => setLoadingDaysUsed(false));
  }, [t, logout]);

  // Localized date formatter for dashboard welcome section
  const formatFullDateLocalized = (date: Date) => {
    if (i18n.language === "th") {
      // วันจันทร์ที่ 14 กรกฎาคม 2568
      const weekday = format(date, "EEEE", { locale: th });
      const day = date.getDate();
      const month = format(date, "MMMM", { locale: th });
      const year = date.getFullYear() + 543;
      return `วัน${weekday}ที่ ${day} ${month} ${year}`;
    } else {
      // Monday, July 14, 2025
      return format(date, "EEEE, MMMM d, yyyy");
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

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <div className="gradient-bg rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">{t('main.hello')} {user?.full_name || t('common.user')}! 👋</h2>
            <p className="text-blue-100 mb-6">
              {t('main.today')} {formatFullDateLocalized(new Date())}
            </p>
            <Link to="/leave-request">
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-blue-50 font-medium"
              >
                {t('main.newLeaveRequest')}
              </Button>
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full rainbow-gradient opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Days Remaining Card (API-connected) */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  {loadingDaysRemaining ? (
                    <span>{t('common.loading')}</span>
                  ) : errorDaysRemaining ? (
                    <span className="text-red-500">{errorDaysRemaining}</span>
                  ) : daysRemaining ? (
                    <>
                      <span className="font-bold">{daysRemaining.days}</span>
                      <span className="text-sm font-normal text-muted-foreground ml-1">{t('common.days')}</span>
                      {daysRemaining.hours > 0 && (
                        <>
                          <span className="font-bold ml-2">{daysRemaining.hours}</span>
                          <span className="text-sm font-normal text-muted-foreground ml-1">{t('common.hour')}</span>
                        </>
                      )}
                    </>
                  ) : (
                    <span>-</span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('main.daysRemaining')}
                </p>
              </div>
            </CardContent>
          </Card>
          {/* Days Used Card (API-connected) */}
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  {loadingDaysUsed ? (
                    <span>{t('common.loading')}</span>
                  ) : errorDaysUsed ? (
                    <span className="text-red-500">{errorDaysUsed}</span>
                  ) : daysUsed ? (
                    <>
                      <span className="font-bold">{daysUsed.days}</span>
                      <span className="text-sm font-normal text-muted-foreground ml-1">{t('common.days')}</span>
                      {daysUsed.hours > 0 && (
                        <>
                          <span className="font-bold ml-2">{daysUsed.hours}</span>
                          <span className="text-sm font-normal text-muted-foreground ml-1">{t('common.hour')}</span>
                        </>
                      )}
                    </>
                  ) : (
                    <span>-</span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
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
                {t('main.quickActions')}
              </CardTitle>
              <CardDescription>
                {t('main.quickActionsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/leave-request">
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  {t('main.newLeaveRequest')}
                </Button>
              </Link>
              <Link to="/leave-history">
                <Button className="w-full justify-start" variant="outline">
                  <Clock className="w-4 h-4 mr-2" />
                  {t('leave.leaveHistory')}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                {t('main.recentLeaveStats')}
              </CardTitle>
              <CardDescription>
                {t('main.recentLeaveStatsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRecentStats ? (
                <div className="text-center py-6 text-gray-500">{t('common.loading')}</div>
              ) : errorRecentStats ? (
                <div className="text-center py-6 text-red-500">{errorRecentStats}</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('leaveTypes.sick')}</span>
                    <span className="font-medium">
                      {recentLeaveStats.sick.days} {t('common.days')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('leaveTypes.vacation')}</span>
                    <span className="font-medium">
                      {recentLeaveStats.vacation.days} {t('common.days')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('leaveTypes.personal')}</span>
                    <span className="font-medium">
                      {(() => {
                        const d = recentLeaveStats.personal.days;
                        const h = recentLeaveStats.personal.hours;
                        const hourLabel = t('common.hour', 'ชั่วโมง');
                        if (d > 0 && h > 0) return `${d} ${t('common.days')} ${h} ${hourLabel}`;
                        if (d > 0) return `${d} ${t('common.days')}`;
                        if (h > 0) return `${h} ${hourLabel}`;
                        return `0 ${t('common.days')}`;
                      })()}
                    </span>
                  </div>
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
