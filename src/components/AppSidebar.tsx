
import { Calendar, Home, Clock, Settings, User, LogOut, Users, Building, Newspaper, Rss, MessageSquare } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import NotificationBell from "./NotificationBell";
import { useTranslation } from "react-i18next";

const items = [
  {
    title: "navigation.home",
    url: "/",
    icon: Home,
  },
  {
    title: "navigation.announcementsFeed",
    url: "/announcements",
    icon: Rss,
  },
  {
    title: "navigation.calendar",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "navigation.leaveRequest",
    url: "/leave-request",
    icon: Calendar,
  },
  {
    title: "navigation.leaveHistory",
    url: "/leave-history",
    icon: Clock,
  },
  {
    title: "navigation.profile",
    url: "/profile",
    icon: User,
  },
];

const adminItems = [
  {
    title: "navigation.adminDashboard",
    url: "/admin",
    icon: Settings,
  },
  {
    title: "navigation.allEmployees",
    url: "/admin/employees",
    icon: Users,
  },
];

const superadminItems = [
  {
    title: "navigation.manageAll",
    url: "/superadmin/manage-all",
    icon: Settings,
  },
  {
    title: "navigation.createUser",
    url: "/superadmin/superadmins",
    icon: User,
  },
];

const superadminExtraItems = [
  {
    title: "navigation.manageAll",
    url: "/superadmin/manage-all",
    icon: Settings,
  },
  {
    title: "navigation.createUser",
    url: "/superadmin/superadmins",
    icon: User,
  },
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function AppSidebar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { user, logout, loading } = useAuth();
  const { toast } = useToast();
  // Use avatar URL from user context if available, otherwise fetch it
  const avatarUrl = user?.avatar_url ? `${API_BASE_URL}${user.avatar_url}` : null;

  const [positions, setPositions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/positions`);
        const data = await response.json();
        setPositions(data.data || []);
      } catch (error) {
        console.error('Error fetching positions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPositions();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: t('auth.logoutSuccess'),
        description: t('auth.logoutSuccess'),
      });
    } catch (error) {
      toast({
        title: t('system.error'),
        description: t('system.error'),
        variant: "destructive",
      });
    }
  };

  // Don't render if user is not loaded yet
  if (!user || loading) {
    return (
      <div className="border-r border-border/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-2xl animate-slide-in-left transition-all duration-300 w-64">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const allItems = user?.role === 'superadmin'
    ? [...items, ...adminItems, ...superadminExtraItems]
    : user?.role === 'admin'
      ? [...items, ...adminItems]
      : items;

  return (
    <Sidebar className="border-r border-border/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-2xl animate-slide-in-left transition-all duration-300">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <img
            src="/lovable-uploads/IMG_4486-removebg-preview.png"
            alt="Siam IT Logo"
            className="w-12 h-12 object-contain drop-shadow-lg"
          />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-sidebar-foreground">
              Siam IT
            </h2>
            <p className="text-sm text-sidebar-foreground/70">
              {t('system.onlineLeaveSystem')}
            </p>
          </div>
          <NotificationBell />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 font-semibold tracking-wide uppercase mb-2">
            {t('navigation.mainMenu')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                    className={
                      `w-full justify-start group relative px-2 py-1.5 rounded-xl transition-all duration-200
                      ${location.pathname === item.url ? 'bg-gradient-to-r from-blue-400/20 to-indigo-400/10 shadow-lg before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-8 before:rounded-full before:bg-gradient-to-b before:from-blue-500 before:to-indigo-500' : 'hover:bg-blue-100/40 dark:hover:bg-gray-800/40'}
                      `
                    }
                  >
                    <Link to={item.url} className="flex items-center gap-3 relative z-10">
                      <item.icon className={
                        `w-5 h-5 transition-transform duration-200 group-hover:scale-125
                        ${location.pathname === item.url ? 'text-blue-600 drop-shadow-glow' : 'text-gray-500 group-hover:text-blue-500'}`
                      } />
                      <span className={
                        `font-medium transition-colors duration-200
                        ${location.pathname === item.url ? 'text-blue-700 dark:text-blue-300' : 'text-sidebar-foreground group-hover:text-blue-600'}`
                      }>
                        {t(item.title)}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-6">
        <div className="space-y-4">
          <Link to="/profile" className="block">
            <div className="flex items-center gap-3 p-4 rounded-2xl glass bg-white/60 dark:bg-gray-900/60 backdrop-blur-md shadow-lg hover:shadow-xl transition-all cursor-pointer border border-blue-100 dark:border-gray-800">
              <Avatar className="w-8 h-8">
                <AvatarImage 
                  src={user?.avatar_url ? `${API_BASE_URL}${user.avatar_url}` : undefined} 
                  alt={user?.full_name || 'User'}
                />
                <AvatarFallback className="text-xs font-medium bg-sidebar-accent text-sidebar-foreground">
                  {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">
                  {user?.full_name || t('common.user')}
                </p>
                <p className="text-xs text-sidebar-foreground/70 truncate">
                  {(() => {
                    if (isLoading) {
                      return t('common.loading');
                    }
                    // Try to match by ID
                    let pos = positions.find(p => String(p.id) === String(user?.position));
                    // If not found, try to match by English or Thai name
                    if (!pos && user?.position) {
                      pos = positions.find(
                        p =>
                          p.position_name_en === user.position ||
                          p.position_name_th === user.position
                      );
                    }
                    if (pos) {
                      return i18n.language.startsWith('th')
                        ? pos.position_name_th || pos.position_name_en
                        : pos.position_name_en || pos.position_name_th;
                    }
                    // If user.position is an object, show name_th or name_en
                    if (user?.position && typeof user.position === 'object') {
                      const { name_th, name_en } = user.position as { name_th?: string; name_en?: string };
                      return i18n.language.startsWith('th')
                        ? name_th || t('main.employee')
                        : name_en || t('main.employee');
                    }
                    // Otherwise, show as string
                    return user?.position || t('main.employee');
                  })()}
                </p>
              </div>
            </div>
          </Link>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-sidebar-foreground hover:bg-blue-100/40 dark:hover:bg-gray-800/40 rounded-xl"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('auth.logout')}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}