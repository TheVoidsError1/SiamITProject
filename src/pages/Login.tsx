<<<<<<< HEAD
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
=======

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
>>>>>>> origin/db_yod
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import DemoCredentials from '@/components/DemoCredentials';
<<<<<<< HEAD

const Login = () => {
=======
import LanguageSwitcher from '@/components/LanguageSwitcher';

const Login = () => {
  const { t } = useTranslation();
>>>>>>> origin/db_yod
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
<<<<<<< HEAD
      const userInfo = JSON.parse(localStorage.getItem('currentUser') || '{}');
      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: "ยินดีต้อนรับเข้าสู่ระบบลาออนไลน์",
      });
      if (userInfo.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      toast({
        title: "เข้าสู่ระบบไม่สำเร็จ",
        description: error.message || "กรุณาตรวจสอบอีเมลและรหัสผ่าน",
=======
      toast({
        title: t('auth.loginSuccess'),
        description: t('auth.welcomeToSystem'),
      });
      navigate(from, { replace: true });
    } catch (error: any) {
      toast({
        title: t('auth.loginError'),
        description: error.message || t('auth.checkPasswordMatch'),
>>>>>>> origin/db_yod
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
<<<<<<< HEAD
=======
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
>>>>>>> origin/db_yod
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
        {/* Login Form */}
        <div className="space-y-8">
          <div className="text-center">
            <img
<<<<<<< HEAD
              src="/lovable-uploads/IMG_4486-removebg-preview.png"
=======
              src="/lovable-uploads/siamit.png"
>>>>>>> origin/db_yod
              alt="Siam IT Logo"
              className="mx-auto h-16 w-auto mb-6"
            />
            <h2 className="text-3xl font-bold text-gray-900">
<<<<<<< HEAD
              เข้าสู่ระบบ
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              ระบบลาออนไลน์บริษัทสยามไอที
=======
              {t('auth.login')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('main.onlineLeaveSystemCompany')}
>>>>>>> origin/db_yod
            </p>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-1">
<<<<<<< HEAD
              <CardTitle className="text-xl text-center">เข้าสู่ระบบ</CardTitle>
              <CardDescription className="text-center">
                กรุณากรอกอีเมลและรหัสผ่านของคุณ
=======
              <CardTitle className="text-xl text-center">{t('auth.login')}</CardTitle>
              <CardDescription className="text-center">
                {t('auth.enterEmailPassword')}
>>>>>>> origin/db_yod
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
<<<<<<< HEAD
                  <Label htmlFor="email">อีเมล</Label>
=======
                  <Label htmlFor="email">{t('auth.email')}</Label>
>>>>>>> origin/db_yod
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
<<<<<<< HEAD
                  <Label htmlFor="password">รหัสผ่าน</Label>
=======
                  <Label htmlFor="password">{t('auth.password')}</Label>
>>>>>>> origin/db_yod
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
<<<<<<< HEAD
                      กำลังเข้าสู่ระบบ...
                    </>
                  ) : (
                    'เข้าสู่ระบบ'
=======
                      {t('auth.loggingIn')}
                    </>
                  ) : (
                    t('auth.login')
>>>>>>> origin/db_yod
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
<<<<<<< HEAD
                  ยังไม่มีบัญชี?{' '}
=======
                  {t('auth.dontHaveAccount')}{' '}
>>>>>>> origin/db_yod
                  <Link 
                    to="/register" 
                    className="font-medium text-primary hover:text-primary/80 transition-colors"
                  >
<<<<<<< HEAD
                    สมัครสมาชิก
=======
                    {t('auth.register')}
>>>>>>> origin/db_yod
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Credentials */}
        <div className="lg:mt-24">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-center">ข้อมูลทดสอบ</CardTitle>
            </CardHeader>
            <CardContent>
              <DemoCredentials />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
