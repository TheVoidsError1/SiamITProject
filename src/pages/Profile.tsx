import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Building, Briefcase, Shield, Calendar, Camera, Save, Bell, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import ChangePasswordDialog from "@/components/dialogs/ChangePasswordDialog";
import { cn } from "@/lib/utils";
import axios from 'axios';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUser, showSessionExpiredDialog } = useAuth();
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
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [positionsLoaded, setPositionsLoaded] = useState(false);
  const [departmentsLoaded, setDepartmentsLoaded] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [leaveQuota, setLeaveQuota] = useState<any[]>([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [allLeaveTypes, setAllLeaveTypes] = useState<any[]>([]);
  // ถ้ามี context push notification จริง ให้ import/use จริง แต่ถ้าไม่มี ให้ mock ไว้ก่อน
  const pushNotificationEnabled = false;

  const getKeyByLabel = (label: string, options: string[], tPrefix: string) => {
    for (const key of options) {
      if (t(`${tPrefix}.${key}`) === label) return key;
    }
    return label; // fallback: assume it's already a key
  };

  const normalizeKey = (value: string, options: string[], tPrefix: string) => {
    if (!value) return '';
    // If value is like 'positions.Employee' or 'departments.Customer Service', strip the prefix
    if (value.startsWith(`${tPrefix}.`)) {
      return value.replace(`${tPrefix}.`, '').replace(/\s/g, '');
    }
    // If value matches a label, map to key
    for (const key of options) {
      if (t(`${tPrefix}.${key}`) === value) return key;
    }
    return value; // fallback: assume it's already a key
  };

  const extractKey = (value: string, tPrefix: string) => {
    if (!value) return '';
    // If value is like 'positions.Employee' or 'departments.Customer Service', extract the part after the dot and remove spaces
    if (value.startsWith(`${tPrefix}.`)) {
      const raw = value.split('.').slice(1).join('.').replace(/\s/g, '');
      // Lowercase first letter for consistency with keys
      return raw.charAt(0).toLowerCase() + raw.slice(1);
    }
    // If value is a label, try to map to key (not implemented here, but could be added)
    return value;
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch profile from backend on mount
  useEffect(() => {
    if (!positionsLoaded || !departmentsLoaded) return;
    // Fetch profile from backend
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          showSessionExpiredDialog();
          return;
        }
        const res = await axios.get(`${API_BASE_URL}/api/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = res.data.data;
        
        console.log('Backend profile data:', data);
        console.log('Backend position_id:', data.position_id);
        console.log('Backend position_name:', data.position_name);
        console.log('Backend department_id:', data.department_id);
        console.log('Backend department_name:', data.department_name);
        console.log('Positions array:', positions);
        console.log('Departments array:', departments);

        // Only set form data if profile hasn't been loaded yet
        if (!profileLoaded) {
        setFormData({
          full_name: data.name || '',
          email: data.email || '',
          department: data.department_id || '',
          position: data.position_id || '',
        });
          setProfileLoaded(true);
        }
        
        // Update user context with latest data
        updateUser({
          full_name: data.name,
          email: data.email,
          department: data.department_name, // for display
          position: data.position_name,     // for display
        });
      } catch (err: any) {
        if (err.response?.status === 401) {
          showSessionExpiredDialog();
          return;
        }
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [positionsLoaded, departmentsLoaded]);

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          showSessionExpiredDialog();
          return;
        }
        
        const res = await axios.get(`${API_BASE_URL}/api/avatar`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.data.success && res.data.avatar_url) {
          setAvatarUrl(`${API_BASE_URL}${res.data.avatar_url}`);
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
    fetch(`${API_BASE_URL}/api/positions`)
      .then(res => res.json())
      .then(data => {
        const pos = data.data.map((p: any) => ({
          id: p.id,
          position_name_en: p.position_name_en,
          position_name_th: p.position_name_th
        }));
        setPositions(pos);
        setPositionsLoaded(true);
      })
      .catch(() => setPositionsLoaded(true));

    fetch(`${API_BASE_URL}/api/departments`)
      .then(res => res.json())
      .then(data => {
        const depts = data.data.map((d: any) => ({
          id: d.id,
          department_name_en: d.department_name_en,
          department_name_th: d.department_name_th
        }));
        setDepartments(depts);
        setDepartmentsLoaded(true);
      })
      .catch(() => setDepartmentsLoaded(true));
  }, []);

  useEffect(() => {
    const fetchLeaveQuota = async () => {
      setLeaveLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          showSessionExpiredDialog();
          return;
        }
        const res = await axios.get(`${API_BASE_URL}/api/leave-quota/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        // Log backend debug info to browser console
        if (res.data.debug) {
          console.log('LEAVE QUOTA DEBUG:', res.data.debug);
        }
        if (res.data.success) {
          setLeaveQuota(res.data.data);
        } else {
          setLeaveQuota([]);
        }
      } catch (err: any) {
        setLeaveQuota([]);
      } finally {
        setLeaveLoading(false);
      }
    };
    fetchLeaveQuota();
  }, []);

  useEffect(() => {
    // Fetch all leave types for display (not just those with quota)
    const fetchAllLeaveTypes = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/leave-types`);
        const data = res.data.data;
        if (res.data.success) {
          setAllLeaveTypes(data);
        } else {
          setAllLeaveTypes([]);
        }
      } catch {
        setAllLeaveTypes([]);
      }
    };
    fetchAllLeaveTypes();
  }, []);

  useEffect(() => {
    // This effect is no longer needed as pushNotificationEnabled is managed by usePushNotification
  }, [pushNotificationEnabled]);

  // New leaveStats for new API response
  const leaveStats = leaveQuota.map(item => {
    return {
      label: i18n.language.startsWith('th') ? (item.leave_type_th || item.leave_type_en) : (item.leave_type_en || item.leave_type_th),
      used: { days: item.used_day ?? '-', hours: item.used_hour ?? '-' },
      quota: item.quota,
      color:
        item.leave_type_en?.toLowerCase() === 'personal' || item.leave_type_th === 'ลากิจ' ? 'bg-orange-500' :
        item.leave_type_en?.toLowerCase() === 'vacation' ? 'bg-blue-500' :
        item.leave_type_en?.toLowerCase() === 'sick' ? 'bg-green-500' :
        item.leave_type_en?.toLowerCase() === 'maternity' ? 'bg-purple-500' :
        'bg-gray-400',
      type: item.leave_type_en,
      remaining: { days: item.remaining_day ?? '-', hours: item.remaining_hour ?? '-' },
      quotaRaw: item.quota,
      usedRaw: item.used_day + (item.used_hour / 9),
      remainingRaw: item.remaining_day + (item.remaining_hour / 9),
      unit: 'day',
    };
  });

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
        showSessionExpiredDialog();
        toast({ title: t('error.title'), description: 'No token found', variant: 'destructive' });
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/api/avatar`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' 
        },
      });

      if (response.data.success) {
        setAvatarUrl(`${API_BASE_URL}${response.data.avatar_url}`);
        // Update user context with new avatar URL
        updateUser({ avatar_url: response.data.avatar_url });
      toast({ title: t('profile.uploadSuccess') });
      } else {
        throw new Error(response.data.message || t('profile.uploadError'));
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        showSessionExpiredDialog();
        return;
      }
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
        showSessionExpiredDialog();
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
        position_id: formData.position,      // <-- use _id for backend compatibility
        department_id: formData.department,  // <-- use _id for backend compatibility
      };

      const response = await axios.put(`${API_BASE_URL}/api/profile`, requestData, {
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
        console.log('Updated position:', updatedData.position);
        console.log('Updated department:', updatedData.department);
        setFormData({
          full_name: updatedData.name || formData.full_name,
          email: updatedData.email || formData.email,
          department: updatedData.department_name_th || updatedData.department || formData.department,
          position: updatedData.position_name_th || updatedData.position || formData.position,
        });
        
        // Update user context with new data
        updateUser({
          full_name: updatedData.name || formData.full_name,
          position: updatedData.position_name || formData.position,
          department: updatedData.department_name || formData.department,
          email: updatedData.email || formData.email,
        });
      } else {
        throw new Error(response.data.message || t('profile.saveError'));
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        showSessionExpiredDialog();
        return;
      }
      toast({
        title: t('error.title'),
        description: error.response?.data?.message || t('profile.saveError'),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Debug output for leaveQuota and allLeaveTypes
  useEffect(() => {
    if (!leaveLoading) {
      console.log('leaveQuota:', leaveQuota);
      console.log('allLeaveTypes:', allLeaveTypes);
    }
  }, [leaveQuota, allLeaveTypes, leaveLoading]);

  // Define a color palette for leave types
  const leaveTypeColors = [
    '#4F8A8B', // teal
    '#F9A826', // orange
    '#A259F7', // purple
    '#FF6B6B', // red
    '#43BCCD', // blue
    '#F67280', // pink
    '#6C5B7B', // dark purple
    '#355C7D', // navy
    '#99B898', // green
    '#E84A5F', // coral
    '#2A363B', // dark gray
    '#FECEAB', // light orange
    '#FF847C', // salmon
    '#B5EAD7', // mint
    '#C7CEEA', // lavender
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="border-b bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex h-20 items-center px-8 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-blue-800 tracking-tight">{t('navigation.profile')}</h1>
            <p className="text-base text-gray-500 font-light mt-1">{t('profile.profileTitle')}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-10 animate-fade-in">
        {/* Profile Header */}
        <div className="flex flex-col items-center -mt-16">
          <div className="relative">
            <Avatar className="h-28 w-28 shadow-lg border-4 border-white bg-white/80 backdrop-blur rounded-full">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-2xl font-bold bg-blue-200 text-blue-900">
                {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              className="absolute bottom-2 right-2 p-2 bg-blue-500 text-white rounded-full shadow-md border-2 border-white hover:bg-blue-600 transition-colors"
              onClick={handleCameraClick}
              aria-label="Change avatar"
            >
              <Camera className="h-5 w-5" />
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-2xl font-bold text-blue-900 tracking-tight">{user?.full_name}</h2>
            <p className="text-gray-500 mb-2 text-base">{user?.position ? t(`positions.${user.position}`) : '-'}</p>
            <div className="flex items-center justify-center gap-3 mt-2">
              <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'} className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
                <Shield className="h-4 w-4" />
                {user?.role === 'admin' ? t('main.systemAdmin') : (user?.position ? t(`positions.${user.position}`) : t('main.employee'))}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
                <Building className="h-4 w-4" />
                {user?.department ? t(`departments.${user.department}`) : '-'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-3xl shadow-xl p-0 overflow-hidden">
          <Tabs defaultValue="personal" className="">
            <TabsList className="flex w-full bg-transparent border-b border-blue-100">
              <TabsTrigger value="personal" className="flex-1 text-lg font-medium py-4 rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-500 data-[state=active]:text-blue-700 transition-all">{t('profile.personalInfo')}</TabsTrigger>
              <TabsTrigger value="leave" className="flex-1 text-lg font-medium py-4 rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-400 data-[state=active]:text-blue-700 transition-all">{t('profile.leaveRights')}</TabsTrigger>
              <TabsTrigger value="settings" className="flex-1 text-lg font-medium py-4 rounded-none data-[state=active]:border-b-4 data-[state=active]:border-blue-300 data-[state=active]:text-blue-700 transition-all">{t('profile.settings')}</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="p-8 bg-white/90 rounded-3xl">
              <form className="space-y-6" onSubmit={e => { e.preventDefault(); handleSave(); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="full_name" className="text-base text-blue-900 font-medium">{t('auth.fullName')}</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="input-blue"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-base text-blue-900 font-medium">{t('auth.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="input-blue"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="position" className="text-base text-blue-900 font-medium">{t('auth.position')}</Label>
                    <Select
                      value={formData.position}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
                    >
                      <SelectTrigger className="input-blue">
                        <SelectValue placeholder={t('positions.selectPosition')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_specified" className="text-blue-900">
                          {t('positions.notSpecified')}
                        </SelectItem>
                        {positions
                          .filter(pos => (pos.position_name_th || pos.position_name_en) && (pos.position_name_th?.trim() !== '' || pos.position_name_en?.trim() !== ''))
                          .map((pos) => (
                            <SelectItem key={pos.id} value={pos.id} className="text-blue-900">
                              {i18n.language.startsWith('th') ? pos.position_name_th : pos.position_name_en}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="department" className="text-base text-blue-900 font-medium">{t('auth.department')}</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                    >
                      <SelectTrigger className="input-blue">
                        <SelectValue placeholder={t('departments.selectDepartment')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_specified" className="text-blue-900">
                          {t('departments.notSpecified', t('departments.selectDepartment'))}
                        </SelectItem>
                        {departments
                          .filter(dept => (dept.department_name_th || dept.department_name_en) && (dept.department_name_th?.trim() !== '' || dept.department_name_en?.trim() !== ''))
                          .map((dept) => (
                            <SelectItem key={dept.id} value={dept.id} className="text-blue-900">
                              {i18n.language.startsWith('th') ? dept.department_name_th : dept.department_name_en}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving || loading} className="btn-blue px-8 py-2 text-lg">
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('profile.saving')}
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        {t('profile.saveData')}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="leave" className="p-8 bg-white/90 rounded-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {leaveStats.map((stat, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-medium text-blue-900">{stat.label}</span>
                      <span className="text-base text-gray-500">
                        {stat.used.days}/{stat.quota} {t('common.days')}
                      </span>
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-2">
                      <div
                        className={`${stat.color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${(Number(stat.used.days) / Number(stat.quota)) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-blue-500">
                      {t('common.remaining')} {Number(stat.quota) - Number(stat.used.days)} {t('common.days')}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="p-8 bg-white/90 rounded-3xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 border rounded-2xl bg-blue-50 shadow-sm">
                  <div>
                    <h3 className="font-semibold text-blue-900 flex items-center gap-2"><Mail className="h-5 w-5 text-blue-400" /> {t('profile.emailNotifications')}</h3>
                    <p className="text-sm text-gray-500 mt-1">{t('profile.emailNotificationsDesc')}</p>
                  </div>
                  <Button variant="outline" size="sm" className="btn-blue-outline">{t('common.enable')}</Button>
                </div>
                <div className="flex items-center justify-between p-6 border rounded-2xl bg-blue-50 shadow-sm">
                  <div>
                    <h3 className="font-semibold text-blue-900 flex items-center gap-2"><Bell className="h-5 w-5 text-blue-400" /> {t('profile.pushNotifications')}</h3>
                    <p className="text-sm text-gray-500 mt-1">{t('profile.pushNotificationsDesc')}</p>
                  </div>
                  <Button variant="outline" size="sm" className="btn-blue-outline">{t('common.enable')}</Button>
                </div>
                <div className="flex items-center justify-between p-6 border rounded-2xl bg-blue-50 shadow-sm">
                  <div>
                    <h3 className="font-semibold text-blue-900 flex items-center gap-2"><Lock className="h-5 w-5 text-blue-400" /> {t('profile.changePassword')}</h3>
                    <p className="text-sm text-gray-500 mt-1">{t('profile.changePasswordDesc')}</p>
                  </div>
                  <Button variant="outline" size="sm" className="btn-blue-outline" onClick={() => setChangePasswordOpen(true)}>{t('common.change')}</Button>
                </div>
              </div>
              <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <style>{`
        .input-blue {
          background: rgba(255,255,255,0.7);
          border: 1.5px solid #bfdbfe;
          border-radius: 1rem;
          box-shadow: 0 1px 4px 0 rgba(31, 38, 135, 0.04);
          padding: 0.75rem 1.25rem;
          font-size: 1rem;
          color: #1e293b;
          transition: border 0.2s, box-shadow 0.2s;
        }
        .input-blue:focus {
          border: 1.5px solid #3b82f6;
          box-shadow: 0 0 0 2px #3b82f644;
          outline: none;
        }
        .btn-blue {
          background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
          color: #fff;
          border-radius: 1rem;
          font-weight: 600;
          box-shadow: 0 2px 8px 0 rgba(31, 38, 135, 0.08);
          border: none;
        }
        .btn-blue:hover {
          background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
          color: #fff;
          box-shadow: 0 4px 16px 0 rgba(31, 38, 135, 0.12);
        }
        .btn-blue-outline {
          border: 1.5px solid #3b82f6;
          color: #2563eb;
          border-radius: 1rem;
          font-weight: 500;
          background: transparent;
        }
        .btn-blue-outline:hover {
          background: #eff6ff;
          color: #1e293b;
        }
      `}</style>
    </div>
  );
};

export default Profile;
