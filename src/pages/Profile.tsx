<<<<<<< HEAD
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
=======

import React, { useState } from 'react';
>>>>>>> origin/db_yod
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
<<<<<<< HEAD
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Building, Briefcase, Shield, Calendar, Camera, Save } from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
=======
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Building, Briefcase, Shield, Calendar, Camera, Save, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ChangePasswordDialog from '@/components/dialogs/ChangePasswordDialog';

const Profile = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
>>>>>>> origin/db_yod
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    department: user?.department || '',
    position: user?.position || '',
  });

<<<<<<< HEAD
  useEffect(() => {
    if (!user?.id) return;
    axios.get(`http://localhost:3001/api/profile/${user.id}/image`)
      .then(res => {
        if (res.data.avatar_url) {
          setAvatarUrl(`http://localhost:3001${res.data.avatar_url}`);
        } else {
          setAvatarUrl(null);
        }
      })
      .catch(() => setAvatarUrl(null));
  }, [user?.id]);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user?.id) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('profileImg', file);
    formData.append('userId', user.id);
    try {
      await axios.post('http://localhost:3001/api/profile/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // หลังอัปโหลดเสร็จ reload avatar ใหม่
      const res = await axios.get(`http://localhost:3001/api/profile/${user.id}/image`);
      setAvatarUrl(`http://localhost:3001${res.data.avatar_url}`);
      toast({ title: 'อัปโหลดรูปสำเร็จ' });
    } catch (err) {
      toast({ title: 'อัปโหลดรูปไม่สำเร็จ', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const requestData: any = {
        User_name: formData.full_name,
        email: formData.email,
      };

      // Only include position and department for non-admin users
      if (user.role !== 'admin') {
        requestData.position = formData.position;
        requestData.department = formData.department;
      }

      const response = await axios.put(`http://localhost:3001/api/users/${user.id}`, requestData);
      if (response.data.success) {
        toast({
          title: "บันทึกข้อมูลสำเร็จ",
          description: "ข้อมูลโปรไฟล์ของคุณได้รับการอัปเดตแล้ว",
        });
        // Update user data in context and localStorage
        updateUser({
          full_name: formData.full_name,
          position: formData.position,
          department: formData.department,
          email: formData.email,
        });
      } else {
        throw new Error(response.data.message || 'ไม่สามารถบันทึกข้อมูลได้');
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
=======
  const handleSave = async () => {
    setLoading(true);
    try {
      // Mock save - would update Supabase in real implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: t('system.updateSuccess'),
        description: t('system.dataUpdated'),
      });
    } catch (error) {
      toast({
        title: t('system.updateError'),
        description: t('system.updateErrorDesc'),
>>>>>>> origin/db_yod
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const leaveStats = [
<<<<<<< HEAD
    { label: 'วันลาพักผ่อน', used: 8, total: 15, color: 'bg-blue-500' },
    { label: 'วันลาป่วย', used: 3, total: 10, color: 'bg-green-500' },
    { label: 'วันลากิจ', used: 2, total: 5, color: 'bg-orange-500' },
    { label: 'วันลาคลอดบุตร', used: 0, total: 90, color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">โปรไฟล์</h1>
            <p className="text-sm text-gray-600">จัดการข้อมูลส่วนตัวและการตั้งค่า</p>
          </div>
=======
    { label: t('profile.vacationLeave'), used: 8, total: 15, color: 'bg-blue-500' },
    { label: t('profile.sickLeave'), used: 3, total: 10, color: 'bg-green-500' },
    { label: t('profile.personalLeave'), used: 2, total: 5, color: 'bg-orange-500' },
    { label: t('profile.maternityLeave'), used: 0, total: 90, color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('navigation.profile')}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">{t('profile.profileTitle')}</p>
          </div>
          <LanguageSwitcher />
>>>>>>> origin/db_yod
        </div>
      </div>

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Profile Header */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
<<<<<<< HEAD
                  <AvatarImage src={avatarUrl || undefined} />
=======
                  <AvatarImage src={user?.avatar_url} />
>>>>>>> origin/db_yod
                  <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                    {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
<<<<<<< HEAD
                <button
                  type="button"
                  className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-white hover:bg-primary/90 transition-colors"
                  onClick={handleCameraClick}
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{user?.full_name}</h2>
                <p className="text-gray-600 mb-2">{user?.position || '-'}</p>
                <div className="flex items-center gap-4">
                  <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'} className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {user?.department || '-'}
=======
                <button className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-white hover:bg-primary/90 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.full_name}</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-2">{user?.position}</p>
                <div className="flex items-center gap-4">
                  <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'} className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {user?.role === 'admin' ? t('main.systemAdmin') : t('main.employee')}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {user?.department}
>>>>>>> origin/db_yod
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
<<<<<<< HEAD
            <TabsTrigger value="personal">ข้อมูลส่วนตัว</TabsTrigger>
            <TabsTrigger value="leave">สิทธิการลา</TabsTrigger>
            <TabsTrigger value="settings">การตั้งค่า</TabsTrigger>
=======
            <TabsTrigger value="personal">{t('profile.personalInfo')}</TabsTrigger>
            <TabsTrigger value="leave">{t('profile.leaveRights')}</TabsTrigger>
            <TabsTrigger value="settings">{t('profile.settings')}</TabsTrigger>
>>>>>>> origin/db_yod
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
<<<<<<< HEAD
                  ข้อมูลส่วนตัว
                </CardTitle>
                <CardDescription>จัดการข้อมูลส่วนตัวของคุณ</CardDescription>
=======
                  {t('profile.personalInfo')}
                </CardTitle>
                <CardDescription>{t('profile.personalInfoDesc')}</CardDescription>
>>>>>>> origin/db_yod
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
<<<<<<< HEAD
                    <Label htmlFor="full_name">ชื่อ-นามสกุล</Label>
=======
                    <Label htmlFor="full_name">{t('auth.fullName')}</Label>
>>>>>>> origin/db_yod
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
<<<<<<< HEAD
                    <Label htmlFor="email">อีเมล</Label>
=======
                    <Label htmlFor="email">{t('auth.email')}</Label>
>>>>>>> origin/db_yod
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
<<<<<<< HEAD
                    <Label htmlFor="position">ตำแหน่ง</Label>
=======
                    <Label htmlFor="position">{t('auth.position')}</Label>
>>>>>>> origin/db_yod
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
<<<<<<< HEAD
                      disabled={user?.role === 'admin'}
                      className={user?.role === 'admin' ? 'bg-gray-100 cursor-not-allowed' : ''}
=======
>>>>>>> origin/db_yod
                    />
                  </div>
                  
                  <div className="space-y-2">
<<<<<<< HEAD
                    <Label htmlFor="department">แผนก</Label>
=======
                    <Label htmlFor="department">{t('auth.department')}</Label>
>>>>>>> origin/db_yod
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
<<<<<<< HEAD
                      disabled={user?.role === 'admin'}
                      className={user?.role === 'admin' ? 'bg-gray-100 cursor-not-allowed' : ''}
=======
>>>>>>> origin/db_yod
                    />
                  </div>
                </div>
                
                <Button onClick={handleSave} disabled={loading} className="w-full md:w-auto">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
<<<<<<< HEAD
                      กำลังบันทึก...
=======
                      {t('profile.saving')}
>>>>>>> origin/db_yod
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
<<<<<<< HEAD
                      บันทึกข้อมูล
=======
                      {t('profile.saveData')}
>>>>>>> origin/db_yod
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leave" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
<<<<<<< HEAD
                  สิทธิการลา
                </CardTitle>
                <CardDescription>ข้อมูลการใช้วันลาในปีปัจจุบัน</CardDescription>
=======
                  {t('profile.leaveRights')}
                </CardTitle>
                <CardDescription>{t('profile.leaveRightsDesc')}</CardDescription>
>>>>>>> origin/db_yod
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {leaveStats.map((stat, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{stat.label}</span>
                        <span className="text-sm text-gray-500">
<<<<<<< HEAD
                          {stat.used}/{stat.total} วัน
=======
                          {stat.used}/{stat.total} {t('common.days')}
>>>>>>> origin/db_yod
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${stat.color} h-2 rounded-full transition-all duration-500`}
                          style={{
                            width: `${(stat.used / stat.total) * 100}%`
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500">
<<<<<<< HEAD
                        เหลือ {stat.total - stat.used} วัน
=======
                        {t('common.remaining')} {stat.total - stat.used} {t('common.days')}
>>>>>>> origin/db_yod
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
<<<<<<< HEAD
                <CardTitle>การตั้งค่า</CardTitle>
                <CardDescription>จัดการการตั้งค่าบัญชีและความปลอดภัย</CardDescription>
=======
                <CardTitle>{t('profile.settings')}</CardTitle>
                <CardDescription>{t('profile.settingsDesc')}</CardDescription>
>>>>>>> origin/db_yod
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
<<<<<<< HEAD
                    <div>
                      <h3 className="font-medium">การแจ้งเตือนทางอีเมล</h3>
                      <p className="text-sm text-gray-500">รับการแจ้งเตือนเมื่อมีการอนุมัติ/ปฏิเสธการลา</p>
                    </div>
                    <Button variant="outline" size="sm">เปิดใช้งาน</Button>
=======
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                      <div>
                        <h3 className="font-medium">{t('profile.darkMode')}</h3>
                        <p className="text-sm text-gray-500">{t('profile.darkModeDesc')}</p>
                      </div>
                    </div>
                    <Switch
                      checked={theme === 'dark'}
                      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{t('profile.emailNotifications')}</h3>
                      <p className="text-sm text-gray-500">{t('profile.emailNotificationsDesc')}</p>
                    </div>
                    <Switch defaultChecked />
>>>>>>> origin/db_yod
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
<<<<<<< HEAD
                      <h3 className="font-medium">การแจ้งเตือนแบบ Push</h3>
                      <p className="text-sm text-gray-500">รับการแจ้งเตือนผ่านเบราว์เซอร์</p>
                    </div>
                    <Button variant="outline" size="sm">เปิดใช้งาน</Button>
=======
                      <h3 className="font-medium">{t('profile.pushNotifications')}</h3>
                      <p className="text-sm text-gray-500">{t('profile.pushNotificationsDesc')}</p>
                    </div>
                    <Switch defaultChecked />
>>>>>>> origin/db_yod
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
<<<<<<< HEAD
                      <h3 className="font-medium">เปลี่ยนรหัสผ่าน</h3>
                      <p className="text-sm text-gray-500">อัปเดตรหัสผ่านเพื่อความปลอดภัย</p>
                    </div>
                    <Button variant="outline" size="sm">เปลี่ยน</Button>
=======
                      <h3 className="font-medium">{t('profile.changePassword')}</h3>
                      <p className="text-sm text-gray-500">{t('profile.changePasswordDesc')}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setChangePasswordOpen(true)}
                    >
                      {t('common.change')}
                    </Button>
>>>>>>> origin/db_yod
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
<<<<<<< HEAD
=======

      <ChangePasswordDialog 
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
>>>>>>> origin/db_yod
    </div>
  );
};

<<<<<<< HEAD
export default Profile;
=======
export default Profile;
>>>>>>> origin/db_yod
