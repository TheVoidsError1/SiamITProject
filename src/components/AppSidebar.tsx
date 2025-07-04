
import {
  Calendar,
  History,
  Home,
  Settings,
  Users,
  LogOut,
  Shield,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

export function AppSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const userItems = [
    {
      title: t('navigation.home'),
      url: "/",
      icon: Home,
    },
    {
      title: t('navigation.leaveRequest'),
      url: "/leave-request",
      icon: Calendar,
    },
    {
      title: t('navigation.leaveHistory'),
      url: "/leave-history",
      icon: History,
    },
    {
      title: t('navigation.profile'),
      url: "/profile",
      icon: Settings,
    },
  ];

  const adminItems = [
    {
      title: t('navigation.adminDashboard'),
      url: "/admin",
      icon: Shield,
    },
    {
      title: t('navigation.employeeManagement'),
      url: "/admin/employees",
      icon: Users,
    },
  ];

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

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <img
              src="/lovable-uploads/siamit.png"
              alt="Siam IT Logo"
              className="h-8 w-auto"
            />
            <div>
              <h2 className="font-semibold text-lg">{t('system.siamIt')}</h2>
              <p className="text-xs text-muted-foreground">{t('system.onlineLeaveSystem')}</p>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>{t('navigation.home')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('navigation.adminDashboard')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="p-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm">
              <p className="font-medium">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('auth.logout')}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
