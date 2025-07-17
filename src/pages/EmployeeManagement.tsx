import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

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
  const { t } = useTranslation();
  const { user } = useAuth();
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
            position: item.position_name_th || item.position,
            department: item.department_name_th || item.department,
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
      value: employees.filter(emp => emp.position?.toLowerCase() === 'employee').length.toString(),
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{t('navigation.employeeManagement')}</h1>
            <p className="text-sm text-gray-600">
              {t('system.manageDepartment')}
            </p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="p-6 animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card 
                  key={stat.title} 
                  className="border-0 shadow-md hover:shadow-lg transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Employee List */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="gradient-bg text-white rounded-t-lg p-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-4 h-4" />
                {t('system.employeeList')}
              </CardTitle>
              <CardDescription className="text-blue-100 text-xs">
                {t('system.allEmployeesInterns')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3">
              {loading ? (
                <div className="text-sm">{t('common.loading')}</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-sm">{t('auth.fullName')}</TableHead>
                        <TableHead className="text-sm">{t('auth.email')}</TableHead>
                        <TableHead className="text-sm">{t('auth.position')}</TableHead>
                        <TableHead className="text-sm">{t('auth.department')}</TableHead>
                        <TableHead className="text-sm">{t('common.status')}</TableHead>
                        <TableHead className="text-center text-sm">{t('system.management')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedEmployees.map((employee) => {
                        // Determine badge and row style
                        let badgeColor = "";
                        let badgeText = "";
                        if (employee.role === "superadmin") {
                          badgeColor = "bg-purple-100 text-purple-800 border border-purple-300";
                          badgeText = t("employee.superadmin", "Superadmin");
                        } else if (employee.role === "admin") {
                          badgeColor = "bg-blue-100 text-blue-800 border border-blue-300";
                          badgeText = t("employee.admin");
                        } else if (employee.role === "intern") {
                          badgeColor = "bg-orange-100 text-orange-800 border border-orange-300";
                          badgeText = t("employee.intern");
                        } else {
                          badgeColor = "bg-gray-100 text-gray-800 border border-gray-300";
                          badgeText = t("employee.employee");
                        }
                        // Highlight current user
                        const isMe = user && (user.id === employee.id || user.email === employee.email);
                        return (
                          <TableRow key={employee.id} className={isMe ? "bg-blue-50" : undefined}>
                            <TableCell className="font-medium text-sm">{employee.full_name}{isMe && <span className="ml-2 text-xs text-blue-600 font-bold">(me)</span>}</TableCell>
                            <TableCell className="text-sm">{employee.email}</TableCell>
                            <TableCell className="text-sm">{t('positions.' + employee.position, employee.position)}</TableCell>
                            <TableCell className="text-sm">{t('departments.' + employee.department, employee.department)}</TableCell>
                            <TableCell>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeColor}`}>{badgeText}</span>
                            </TableCell>
                            <TableCell>
                              <span className={`font-medium text-sm ${employee.usedLeaveDays > employee.totalLeaveDays * 0.8 ? 'text-red-600' : 'text-green-600'}`}>{formatLeaveDays(employee.usedLeaveDays, t)}/{formatLeaveDays(employee.totalLeaveDays, t)}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button asChild size="sm" variant="outline" className="text-xs px-2 py-1">
                                <Link to={`/admin/employees/${employee.id}?role=${employee.role}`}>
                                  <Eye className="w-3 h-3 mr-1" />
                                  {t('system.seeDetails')}
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-4 gap-1">
                      {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-2 py-1 rounded border text-sm ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-300'} transition`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;