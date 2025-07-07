import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, Building } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    department: '',
    position: '',
    role: 'employee' as 'employee' | 'admin' | 'intern'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [newPosition, setNewPosition] = useState('');
  
  const { signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // ดึงข้อมูลจาก API
  useEffect(() => {
    fetch('http://localhost:3001/api/departments')
      .then(res => res.json())
      .then(data => setDepartments(data.data.map((d: any) => d.department_name)))
      .catch(() => setDepartments([]));

    fetch('http://localhost:3001/api/positions')
      .then(res => res.json())
      .then(data => setPositions(data.data.map((p: any) => p.position_name)))
      .catch(() => setPositions([]));
  }, []);

  // เพิ่ม department ใหม่
  const handleAddDepartment = async () => {
    if (!newDepartment) return;
    const res = await fetch('http://localhost:3001/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department_name: newDepartment }),
    });
    if (res.ok) {
      setDepartments(prev => [...prev, newDepartment]);
      setNewDepartment('');
    }
  };

  // เพิ่ม position ใหม่
  const handleAddPosition = async () => {
    if (!newPosition) return;
    const res = await fetch('http://localhost:3001/api/positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position_name: newPosition }),
    });
    if (res.ok) {
      setPositions(prev => [...prev, newPosition]);
      setNewPosition('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t('auth.passwordMismatch'),
        description: t('auth.checkPasswordMatch'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Convert intern role to employee for signup, but keep position info
      const signupRole = formData.role === 'intern' ? 'employee' : formData.role as 'employee' | 'admin';
      
      await signup(formData.email, formData.password, {
        full_name: formData.full_name,
        department: formData.department,
        position: formData.position,
        role: signupRole
      });
      
      toast({
        title: t('auth.registerSuccess'),
        description: t('auth.checkEmailVerification'),
      });
      navigate('/login');
    } catch (error: any) {
      toast({
        title: t('auth.registerError'),
        description: error.message || t('common.error'),
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
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">{t('auth.register')}</CardTitle>
            <CardDescription className="text-center">
              {t('auth.registerDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">{t('auth.fullName')}</Label>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">{t('auth.position')}</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}>
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
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
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

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.email')}
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
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
                disabled={loading}
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
    </div>
  );
};

export default Register;
