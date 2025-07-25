
import React, { useState } from 'react';
import { Bell, Check, X, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { usePushNotification } from "@/contexts/PushNotificationContext";

interface Notification {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
}

const NotificationBell = () => {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { enabled: pushNotificationEnabled } = usePushNotification();

  // Fetch notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/notifications', {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.data)) {
        setNotifications(data.data);
      }
      setLoading(false);
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem("pushNotificationEnabled");
      // This useEffect is no longer needed as pushNotificationEnabled is managed by context
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Remove mark all as read logic
  const handlePopoverOpenChange = (open: boolean) => {
    setPopoverOpen(open);
  };

  // Mark a single notification as read
  const handleMarkAsRead = async (id: string) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/notifications/${id}/read`, {
      method: 'POST',
      headers: { Authorization: token ? `Bearer ${token}` : undefined },
    });
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-orange-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check className="h-5 w-5 text-green-500 bg-green-100 rounded-full p-1 shadow" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-500 bg-orange-100 rounded-full p-1 shadow" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500 bg-red-100 rounded-full p-1 shadow" />;
      default: return <Info className="h-5 w-5 text-blue-500 bg-blue-100 rounded-full p-1 shadow" />;
    }
  };

  return (
    <Popover open={popoverOpen} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative glass bg-white/60 backdrop-blur-md shadow-lg hover:scale-110 transition-all duration-200">
          <span className="relative">
            <Bell className="h-6 w-6 text-blue-500 animate-float" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center h-6 w-6 rounded-full bg-gradient-to-tr from-pink-400 via-blue-400 to-indigo-400 text-white text-xs font-bold shadow-lg animate-pulse border-2 border-white">
                {unreadCount}
              </span>
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 glass bg-gradient-to-br from-white/80 via-blue-50/80 to-indigo-100/80 backdrop-blur-xl shadow-2xl border-0 rounded-2xl p-0 animate-fade-in-up" align="end">
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-400 rounded-t-2xl text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold tracking-tight">การแจ้งเตือน</CardTitle>
              {unreadCount > 0 && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs font-bold bg-white/30 text-white hover:bg-white/50 rounded-full px-3 py-1 shadow"
                >
                  {t('notification.markAllAsRead')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-80 overflow-y-auto p-4 bg-transparent">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-500 py-4">ไม่มีการแจ้งเตือน</p>
            ) : (
              notifications.map((notification, idx) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 rounded-xl glass bg-gradient-to-br from-white/80 via-blue-50/80 to-indigo-100/80 shadow-md border-0 transition-all duration-200 animate-fade-in-up ${notification.read ? 'opacity-60' : 'opacity-100 hover:scale-[1.03]'} animate-pop-in`}
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold text-base mb-0.5 ${getTypeColor(notification.type)}`}>{notification.title}</h4>
                    <p className="text-xs text-gray-600 mb-1">{notification.message}</p>
                    <p className="text-xs text-gray-400">{notification.time}</p>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => markAsRead(notification.id)}
                      className="ml-2 p-1 h-7 w-7 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full shadow"
                      aria-label="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
