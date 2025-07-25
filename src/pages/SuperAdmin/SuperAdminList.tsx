import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Mail, Lock, User, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const SuperAdminList: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    position: '',
    role: '', // No default, force user to select
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [error, setError] = useState<{ email?: string; full_name?: string; general?: string }>({});

  const lang = i18n.language.startsWith('th') ? 'th' : 'en';
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/departments`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data && Array.isArray(data.data)) {
          const depts = data.data.map((d: any) => ({ id: d.id, department_name_th: d.department_name_th, department_name_en: d.department_name_en }));
          const noDepartmentItem = depts.find(d => d.department_name_en === 'No Department');
          const otherDepts = depts.filter(d => d.department_name_en !== 'No Department');
          otherDepts.sort((a, b) => {
            const nameA = lang === 'th' ? a.department_name_th : a.department_name_en;
            const nameB = lang === 'th' ? b.department_name_th : b.department_name_en;
            return (nameA || '').localeCompare(nameB || '');
          });
          const sortedDepts = [...otherDepts];
          if (noDepartmentItem) {
            sortedDepts.push(noDepartmentItem);
          }
          setDepartments(sortedDepts);
        }
      })
      .catch(() => setDepartments([]));
    fetch(`${API_BASE_URL}/api/positions`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data && Array.isArray(data.data)) {
          const pos = data.data.map((p: any) => ({ id: p.id, position_name_th: p.position_name_th, position_name_en: p.position_name_en }));
          const noPositionItem = pos.find(p => p.position_name_en === 'No Position');
          const otherPos = pos.filter(p => p.position_name_en !== 'No Position');
          otherPos.sort((a, b) => {
            const nameA = lang === 'th' ? a.position_name_th : a.position_name_en;
            const nameB = lang === 'th' ? b.position_name_th : b.position_name_en;
            return (nameA || '').localeCompare(nameB || '');
          });
          const sortedPositions = [...otherPos];
          if (noPositionItem) {
            sortedPositions.push(noPositionItem);
          }
          setPositions(sortedPositions);
        }
      })
      .catch(() => setPositions([]));
  }, [lang]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value: string) => {
    setForm({ ...form, role: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError({});
    if (form.password !== form.confirmPassword) {
      toast({
        title: t('auth.passwordMismatch'),
        description: t('auth.checkPasswordMatch'),
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      const url = `${API_BASE_URL}/api/create-user-with-role`;
      const payload = {
        role: form.role,
        name: form.full_name,
        department: form.department,
        position: form.position,
        email: form.email,
        password: form.password,
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && (data.success || data.token)) {
        toast({
          title: t('auth.registerSuccess'),
          description: t('auth.checkEmailVerification'),
        });
        setForm({
          full_name: '',
          email: '',
          password: '',
          confirmPassword: '',
          department: '',
          position: '',
          role: form.role,
        });
      } else {
        toast({
          title: t('auth.registerError'),
          description: data.message || t('common.error'),
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: t('auth.registerError'),
        description: err.message || t('common.error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-white flex flex-col">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <svg viewBox="0 0 1440 320" className="w-full h-32 md:h-48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="url(#waveGradient)" fillOpacity="1" d="M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,133.3C840,107,960,85,1080,101.3C1200,117,1320,171,1380,197.3L1440,224L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z" />
            <defs>
              <linearGradient id="waveGradient" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3b82f6" />
                <stop offset="1" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center py-10 md:py-16">
          <img src="/lovable-uploads/siamit.png" alt="Logo" className="w-24 h-24 rounded-full bg-white/80 shadow-2xl border-4 border-white mb-4" />
          <h2 className="text-4xl md:text-5xl font-extrabold text-indigo-900 drop-shadow mb-2 flex items-center gap-3">
            {t('admin.createUser')}
          </h2>
          <p className="text-lg md:text-xl text-blue-900/70 mb-2 font-medium text-center max-w-2xl">
            {t('main.onlineLeaveSystemCompany', 'Siam IT Leave Management System')}
          </p>
        </div>
      </div>
      <div className="w-full max-w-lg mx-auto px-4 mt-0 animate-fade-in flex-1">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 mb-4 mt-2">
              <Label htmlFor="role" className="mb-2 block text-indigo-700 font-semibold text-lg">{t('auth.role')}</Label>
              <Select value={form.role} onValueChange={handleRoleChange}>
                <SelectTrigger className="rounded-lg border-blue-200 shadow-sm text-lg">
                  <SelectValue placeholder={t('auth.selectRole', 'Select Role')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t('employee.employee')}</SelectItem>
                  <SelectItem value="admin">{t('employee.admin')}</SelectItem>
                  <SelectItem value="superadmin">{t('employee.superadmin')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 mb-4">
              <Label htmlFor="full_name" className="mb-2 block text-indigo-700 font-semibold text-lg">{t('auth.fullName')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-indigo-400" />
                <Input
                  id="full_name"
                  name="full_name"
                  placeholder={t('auth.fullName')}
                  value={form.full_name}
                  onChange={handleChange}
                  className="pl-12 py-3 text-lg rounded-lg"
                  required
                />
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <Label htmlFor="position" className="mb-2 block text-indigo-700 font-semibold text-lg">{t('auth.position')}</Label>
              <Select value={form.position} onValueChange={value => setForm(f => ({ ...f, position: value }))}>
                <SelectTrigger className="rounded-lg border-blue-200 shadow-sm text-lg">
                  <SelectValue placeholder={t('positions.selectPosition')} />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {lang === 'th' ? pos.position_name_th : pos.position_name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 mb-4">
              <Label htmlFor="department" className="mb-2 block text-indigo-700 font-semibold text-lg">{t('auth.department')}</Label>
              <Select value={form.department} onValueChange={value => setForm(f => ({ ...f, department: value }))}>
                <SelectTrigger className="rounded-lg border-blue-200 shadow-sm text-lg">
                  <SelectValue placeholder={t('departments.selectDepartment')} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dep) => (
                    <SelectItem key={dep.id} value={dep.id}>
                      {lang === 'th' ? dep.department_name_th : dep.department_name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 mb-4">
              <Label htmlFor="email" className="mb-2 block text-indigo-700 font-semibold text-lg">{t('auth.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-indigo-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('auth.email')}
                  value={form.email}
                  onChange={handleChange}
                  className="pl-12 py-3 text-lg rounded-lg"
                  required
                />
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <Label htmlFor="password" className="mb-2 block text-indigo-700 font-semibold text-lg">{t('auth.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-indigo-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className="pl-12 pr-12 py-3 text-lg rounded-lg"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 h-5 w-5 text-indigo-400 hover:text-indigo-600"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <Label htmlFor="confirmPassword" className="mb-2 block text-indigo-700 font-semibold text-lg">{t('auth.confirmPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-indigo-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="pl-12 py-3 text-lg rounded-lg"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full py-3 text-lg font-bold rounded-xl shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('common.loading')}
                </>
              ) : (
                t('auth.register')
              )}
            </Button>
          </form>
        </div>
      </div>
      {/* Footer */}
      <footer className="w-full mt-16 py-8 bg-gradient-to-r from-blue-100 via-indigo-50 to-white text-center text-gray-400 text-base font-medium shadow-inner flex flex-col items-center gap-2">
        <img src="/lovable-uploads/siamit.png" alt="Logo" className="w-10 h-10 rounded-full mx-auto mb-1" />
        &copy; {new Date().getFullYear()} Siam IT Leave Management System
      </footer>
    </div>
  );
};

export default SuperAdminList; 