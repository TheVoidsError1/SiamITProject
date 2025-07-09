import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { Eye, User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

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

const EmployeeManagement = () => {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    fetch("http://localhost:3001/api/employees")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          // map field ให้ตรงกับ type Employee
          const employees = data.data.map((item) => ({
            id: item.id,
            full_name: item.name || '',
            email: item.email || '',
            position: item.position || '',
            department: item.department || '',
            role: item.role || '',
            usedLeaveDays: 0,
            totalLeaveDays: 20
          }));
          setEmployees(employees);
        } else {
          setEmployees([]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(employees.length / itemsPerPage);
  const paginatedEmployees = employees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
      value: employees.filter(
        emp =>
          (emp.role === 'admin') ||
          ((emp.role === 'employee' || emp.role === 'user') && emp.position?.toLowerCase() === 'employee')
      ).length.toString(),
      icon: User,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: t('system.interns'),
      value: employees.filter(emp => emp.position?.toLowerCase() === 'intern').length.toString(),
      icon: User,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 relative overflow-x-hidden">
      {/* Floating/Parallax Background Shapes */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[350px] h-[350px] rounded-full bg-gradient-to-br from-blue-200 via-indigo-100 to-purple-100 opacity-30 blur-2xl animate-float-slow" />
        <div className="absolute bottom-0 right-0 w-[250px] h-[250px] rounded-full bg-gradient-to-tr from-purple-200 via-blue-100 to-indigo-100 opacity-20 blur-xl animate-float-slow2" />
        <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full bg-blue-100 opacity-10 blur-xl animate-pulse-slow" style={{transform:'translate(-50%,-50%)'}} />
      </div>
      <div className="border-b bg-white/80 backdrop-blur-sm z-10 relative">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight drop-shadow-lg animate-slide-in-left">{t('navigation.employeeManagement')}</h1>
            <p className="text-sm text-blue-500 animate-slide-in-left delay-100">{t('system.manageDepartment')}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>
      <div className="p-6 animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                          <td className="px-6 py-4 text-blue-700 text-base">{employee.position}</td>
                          <td className="px-6 py-4 text-blue-700 text-base">{employee.department}</td>
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
    </div>
  );
};

export default EmployeeManagement;