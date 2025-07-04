
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Mail, Lock } from 'lucide-react';

const DemoCredentials = () => {
  const credentials = [
    {
      role: 'admin',
      email: 'admin@siamit.com',
      password: 'admin123',
      name: 'ผู้ดูแลระบบ',
      department: 'IT Department',
      position: 'System Administrator'
    },
    {
      role: 'employee',
      email: 'user@siamit.com',
      password: 'user123',
      name: 'พนักงานทั่วไป',
      department: 'Marketing',
      position: 'Marketing Executive'
    },
    {
      role: 'employee',
      email: 'john@siamit.com',
      password: 'john123',
      name: 'John Smith',
      department: 'Sales',
      position: 'Sales Manager'
    }
  ];

  return (
    <div className="mt-6 space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">ข้อมูลสำหรับทดสอบระบบ</h3>
        <p className="text-sm text-gray-600">เลือกข้อมูลด้านล่างเพื่อเข้าสู่ระบบ</p>
      </div>
      
      <div className="grid gap-3">
        {credentials.map((cred, index) => (
          <Card key={index} className="border border-gray-200 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {cred.name}
                </CardTitle>
                <Badge variant={cred.role === 'admin' ? 'destructive' : 'secondary'}>
                  {cred.role === 'admin' ? (
                    <>
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </>
                  ) : (
                    'Employee'
                  )}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {cred.position} - {cred.department}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-3 w-3" />
                  <span className="font-mono">{cred.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Lock className="h-3 w-3" />
                  <span className="font-mono">{cred.password}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-center">
        <p className="text-xs text-gray-500">
          หรือสมัครสมาชิกใหม่ด้วยอีเมลของคุณ
        </p>
      </div>
    </div>
  );
};

export default DemoCredentials;
