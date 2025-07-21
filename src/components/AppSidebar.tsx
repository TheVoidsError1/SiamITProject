
import { Calendar, Home, Clock, Settings, User, LogOut, Users, Building } from "lucide-react";
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
  const { user, logout } = useAuth();
  const { toast } = useToast();
  // Use avatar URL from user context if available, otherwise fetch it
  const avatarUrl = user?.avatar_url ? `${API_BASE_URL}${user.avatar_url}` : null;

  const [positions, setPositions] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/positions`)
      .then(res => res.json())
      .then(data => {
        setPositions(data.data || []);
      });
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

  const allItems = user?.role === 'superadmin'
    ? [...items, ...adminItems, ...superadminExtraItems]
    : user?.role === 'admin'
      ? [...items, ...adminItems]
      : items;

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <img
            src="/lovable-uploads/IMG_4486-removebg-preview.png"
            alt="Siam IT Logo"
            className="w-12 h-12 object-contain"
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
          <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium">
            {t('navigation.mainMenu')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                    className="w-full justify-start hover:bg-sidebar-accent transition-colors"
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{t(item.title)}</span>
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
            <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/20 hover:bg-sidebar-accent/30 transition-colors cursor-pointer">
              <Avatar className="w-8 h-8">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-xs font-medium bg-sidebar-accent text-sidebar-foreground">
                  {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.full_name || t('common.user')}
                </p>
                <p className="text-xs text-sidebar-foreground/70 truncate">
                  {(() => {
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
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('auth.logout')}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
