
import React, { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

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

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem('token');
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { Authorization: token ? `Bearer ${token}` : undefined },
    });
    setNotifications([]);
  };

  const unreadCount = notifications.length;
  const currentLocale = i18n.language === 'th' ? th : enUS;

  return (
    <Popover open={popoverOpen} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t('notification.title')}</CardTitle>
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="ml-2 px-3 py-1 rounded-full text-xs font-medium bg-white hover:bg-blue-100 text-blue-600 border border-blue-200 shadow-sm transition-colors"
                >
                  {t('notification.markAllAsRead')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-80 overflow-y-auto">
            {loading ? (
              <p className="text-center text-gray-500 py-4">{t('common.loading')}</p>
            ) : notifications.length === 0 ? (
              <p className="text-center text-gray-500 py-4">{t('notification.empty')}</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border bg-blue-50 border-blue-200 flex items-start justify-between`}
                >
                  <div className="flex-1">
                    <h4 className={`font-medium text-sm ${notification.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                      {notification.status === 'approved'
                        ? t('notification.approved')
                        : t('notification.rejected')}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {t('notification.leaveDate')}: {format(new Date(notification.startDate), 'dd MMM yyyy', { locale: currentLocale })}
                      {notification.endDate && notification.endDate !== notification.startDate
                        ? ` - ${format(new Date(notification.endDate), 'dd MMM yyyy', { locale: currentLocale })}`
                        : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {notification.status === 'approved'
                        ? t('notification.approvedDesc')
                        : t('notification.rejectedDesc')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="ml-4 px-3 py-1 rounded-full text-xs font-medium bg-white hover:bg-blue-100 text-blue-600 border border-blue-200 shadow-sm transition-colors"
                  >
                    {t('notification.markAsRead')}
                  </Button>
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
