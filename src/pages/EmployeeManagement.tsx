import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { Eye, User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

// เพิ่ม type สำหรับข้อมูลพนักงาน
interface Employee {
  id: string;
  full_name: string;
  email: string;
  position: string;
  department: string;
  role: string;
  usedLeaveDays: number;
  totalLeaveDays: number;
}

// เพิ่มฟังก์ชันแปลงวันลาเป็นวัน+ชั่วโมง (รองรับ i18n)
function formatLeaveDays(days: number, t: (key: string) => string): string {
  const fullDays = Math.floor(days);
  const hours = Math.round((days - fullDays) * 9);
  if (hours > 0) {
    return `${fullDays} ${t('common.days')} ${hours} ${t('common.hour')}`;
  }
  return `${fullDays} ${t('common.days')}`;
}

const EmployeeManagement = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pendingPositionFilter, setPendingPositionFilter] = useState<string>("");
  const [pendingDepartmentFilter, setPendingDepartmentFilter] = useState<string>("");
  const [pendingRoleFilter, setPendingRoleFilter] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/employees`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const employees = data.data.map((item) => ({
            id: item.id,
            full_name: item.name || '',
            email: item.email || '',
            position: item.position || '', // เก็บ id
            department: item.department || '', // เก็บ id
            role: item.role || '',
            usedLeaveDays: item.usedLeaveDays ?? 0,
            totalLeaveDays: item.totalLeaveDays ?? 0
          }));
          setEmployees(employees);
        } else {
          setEmployees([]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ดึงตำแหน่ง
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/positions`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success' && Array.isArray(data.data)) {
          setPositions(data.data);
        }
      });
    fetch(`${API_BASE_URL}/api/departments`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success' && Array.isArray(data.data)) {
          setDepartments(data.data);
        }
      });
  }, []);

  // ฟังก์ชันแปลง id เป็นชื่อ
  const getPositionName = (id: string) => {
    const found = positions.find((p) => p.id === id);
    if (!found) return id;
    return i18n.language === 'th' ? found.position_name_th : found.position_name_en;
  };
  const getDepartmentName = (id: string) => {
    const found = departments.find((d) => d.id === id);
    if (!found) return id;
    return i18n.language === 'th' ? found.department_name_th : found.department_name_en;
  };

  // ฟังก์ชันกรองข้อมูล
  const filteredEmployees = employees.filter(emp =>
    (positionFilter === "" || emp.position === positionFilter) &&
    (departmentFilter === "" || emp.department === departmentFilter) &&
    (roleFilter === "" || emp.role === roleFilter)
  );
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const REGULAR_EMPLOYEE_POSITION_ID = '354653a2-123a-48f4-86fd-22412c25c50e';
  const stats = [
    {
      title: t('system.totalEmployees'),
      value: employees.length.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: t('system.regularEmployees'),
      value: employees.filter(emp => {
        const positionName = getPositionName(emp.position);
        return positionName === 'พนักงาน' || positionName === 'Employee';
      }).length.toString(),
      icon: User,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: t('system.interns'),
      value: employees.filter(emp => {
        const positionName = getPositionName(emp.position);
        return positionName === 'นักศึกษาฝึกงาน' || positionName === 'Intern';
      }).length.toString(),
      icon: User,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const handleDelete = async () => {
    if (!deleteTarget || !user) return;
    setDeleting(true);
    let url = "";
    if (deleteTarget.role === "superadmin") {
      url = `${API_BASE_URL}/api/superadmin/${deleteTarget.id}`;
    } else if (deleteTarget.role === "admin") {
      url = `${API_BASE_URL}/api/admins/${deleteTarget.id}`;
    } else {
      url = `${API_BASE_URL}/api/users/${deleteTarget.id}`;
    }
    try {
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setEmployees((prev) => prev.filter((e) => e.id !== deleteTarget.id));
        setDeleteTarget(null);
        toast({
          title: t('system.deleteSuccess', 'ลบสำเร็จ'),
          description: t('system.deleteUserSuccessDesc', 'ลบผู้ใช้งานสำเร็จ'),
          className: 'border-green-500 bg-green-50 text-green-900',
        });
      } else {
        alert(data.message || t("system.deleteFailed", "Delete failed"));
      }
    } catch (e) {
      alert(t("system.deleteFailed", "Delete failed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-white flex flex-col">
      {/* Hero Section (identical to other main pages) */}
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
          <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-900 drop-shadow mb-2 flex items-center gap-3">
            {t('navigation.employeeManagement')}
          </h1>
          <p className="text-lg md:text-xl text-blue-900/70 mb-2 font-medium text-center max-w-2xl">
            {t('system.manageDepartment')}
          </p>
        </div>
      </div>
      <div className="w-full max-w-6xl mx-auto px-4 mt-0 animate-fade-in flex-1">
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card 
                  key={stat.title} 
                  className="glass shadow-xl border-0 hover:scale-[1.03] hover:shadow-2xl transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <CardContent className="p-7 flex items-center gap-4">
                    <div className={`w-16 h-16 ${stat.bgColor} rounded-full flex items-center justify-center shadow-lg animate-float`}>
                      <Icon className={`w-8 h-8 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold text-blue-900 drop-shadow">{stat.value}</p>
                      <p className="text-base text-blue-500 font-medium">{stat.title}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {/* Employee List */}
          <Card className="glass shadow-2xl border-0 animate-fade-in-up">
            <CardHeader className="bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-400 text-white rounded-t-2xl p-5 shadow-lg">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold animate-slide-in-left">
                <Users className="w-6 h-6" />
                {t('system.employeeList')}
              </CardTitle>
              <CardDescription className="text-blue-100 text-sm animate-slide-in-left delay-100">
                {t('system.allEmployeesInterns')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-lg text-center py-10">{t('common.loading')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                        <th className="px-6 py-4 text-left text-base font-bold text-blue-900">{t('auth.fullName')}</th>
                        <th className="px-6 py-4 text-left text-base font-bold text-blue-900">{t('auth.email')}</th>
                        <th className="px-6 py-4 text-left text-base font-bold text-blue-900">{t('auth.position')}</th>
                        <th className="px-6 py-4 text-left text-base font-bold text-blue-900">{t('auth.department')}</th>
                        <th className="px-6 py-4 text-left text-base font-bold text-blue-900">{t('common.status')}</th>
                        <th className="px-6 py-4 text-left text-base font-bold text-blue-900">{t('system.usedTotal')}</th>
                        <th className="px-6 py-4 text-center text-base font-bold text-blue-900">{t('system.management')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEmployees.map((employee, idx) => (
                        <tr
                          key={employee.id}
                          className="transition hover:bg-blue-50/60 group animate-fade-in-up"
                          style={{ animationDelay: `${idx * 60}ms` }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                            {/* Avatar with initials */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200 flex items-center justify-center text-blue-900 font-bold text-lg shadow-md">
                              {employee.full_name ? employee.full_name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : '?'}
                            </div>
                            <span className="font-semibold text-blue-900 text-base">{employee.full_name}</span>
                          </td>
                          <td className="px-6 py-4 text-blue-700 text-base">{employee.email}</td>
                          <td className="px-6 py-4 text-blue-700 text-base">{getPositionName(employee.position)}</td>
                          <td className="px-6 py-4 text-blue-700 text-base">{getDepartmentName(employee.department)}</td>
                          <td className="px-6 py-4">
                            <Badge 
                              variant={employee.role === 'admin' ? 'default' : 'secondary'}
                              className={`text-xs px-3 py-1 rounded-full shadow ${employee.role === 'admin' ? 'bg-gradient-to-r from-blue-500 to-indigo-400 text-white' : 'bg-blue-100 text-blue-700'}`}
                            >
                              {employee.role === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-bold text-base ${employee.usedLeaveDays > employee.totalLeaveDays * 0.8 ? 'text-red-600' : 'text-green-600'}`}>{employee.usedLeaveDays}/{employee.totalLeaveDays} {t('system.days')}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Button asChild size="sm" variant="secondary" className="rounded-full px-4 py-2 font-bold bg-gradient-to-r from-blue-500 to-indigo-400 text-white shadow hover:scale-105 transition">
                              <Link to={`/admin/employees/${employee.id}?role=${employee.role}`}> 
                                <Eye className="w-4 h-4 mr-1" />
                                {t('system.seeDetails')}
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-6 gap-2">
                      {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded-full border text-base font-bold shadow transition-all duration-200 ${currentPage === page ? 'bg-gradient-to-r from-blue-500 to-indigo-400 text-white border-blue-400 scale-110' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
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

export default EmployeeManagement;