import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiService, apiEndpoints } from '@/lib/api';
import { showToastMessage } from '@/lib/toast';
import { Eye, EyeOff, Mail, Lock, User, Building } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; department_name_en: string; department_name_th: string }[]>([]);
  const [positions, setPositions] = useState<{ id: string; position_name_en: string; position_name_th: string }[]>([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [error, setError] = useState<{ email?: string; full_name?: string; general?: string }>({});
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  
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
          const pos = posData.data.map((p: any) => ({ id: p.id, position_name_th: p.position_name_th, position_name_en: p.position_name_en }));
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
      showToastMessage.crud.createSuccess('แผนก');
    } catch (error) {
      showToastMessage.crud.createError('แผนก');
    }
  };

  // เพิ่ม position ใหม่
  const handleAddPosition = async () => {
    if (!newPosition) return;
    try {
      await apiService.post(apiEndpoints.positions, { position_name: newPosition });
      setPositions(prev => [...prev, { id: 'new', position_name_en: newPosition, position_name_th: newPosition }]);
      setNewPosition('');
      showToastMessage.crud.createSuccess('ตำแหน่ง');
    } catch (error) {
      showToastMessage.crud.createError('ตำแหน่ง');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError({});
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t('auth.passwordMismatch'),
        description: t('auth.checkPasswordMatch'),
        variant: "destructive",
      });
      return;
    }

    // ตรวจว่าเป็นเด็กฝึกงานหรือไม่ เพื่อกำหนด validation ช่วงฝึกงาน
    const selectedPos = positions.find(p => p.id === formData.position);
    const isIntern = selectedPos ? (
      (selectedPos.position_name_th || '').includes('ฝึกงาน') ||
      (selectedPos.position_name_en || '').toLowerCase().includes('intern')
    ) : false;

    if (isIntern) {
      if (!formData.start_work || !formData.end_work) {
        toast({ title: t('common.error'), description: t('auth.pleaseFillInternDates', 'กรุณาเลือกวันที่เริ่มและสิ้นสุดการฝึกงาน'), variant: 'destructive' });
        return;
      }
      if (formData.start_work > formData.end_work) {
        toast({ title: t('common.error'), description: t('auth.dateRangeInvalid', 'ช่วงวันที่ฝึกงานไม่ถูกต้อง'), variant: 'destructive' });
        return;
      }
    }

    setLoading(true);

    try {
      // Convert intern role to employee for signup, but keep position info
      const signupRole = formData.role === 'intern' ? 'employee' : formData.role as 'employee' | 'admin';
      
      await signup(formData.email, formData.password, {
        full_name: formData.full_name,
        department: formData.department,
        position: formData.position,
        role: signupRole,
        gender: formData.gender,
        dob: formData.dob,
        phone_number: formData.phone_number,
        start_work: formData.start_work || undefined,
        end_work: isIntern ? formData.end_work : undefined,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-lg space-y-8 relative z-10">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-20 animate-pulse"></div>
            <img
              src="/lovable-uploads/IMG_4486-removebg-preview.png"
              alt="Siam IT Logo"
              className="relative mx-auto h-20 w-auto mb-6 drop-shadow-lg"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              {t('auth.register')}
            </h1>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              {t('main.onlineLeaveSystemCompany')}
            </p>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name Field */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('auth.fullName')}
                </Label>
                <div className="relative group">
                  <Input
                    id="full_name"
                    placeholder={t('auth.fullName')}
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="pl-12 pr-4 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-xl"
                    required
                  />
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
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
                <Input id="dob" type="date" value={formData.dob} onChange={(e) => setFormData(prev => ({ ...prev, dob: e.target.value }))} />
              </div>

              <div className="space-y-2 mb-4">
                <Label htmlFor="position" className="mb-2 block">{t('auth.position')}</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}>
                  <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-xl py-3">
                    <SelectValue placeholder={t('positions.selectPosition')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">
                      {t('positions.notSpecified')}
                    </SelectItem>
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

              {/* Department Field */}
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  {t('auth.department')}
                </Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                  <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-xl py-3">
                    <SelectValue placeholder={t('departments.selectDepartment')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">
                      {t('departments.notSpecified')}
                    </SelectItem>
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

              {/* Start/End work dates: always show start date; show end date only for Intern */}
              {(() => {
                const selectedPos = positions.find(p => p.id === formData.position);
                const isIntern = selectedPos ? (
                  (selectedPos.position_name_th || '').includes('ฝึกงาน') ||
                  (selectedPos.position_name_en || '').toLowerCase().includes('intern')
                ) : false;
                return (
                  <div className={`grid grid-cols-1 ${isIntern ? 'md:grid-cols-2' : ''} gap-4`}>
                    <div className="space-y-2">
                      <Label htmlFor="start_work" className="mb-2 block">{isIntern ? t('employee.internshipStartDate') : t('employee.startWorkDate')}</Label>
                      <Input id="start_work" type="date" value={formData.start_work} onChange={(e) => setFormData(prev => ({ ...prev, start_work: e.target.value }))} />
                    </div>
                    {isIntern && (
                      <div className="space-y-2">
                        <Label htmlFor="end_work" className="mb-2 block">{t('employee.internshipEndDate')}</Label>
                        <Input id="end_work" type="date" value={formData.end_work} onChange={(e) => setFormData(prev => ({ ...prev, end_work: e.target.value }))} />
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
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-12 pr-4 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-xl"
                    required
                  />
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                {error.email && (
                  <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                    <AlertCircle className="h-4 w-4" />
                    {error.email}
                  </div>
                )}
              </div>
              
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {t('auth.password')}
                </Label>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handlePasswordChange}
                    className="pl-12 pr-12 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-xl"
                    required
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {formData.password && (
                  <div className={`flex items-center gap-2 text-sm mt-1 ${getPasswordStrengthColor()}`}>
                    <div className={`w-2 h-2 rounded-full ${
                      passwordStrength === 'weak' ? 'bg-red-500' : 
                      passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    {getPasswordStrengthText()}
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {t('auth.confirmPassword')}
                </Label>
                <div className="relative group">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="pl-12 pr-12 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-xl"
                    required
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password && (
                  <div className={`flex items-center gap-2 text-sm mt-1 ${
                    formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        {t('auth.passwordsMatch')}
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4" />
                        {t('auth.passwordsDoNotMatch')}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    {t('common.loading')}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    {t('auth.register')}
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </form>

            {error.general && (
              <div className="flex items-center gap-2 text-red-500 text-sm mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="h-4 w-4" />
                {error.general}
              </div>
            )}

            {/* Login Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                {t('auth.alreadyHaveAccount')}{' '}
                <Link 
                  to="/login" 
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors underline decoration-2 underline-offset-2"
                >
                  {t('auth.login')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add custom CSS for animations */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Register;
