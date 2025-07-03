
import { Calendar, Home, Clock, Settings, User, LogOut, Users } from "lucide-react";
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

const items = [
  {
    title: "หน้าหลัก",
    url: "/",
    icon: Home,
  },
  {
    title: "ยื่นคำขอลา",
    url: "/leave-request",
    icon: Calendar,
  },
  {
    title: "ประวัติการลา",
    url: "/leave-history",
    icon: Clock,
  },
  {
    title: "โปรไฟล์",
    url: "/profile",
    icon: User,
  },
];

const adminItems = [
  {
    title: "จัดการระบบ",
    url: "/admin",
    icon: Settings,
  },
  {
    title: "บุคลากรทั้งหมด",
    url: "/admin/employees",
    icon: Users,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    
    // Fetch user's profile image
    fetch(`http://localhost:3001/api/profile/${user.id}/image`)
      .then(res => res.json())
      .then(data => {
        if (data.avatar_url) {
          setAvatarUrl(`http://localhost:3001${data.avatar_url}`);
        } else {
          setAvatarUrl(null);
        }
      })
      .catch(() => setAvatarUrl(null));
  }, [user?.id]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "ออกจากระบบสำเร็จ",
        description: "ขอบคุณที่ใช้ระบบลาออนไลน์",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถออกจากระบบได้",
        variant: "destructive",
      });
    }
  };

  const allItems = user?.role === 'admin' ? [...items, ...adminItems] : items;

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <img
            src="/lovable-uploads/041aa731-ed5d-477d-851c-0e290485c0e6.png"
            alt="Siam IT Logo"
            className="w-12 h-12 object-contain"
          />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-sidebar-foreground">
              Siam IT
            </h2>
            <p className="text-sm text-sidebar-foreground/70">
              ระบบลาออนไลน์
            </p>
          </div>
          <NotificationBell />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium">
            เมนูหลัก
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
                      <span className="font-medium">{item.title}</span>
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
                  {user?.full_name || 'ผู้ใช้'}
                </p>
                <p className="text-xs text-sidebar-foreground/70 truncate">
                  {user?.position || 'พนักงาน'}
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
            ออกจากระบบ
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}