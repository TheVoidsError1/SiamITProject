
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePushNotification } from "@/contexts/PushNotificationContext";
import { AlertCircle, AlertTriangle, Bell, Check, Info } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  status: string;
  type: string;
}

const NotificationBell = () => {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { enabled: pushNotificationEnabled } = usePushNotification();

  // คำนวณจำนวนที่ยังไม่ได้อ่าน (เช่น status === 'unread')
  const unreadCount = useMemo(() => {
    // ถ้าปิดการใช้งานแจ้งเตือน ให้ไม่แสดงจำนวน
    if (!pushNotificationEnabled) {
      return 0;
    }
    return notifications.filter(n => n.status === 'unread').length;
  }, [notifications, pushNotificationEnabled]);

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem('token');
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { Authorization: token ? `Bearer ${token}` : undefined },
    });
    setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
  };

  // Fetch notifications on mount and when push notification setting changes
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
    
    // เฉพาะเมื่อเปิดการใช้งานแจ้งเตือนเท่านั้น
    if (pushNotificationEnabled) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [pushNotificationEnabled]);

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
    <TooltipProvider>
      <Popover open={popoverOpen} onOpenChange={handlePopoverOpenChange}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="relative bg-gradient-to-br from-blue-50 to-white backdrop-blur-md shadow-xl hover:scale-105 transition-all duration-200 rounded-xl p-4 border border-blue-200 notification-bell">
                <div className="relative flex items-center justify-center">
                  {/* ไอคอนกระดิ่งหลัก */}
                  <div className="relative">
                    <div className="relative">
                      <Bell className="h-8 w-8 text-blue-700 stroke-2 drop-shadow-md" />
                      {/* เพิ่ม shadow ด้านในเพื่อให้กระดิ่งเด่นชัด */}
                      <div className="absolute inset-0 h-8 w-8 bg-blue-700/10 rounded-full blur-sm"></div>
                    </div>
                    
                    {/* ตัวเลขแจ้งเตือนด้านบนขวา */}
                    {pushNotificationEnabled && unreadCount > 0 && (
                      <div className="absolute -top-3 -right-3 flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold shadow-xl border-2 border-white notification-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    )}
                  </div>
                  
                  {/* เอฟเฟกต์การเตือน (ถ้ามีข้อความใหม่) */}
                  {pushNotificationEnabled && unreadCount > 0 && (
                    <div className="absolute inset-0 rounded-full bg-red-400/20 animate-ping notification-pulse"></div>
                  )}
                </div>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-gray-900 text-white text-sm">
            <p>{t('notification.tooltipTitle')}</p>
            {pushNotificationEnabled && unreadCount > 0 && (
              <p className="text-xs text-gray-300 mt-1">
                {unreadCount} {t('notification.tooltipUnreadCount')}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
        <PopoverContent className="w-96 bg-white shadow-2xl border border-gray-200 rounded-2xl p-0" align="end">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
                  <div className="relative">
                    <Bell className="h-5 w-5" />
                    {pushNotificationEnabled && unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-white/20 text-white text-xs font-bold">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    )}
                  </div>
                  {t('notification.notifications')}
                </CardTitle>
                {pushNotificationEnabled && notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-white hover:text-white/80 hover:bg-white/10 text-sm font-medium px-3 py-1 rounded-lg transition-colors"
                  >
                    {t('notification.markAllAsRead')}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto p-4 bg-white">
              {!pushNotificationEnabled ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-700 font-semibold mb-2 text-lg">{t('notification.notificationsDisabled')}</p>
                  <p className="text-sm text-gray-500 mb-4">{t('notification.enableToSeeNotifications')}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      const event = new CustomEvent('enablePushNotifications');
                      window.dispatchEvent(event);
                    }}
                  >
                    {t('common.enable')}
                  </Button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-gray-700 font-semibold mb-2 text-lg">{t('notification.noNotifications')}</p>
                  <p className="text-sm text-gray-500">{t('notification.noNotificationsDesc')}</p>
                </div>
              ) : (
                notifications.map((notification, idx) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-xl border transition-all duration-200 group ${
                      notification.status === 'unread' 
                        ? notification.type === 'approval'
                          ? 'bg-green-50 border-green-200 hover:bg-green-100'
                          : notification.type === 'rejection'
                          ? 'bg-red-50 border-red-200 hover:bg-red-100'
                          : notification.type === 'deletion'
                          ? 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                          : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-base text-gray-900">
                            {notification.title}
                          </h4>
                          {notification.status === 'unread' && (
                            <span className={`inline-block w-2 h-2 rounded-full ${
                              notification.type === 'approval'
                                ? 'bg-green-500'
                                : notification.type === 'rejection'
                                ? 'bg-red-500'
                                : notification.type === 'deletion'
                                ? 'bg-orange-500'
                                : 'bg-blue-500'
                            }`}></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          {notification.timestamp}
                        </p>
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        {notification.status === 'unread' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className={`h-8 w-8 rounded-full transition-colors ${
                              notification.type === 'approval'
                                ? 'bg-green-100 hover:bg-green-200 text-green-600'
                                : notification.type === 'rejection'
                                ? 'bg-red-100 hover:bg-red-200 text-red-600'
                                : notification.type === 'deletion'
                                ? 'bg-orange-100 hover:bg-orange-200 text-orange-600'
                                : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                            }`}
                            aria-label="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        ) : (
                          <div className={`h-8 w-8 flex items-center justify-center rounded-full ${
                            notification.type === 'approval'
                              ? 'bg-green-100'
                              : notification.type === 'rejection'
                              ? 'bg-red-100'
                              : notification.type === 'deletion'
                              ? 'bg-orange-100'
                              : 'bg-blue-100'
                          }`}>
                            <Check className={`h-4 w-4 ${
                              notification.type === 'approval'
                                ? 'text-green-600'
                                : notification.type === 'rejection'
                                ? 'text-red-600'
                                : notification.type === 'deletion'
                                ? 'text-orange-600'
                                : 'text-blue-600'
                            }`} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
      <style>{`
        .notification-bell {
          position: relative;
          overflow: visible;
        }
        
        .notification-badge {
          animation: badge-bounce 0.6s ease-out;
        }
        
        .notification-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes badge-bounce {
          0% {
            transform: scale(0) rotate(-10deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0;
            transform: scale(1.1);
          }
        }
      `}</style>
    </TooltipProvider>
  );
};

export default NotificationBell;
