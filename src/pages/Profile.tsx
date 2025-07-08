import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Building, Briefcase, Shield, Calendar, Camera, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";

const Profile = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    department: '',
    position: '',
  });
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Fetch profile from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No token found. Please log in.');
          setLoading(false);
          return;
        }
        const res = await axios.get('http://localhost:3001/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = res.data.data;
        
        // Only set form data if profile hasn't been loaded yet
        if (!profileLoaded) {
          setFormData({
            full_name: data.name || '',
            email: data.email || '',
            department: data.department || '',
            position: data.position || '',
          });
          setProfileLoaded(true);
        }
        
        // Update user context with latest data
        updateUser({
          full_name: data.name,
          email: data.email,
          department: data.department,
          position: data.position,
        });
      } catch (err: any) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []); // Keep empty dependency array

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const res = await axios.get('http://localhost:3001/api/avatar', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.data.success && res.data.avatar_url) {
          setAvatarUrl(`http://localhost:3001${res.data.avatar_url}`);
          // Only update user context if avatar_url is not already set
          if (!user?.avatar_url) {
            updateUser({ avatar_url: res.data.avatar_url });
          }
        } else {
          setAvatarUrl(null);
        }
      } catch (err) {
        setAvatarUrl(null);
      }
    };
    
    fetchAvatar();
  }, []); // Remove updateUser from dependencies

  useEffect(() => {
    fetch('http://localhost:3001/api/departments')
      .then(res => res.json())
      .then(data => {
        let depts = data.data.map((d: any) => d.department_name);
        // Identify all 'no department' variants
        const isNoDept = (d: string) => !d || d.trim() === '' || d.toLowerCase() === 'none' || d.toLowerCase() === 'no department';
        const noDept = depts.filter(isNoDept);
        const normalDepts = depts.filter(d => !isNoDept(d)).sort((a, b) => a.localeCompare(b));
        setDepartments([...normalDepts, ...noDept]);
      })
      .catch(() => setDepartments([]));

    fetch('http://localhost:3001/api/positions')
      .then(res => res.json())
      .then(data => {
        let pos = data.data.map((p: any) => p.position_name);
        pos = pos.filter(p => p && p.toLowerCase() !== 'none').sort((a, b) => a.localeCompare(b));
        const none = data.data.find((p: any) => !p.position_name || p.position_name.toLowerCase() === 'none');
        if (none) pos.push(none.position_name || '');
        setPositions(pos);
      })
      .catch(() => setPositions([]));
  }, []);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({ title: t('error.title'), description: 'No token found', variant: 'destructive' });
        return;
      }

      const response = await axios.post('http://localhost:3001/api/avatar', formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' 
        },
      });

      if (response.data.success) {
        setAvatarUrl(`http://localhost:3001${response.data.avatar_url}`);
        // Update user context with new avatar URL
        updateUser({ avatar_url: response.data.avatar_url });
        toast({ title: t('profile.uploadSuccess') });
      } else {
        throw new Error(response.data.message || t('profile.uploadError'));
      }
    } catch (err: any) {
      toast({ 
        title: t('profile.uploadError'), 
        description: err.response?.data?.message || err.message,
        variant: 'destructive' 
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: t('error.title'),
          description: 'No token found. Please log in.',
          variant: "destructive",
        });
        return;
      }

      const requestData = {
        name: formData.full_name,
        email: formData.email,
        position: formData.position,
        department: formData.department,
      };

      const response = await axios.put('http://localhost:3001/api/profile', requestData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast({
          title: t('profile.saveSuccess'),
          description: t('profile.saveSuccessDesc'),
        });
        
        // Update form data with the response data to ensure consistency
        const updatedData = response.data.data;
        setFormData({
          full_name: updatedData.name || formData.full_name,
          email: updatedData.email || formData.email,
          department: updatedData.department || formData.department,
          position: updatedData.position || formData.position,
        });
        
        // Update user context with new data
        updateUser({
          full_name: updatedData.name || formData.full_name,
          position: updatedData.position || formData.position,
          department: updatedData.department || formData.department,
          email: updatedData.email || formData.email,
        });
      } else {
        throw new Error(response.data.message || t('profile.saveError'));
      }
    } catch (error: any) {
      toast({
        title: t('error.title'),
        description: error.response?.data?.message || t('profile.saveError'),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const leaveStats = [
    { label: t('profile.vacationLeave'), used: 8, total: 15, color: 'bg-blue-500' },
    { label: t('profile.sickLeave'), used: 3, total: 10, color: 'bg-green-500' },
    { label: t('profile.personalLeave'), used: 2, total: 5, color: 'bg-orange-500' },
    { label: t('profile.maternityLeave'), used: 0, total: 90, color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{t('navigation.profile')}</h1>
            <p className="text-sm text-gray-600">{t('profile.profileTitle')}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Profile Header */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                    {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
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
                    {user?.role === 'admin' ? t('main.systemAdmin') : t('main.employee')}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {user?.department || '-'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">{t('profile.personalInfo')}</TabsTrigger>
            <TabsTrigger value="leave">{t('profile.leaveRights')}</TabsTrigger>
            <TabsTrigger value="settings">{t('profile.settings')}</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  {t('profile.personalInfo')}
                </CardTitle>
                <CardDescription>{t('profile.personalInfoDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">{t('auth.fullName')}</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('auth.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="position">{t('auth.position')}</Label>
                    <Select
                      value={formData.position}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
                      disabled={user?.role === 'admin'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('positions.selectPosition')} />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map((position) => (
                          <SelectItem key={position} value={position}>{position}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="department">{t('auth.department')}</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                      disabled={user?.role === 'admin'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('departments.selectDepartment')} />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button onClick={handleSave} disabled={saving || loading} className="w-full md:w-auto">
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('profile.saving')}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t('profile.saveData')}
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
                  {t('profile.leaveRights')}
                </CardTitle>
                <CardDescription>{t('profile.leaveRightsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {leaveStats.map((stat, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{stat.label}</span>
                        <span className="text-sm text-gray-500">
                          {stat.used}/{stat.total} {t('common.days')}
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
                        {t('common.remaining')} {stat.total - stat.used} {t('common.days')}
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
                <CardTitle>{t('profile.settings')}</CardTitle>
                <CardDescription>{t('profile.settingsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{t('profile.emailNotifications')}</h3>
                      <p className="text-sm text-gray-500">{t('profile.emailNotificationsDesc')}</p>
                    </div>
                    <Button variant="outline" size="sm">{t('common.enable')}</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{t('profile.pushNotifications')}</h3>
                      <p className="text-sm text-gray-500">{t('profile.pushNotificationsDesc')}</p>
                    </div>
                    <Button variant="outline" size="sm">{t('common.enable')}</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{t('profile.changePassword')}</h3>
                      <p className="text-sm text-gray-500">{t('profile.changePasswordDesc')}</p>
                    </div>
                    <Button variant="outline" size="sm">{t('common.change')}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
