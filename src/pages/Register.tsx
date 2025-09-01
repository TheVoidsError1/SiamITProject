import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiService, apiEndpoints } from '@/lib/api';
import { showToastMessage } from '@/lib/toast';
import { Eye, EyeOff, Mail, Lock, User, Building } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { RegisterConfirmDialog } from '@/components/dialogs/RegisterConfirmDialog';

const Register = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('th') ? 'th' : 'en';
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    department: '',
    position: '',
    role: 'employee' as 'employee' | 'admin' | 'intern',
    gender: '' as '' | 'male' | 'female' | 'other',
    dob: '',
    phone_number: '',
    start_work: '',
    end_work: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; department_name_en: string; department_name_th: string }[]>([]);
      const [positions, setPositions] = useState<{ id: string; position_name_en: string; position_name_th: string; require_enddate?: boolean }[]>([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [error, setError] = useState<{ email?: string; full_name?: string; general?: string }>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const { signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();



  // ดึงข้อมูลจาก API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch departments
        const deptData = await apiService.get(apiEndpoints.departments);
        if (deptData && deptData.data && Array.isArray(deptData.data)) {
          const depts = deptData.data.map((d: any) => ({ id: d.id, department_name_th: d.department_name_th, department_name_en: d.department_name_en }));
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

        // Fetch positions
        const posData = await apiService.get(apiEndpoints.positions);
        if (posData && posData.data && Array.isArray(posData.data)) {
          const pos = posData.data.map((p: any) => ({ id: p.id, position_name_th: p.position_name_th, position_name_en: p.position_name_en, require_enddate: !!p.require_enddate }));
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
      } catch (error) {
        console.error('Error fetching data:', error);
        setDepartments([]);
        setPositions([]);
      }
    };

    fetchData();
  }, [lang]);

  // เพิ่ม department ใหม่
  const handleAddDepartment = async () => {
    if (!newDepartment) return;
    try {
      await apiService.post(apiEndpoints.departments, { department_name: newDepartment });
      setDepartments(prev => [...prev, { id: 'new', department_name_en: newDepartment, department_name_th: newDepartment }]);
      setNewDepartment('');
      showToastMessage.crud.createSuccess('');
    } catch (error) {
      showToastMessage.crud.createError('');
    }
  };

  // เพิ่ม position ใหม่
  const handleAddPosition = async () => {
    if (!newPosition) return;
    try {
      await apiService.post(apiEndpoints.positions, { position_name: newPosition });
      setPositions(prev => [...prev, { id: 'new', position_name_en: newPosition, position_name_th: newPosition }]);
      setNewPosition('');
      showToastMessage.crud.createSuccess('');
    } catch (error) {
      showToastMessage.crud.createError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError({});
    
    // ตรวจสอบรูปแบบอีเมล
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: t('common.error'),
        description: t('auth.invalidEmailFormat'),
        variant: "destructive",
      });
      setError({ email: t('auth.invalidEmailFormat') });
      return;
    }
    
    // ตรวจสอบเพิ่มเติมว่าอีเมลไม่ใช่รูปแบบที่ไม่สมบูรณ์ เช่น @g, @gmail
    if (formData.email.includes('@') && !formData.email.includes('.')) {
      toast({
        title: t('common.error'),
        description: t('auth.invalidEmailFormat'),
        variant: "destructive",
      });
      setError({ email: t('auth.invalidEmailFormat') });
      return;
    }
    
    // ตรวจสอบว่าโดเมนต้องมีอย่างน้อย 2 ตัวอักษรหลังจุด (เช่น .com, .co.th)
    const domainMatch = formData.email.match(/@[^@]+\.([^.]+)$/);
    if (domainMatch && domainMatch[1].length < 2) {
      toast({
        title: t('common.error'),
        description: t('auth.invalidEmailFormat'),
        variant: "destructive",
      });
      setError({ email: t('auth.invalidEmailFormat') });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t('auth.passwordMismatch'),
        description: t('auth.checkPasswordMatch'),
        variant: "destructive",
      });
      return;
    }

    // ตรวจว่าตำแหน่งต้องการ End Work Date หรือไม่
    const selectedPos = positions.find(p => p.id === formData.position);
            const requiresEndWorkDate = selectedPos ? !!selectedPos.require_enddate : false;

    if (requiresEndWorkDate) {
      if (!formData.start_work || !formData.end_work) {
        toast({ title: t('common.error'), description: t('auth.pleaseFillEndWorkDate'), variant: 'destructive' });
        return;
      }
      if (formData.start_work > formData.end_work) {
        toast({ title: t('common.error'), description: t('auth.dateRangeInvalid', 'ช่วงวันที่ไม่ถูกต้อง'), variant: 'destructive' });
        return;
      }
    }

    // แสดง dialog ยืนยันการสมัครสมาชิก
    setShowConfirmDialog(true);
  };

  const handleConfirmRegistration = async () => {
    setLoading(true);

    try {
      // Convert intern role to employee for signup, but keep position info
      const signupRole = formData.role === 'intern' ? 'employee' : formData.role as 'employee' | 'admin';
      
      await signup(formData.email, formData.password, {
        full_name: formData.full_name,
        department: formData.department,
        position: formData.position,
        role: signupRole,
        gender: formData.gender || undefined,
        dob: formData.dob,
        phone_number: formData.phone_number,
        start_work: formData.start_work || undefined,
        end_work: formData.end_work || undefined,
      });
      
      toast({
        title: t('auth.registerSuccess'),
        description: t('auth.checkEmailVerification'),
      });
      navigate('/login');
    } catch (error: any) {
      let errMsg = error.message || t('common.error');
      console.log('Registration error object:', error);
      console.log('Registration error message:', errMsg);
      let newError: { email?: string; full_name?: string; general?: string } = {};
      const lowerMsg = errMsg.toLowerCase();
      if (lowerMsg.includes('user') || lowerMsg.includes('ชื่อผู้ใช')) {
        newError.full_name = errMsg;
      } else if (lowerMsg.includes('email')) {
        newError.email = errMsg;
      } else {
        newError.general = errMsg;
      }
      setError(newError);
      toast({
        title: t('auth.registerError'),
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <img
            src="/lovable-uploads/IMG_4486-removebg-preview.png"
            alt="Siam IT Logo"
            className="mx-auto h-16 w-auto mb-6"
          />
          <h2 className="text-3xl font-bold text-gray-900">
            {t('auth.register')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('main.onlineLeaveSystemCompany')}
          </p>
        </div>

        <Card className="shadow-lg border-0">
          {/* Removed duplicate Register title and description in the card header */}
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 mb-4 mt-4">
                <Label htmlFor="full_name" className="mb-2 block">{t('auth.fullName')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="full_name"
                    placeholder={t('auth.fullName')}
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
                {error.full_name && <div className="text-red-500 text-xs mt-1">{error.full_name}</div>}
              </div>

              {/* Gender */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="gender" className="mb-2 block">{t('employee.gender')}</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value as any }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('employee.selectGender')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t('employee.male')}</SelectItem>
                    <SelectItem value="female">{t('employee.female')}</SelectItem>
                    <SelectItem value="other">{t('employee.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="dob" className="mb-2 block">{t('employee.birthdate')}</Label>
                <DatePicker 
                  date={formData.dob} 
                  onDateChange={(date) => setFormData(prev => ({ ...prev, dob: date }))}
                  placeholder={t('employee.selectDate')}
                />
              </div>

              <div className="space-y-2 mb-4">
                <Label htmlFor="position" className="mb-2 block">{t('auth.position')}</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('positions.selectPosition')} />
                  </SelectTrigger>
                  <SelectContent>
                    {positions
                      .filter(pos => (pos.position_name_th || pos.position_name_en) && (pos.position_name_th?.trim() !== '' || pos.position_name_en?.trim() !== ''))
                      .map((pos) => (
                        <SelectItem key={pos.id} value={pos.id}>
                          {lang === 'th' ? pos.position_name_th : pos.position_name_en}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 mb-4">
                <Label htmlFor="department" className="mb-2 block">{t('auth.department')}</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('departments.selectDepartment')} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments
                      .filter(dept => (dept.department_name_th || dept.department_name_en) && (dept.department_name_th?.trim() !== '' || dept.department_name_en?.trim() !== ''))
                      .map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {lang === 'th' ? dept.department_name_th : dept.department_name_en}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Phone number */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="phone" className="mb-2 block">{t('employee.phoneNumber')}</Label>
                <Input id="phone" type="tel" placeholder={t('employee.enterPhoneNumber')} value={formData.phone_number} onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))} />
              </div>

              {/* Start/End work dates: Start Work Date always shows; End Work Date shows only when position has Request Quote enabled */}
              {(() => {
                const selectedPos = positions.find(p => p.id === formData.position);
                const showEndWorkDate = selectedPos ? !!selectedPos.require_enddate : false;
                return (
                  <div className={`grid grid-cols-1 ${showEndWorkDate ? 'md:grid-cols-2' : ''} gap-4`}>
                    <div className="space-y-2">
                      <Label htmlFor="start_work" className="mb-2 block">{t('employee.startWorkDate')}</Label>
                      <DatePicker 
                        date={formData.start_work} 
                        onDateChange={(date) => setFormData(prev => ({ ...prev, start_work: date }))}
                        placeholder={t('employee.selectDate')}
                      />
                    </div>
                    {showEndWorkDate && (
                      <div className="space-y-2">
                        <Label htmlFor="end_work" className="mb-2 block">{t('employee.endWorkDate', 'End Work Date')}</Label>
                        <DatePicker 
                          date={formData.end_work} 
                          onDateChange={(date) => setFormData(prev => ({ ...prev, end_work: date }))}
                          placeholder={t('employee.selectDate')}
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="space-y-2 mb-4">
                <Label htmlFor="email" className="mb-2 block">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.email')}
                    value={formData.email}
                    onChange={(e) => {
                      const email = e.target.value;
                      setFormData(prev => ({ ...prev, email }));
                      
                      // ตรวจสอบรูปแบบอีเมลแบบ real-time
                      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                        setError(prev => ({ ...prev, email: t('auth.invalidEmailFormat') }));
                      } else if (email && email.includes('@') && !email.includes('.')) {
                        // ตรวจสอบกรณีพิเศษ เช่น @g, @gmail
                        setError(prev => ({ ...prev, email: t('auth.invalidEmailFormat') }));
                      } else if (email && email.includes('@') && email.includes('.')) {
                        // ตรวจสอบว่าโดเมนต้องมีอย่างน้อย 2 ตัวอักษรหลังจุด
                        const domainMatch = email.match(/@[^@]+\.([^.]+)$/);
                        if (domainMatch && domainMatch[1].length < 2) {
                          setError(prev => ({ ...prev, email: t('auth.invalidEmailFormat') }));
                        } else {
                          setError(prev => ({ ...prev, email: undefined }));
                        }
                      } else {
                        setError(prev => ({ ...prev, email: undefined }));
                      }
                    }}
                    className="pl-10"
                    required
                  />
                </div>
                {error.email && <div className="text-red-500 text-xs mt-1">{error.email}</div>}
              </div>
              
              <div className="space-y-2 mb-4">
                <Label htmlFor="password" className="mb-2 block">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <Label htmlFor="confirmPassword" className="mb-2 block">{t('auth.confirmPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !!error.email}
              >
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
            {error.general && <div className="text-red-500 text-xs mt-2 text-center">{error.general}</div>}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {t('auth.alreadyHaveAccount')}{' '}
                <Link 
                  to="/login" 
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {t('auth.login')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Dialog ยืนยันการสมัครสมาชิก */}
      <RegisterConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmRegistration}
      />
    </div>
  );
};

export default Register;
