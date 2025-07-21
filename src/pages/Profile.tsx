import LanguageSwitcher from '@/components/LanguageSwitcher';
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
import axios from 'axios';
import { Building, Calendar, Camera, Save, Shield, User, Crown } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "@/components/ui/switch";
import { usePushNotification } from "@/contexts/PushNotificationContext";
import ChangePasswordDialog from "@/components/dialogs/ChangePasswordDialog";

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
  const [leaveQuota, setLeaveQuota] = useState<any[]>([]);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const { enabled: pushNotificationEnabled, setEnabled: setPushNotificationEnabled } = usePushNotification();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [allLeaveTypes, setAllLeaveTypes] = useState<any[]>([]);

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
        const res = await axios.get('http://localhost:3001/api/profile', {
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
    fetch('http://localhost:3001/api/positions')
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

    fetch('http://localhost:3001/api/departments')
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
        const res = await axios.get('http://localhost:3001/api/leave-quota/me', {
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
        const res = await axios.get('http://localhost:3001/api/leave-types');
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
    // For personal leave, split days/hours
    const isPersonal =
      item.leave_type_en?.toLowerCase() === 'personal' ||
      item.leave_type_th === 'ลากิจ';
    const usedDays = isPersonal ? Math.floor(item.used) : item.used;
    const usedHours = isPersonal ? Math.round((item.used % 1) * 9) : 0;
    const remainingDays = isPersonal ? Math.floor(item.remaining) : item.remaining;
    const remainingHours = isPersonal ? Math.round((item.remaining % 1) * 9) : 0;
    return {
      label: i18n.language.startsWith('th') ? (item.leave_type_th || item.leave_type_en) : (item.leave_type_en || item.leave_type_th),
      used: usedDays,
      usedHour: usedHours,
      quota: item.quota,
      color: isPersonal ? 'bg-orange-500' :
        item.leave_type_en?.toLowerCase() === 'vacation' ? 'bg-blue-500' :
        item.leave_type_en?.toLowerCase() === 'sick' ? 'bg-green-500' :
        item.leave_type_en?.toLowerCase() === 'maternity' ? 'bg-purple-500' :
        'bg-gray-400',
      type: item.leave_type_en,
      remaining: remainingDays,
      remainingHour: remainingHours,
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
                <p className="text-gray-600 mb-2">{
                  (() => {
                    const posId = formData.position || user?.position;
                    const pos = positions.find(p => String(p.id) === String(posId));
                    if (pos) {
                      return i18n.language.startsWith('th') ? (pos.position_name_th || pos.position_name_en) : (pos.position_name_en || pos.position_name_th);
                    }
                    return user?.position || '-';
                  })()
                }</p>
                <div className="flex items-center gap-4">
                  {user?.role === 'superadmin' && (
                    <Badge className="flex items-center gap-1 bg-purple-100 text-purple-800 border border-purple-300">
                      <Crown className="h-3 w-3" />
                      {t('employee.superadmin', 'Superadmin')}
                    </Badge>
                  )}
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {
                      (() => {
                        const depId = formData.department || user?.department;
                        const dep = departments.find(d => String(d.id) === String(depId));
                        if (dep) {
                          return i18n.language.startsWith('th') ? (dep.department_name_th || dep.department_name_en) : (dep.department_name_en || dep.department_name_th);
                        }
                        return user?.department || '-';
                      })()
                    }
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
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('positions.selectPosition')} />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map((pos) => (
                          <SelectItem key={pos.id} value={pos.id}>
                            {i18n.language.startsWith('th') ? pos.position_name_th : pos.position_name_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="department">{t('auth.department')}</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('departments.selectDepartment')} />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dep) => (
                          <SelectItem key={dep.id} value={dep.id}>
                            {i18n.language.startsWith('th') ? dep.department_name_th : dep.department_name_en}
                          </SelectItem>
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
                {leaveLoading ? (
                  <div>Loading...</div>
                ) : (
                  <React.Fragment>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {allLeaveTypes
                        .filter(lt =>
                          (lt.leave_type_en?.toLowerCase() !== 'emergency' && lt.leave_type_th !== 'ลาฉุกเฉิน')
                        )
                        .map((lt, idx) => {
                          // Find quota/usage data for this leave type by id only
                          const item = leaveQuota.find(q => q.id === lt.id);
                          // Assign a color from the palette based on index, cycling if needed
                          const color = leaveTypeColors[idx % leaveTypeColors.length];
                          const label = lt.leave_type_en || lt.leave_type_th;
                          const unit = item?.unit === 'hour' ? t('common.hours') : t('common.days');
                          const used = (item?.used === undefined || item?.used === null) ? '-' : item.used;
                          const quota = (item?.quota === undefined || item?.quota === null) ? '-' : item.quota;
                          const remaining = (item?.remaining === undefined || item?.remaining === null) ? '-' : item.remaining;
                          const percent = (typeof item?.used === 'number' && typeof item?.quota === 'number' && item?.quota > 0) ? (item.used / item.quota) * 100 : 0;
                          return (
                            <div key={lt.id || label} className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{label}</span>
                                <span className="text-sm text-gray-500">
                                  {used}/{quota} {unit}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(100, percent)}%`, backgroundColor: color }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {t('common.remaining')} {remaining} {unit}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </React.Fragment>
                )}
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
                    <Switch
                      checked={pushNotificationEnabled}
                      onCheckedChange={setPushNotificationEnabled}
                      id="push-notification-switch"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{t('profile.changePassword')}</h3>
                      <p className="text-sm text-gray-500">{t('profile.changePasswordDesc')}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setChangePasswordOpen(true)}>{t('common.change')}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
    </div>
  );
};

export default Profile;
