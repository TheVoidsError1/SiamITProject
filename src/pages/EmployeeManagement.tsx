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
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
            <div className="gradient-bg text-white rounded-t-lg px-6 pt-6 pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="text-lg font-bold">{t('system.employeeList', 'Employee List')}</span>
              </div>
              <div className="text-blue-100 text-sm">{t('system.allEmployeesInterns', 'All Employees and Interns')}</div>
            </div>
            <CardContent className="p-3">
              {/* Filter UI */}
              <div className="flex flex-wrap gap-2 mb-4 items-end">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">{t('auth.position')}</label>
                  <select
                    className="border rounded px-2 py-1 text-sm min-w-[9rem]"
                    value={pendingPositionFilter}
                    onChange={e => setPendingPositionFilter(e.target.value)}
                  >
                    <option value="">{t('auth.allPositions', 'ทุกตำแหน่ง')}</option>
                    {positions.map((pos: any) => (
                      <option key={pos.id} value={pos.id}>
                        {i18n.language === 'th' ? pos.position_name_th : pos.position_name_en}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">{t('auth.department')}</label>
                  <select
                    className="border rounded px-2 py-1 text-sm min-w-[9rem]"
                    value={pendingDepartmentFilter}
                    onChange={e => setPendingDepartmentFilter(e.target.value)}
                  >
                    <option value="">{t('auth.allDepartments', 'ทุกแผนก')}</option>
                    {departments.map((dep: any) => (
                      <option key={dep.id} value={dep.id}>
                        {i18n.language === 'th' ? dep.department_name_th : dep.department_name_en}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">{t('auth.role')}</label>
                  <select
                    className="border rounded px-2 py-1 text-sm min-w-[9rem]"
                    value={pendingRoleFilter}
                    onChange={e => setPendingRoleFilter(e.target.value)}
                  >
                    <option value="">{t('auth.allRoles', 'ทุกสถานะ')}</option>
                    <option value="user">{t('employee.employee', 'Employee')}</option>
                    <option value="admin">{t('employee.admin', 'Admin')}</option>
                    <option value="superadmin">{t('employee.superadmin', 'Superadmin')}</option>
                    <option value="intern">{t('employee.intern', 'Intern')}</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <button
                    className="w-full h-10 bg-blue-500 hover:bg-blue-600 text-white rounded px-4 mt-5"
                    onClick={e => {
                      e.preventDefault();
                      setPositionFilter(pendingPositionFilter);
                      setDepartmentFilter(pendingDepartmentFilter);
                      setRoleFilter(pendingRoleFilter);
                      setCurrentPage(1);
                    }}
                  >
                    {t('common.confirm', 'ยืนยัน')}
                  </button>
                </div>
                <div className="flex flex-col">
                  <button
                    className="w-full h-10 border border-gray-300 rounded px-4 mt-5 bg-white text-gray-700"
                    onClick={e => {
                      e.preventDefault();
                      setPendingPositionFilter("");
                      setPendingDepartmentFilter("");
                      setPendingRoleFilter("");
                      setPositionFilter("");
                      setDepartmentFilter("");
                      setRoleFilter("");
                      setCurrentPage(1);
                    }}
                  >
                    {t('common.reset', 'รีเซ็ต')}
                  </button>
                </div>
              </div>
              {loading ? (
                <div className="text-sm">{t('common.loading')}</div>
              ) : paginatedEmployees.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                  <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-6 py-4 rounded text-center text-base font-medium shadow-sm">
                    {t('employee.noEmployeesFound', 'ไม่พบข้อมูลพนักงานตามเงื่อนไขที่เลือก')}
                  </div>
                </div>
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
                          badgeColor = "bg-blue-100 text-blue-800 border-blue-300";
                          badgeText = t("employee.admin");
                        } else if (employee.role === "intern") {
                          badgeColor = "bg-orange-100 text-orange-800 border-orange-300";
                          badgeText = t("employee.intern");
                        } else {
                          badgeColor = "bg-gray-100 text-gray-800 border-gray-300";
                          badgeText = t("employee.employee");
                        }
                        // Highlight current user
                        const isMe = user && (user.id === employee.id || user.email === employee.email);
                        return (
                          <TableRow key={employee.id} className={isMe ? "bg-blue-50" : undefined}>
                            <TableCell className="font-medium text-sm">{employee.full_name}{isMe && <span className="ml-2 text-xs text-blue-600 font-bold">(me)</span>}</TableCell>
                            <TableCell className="text-sm">{employee.email}</TableCell>
                            <TableCell className="text-sm">{getPositionName(employee.position)}</TableCell>
                            <TableCell className="text-sm">{getDepartmentName(employee.department)}</TableCell>
                            <TableCell>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeColor}`}>{badgeText}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex gap-2 justify-start items-center min-h-[36px]">
                                <Button asChild size="sm" variant="outline" className="text-xs px-2 py-1 min-w-[110px]">
                                  <Link to={`/admin/employees/${employee.id}?role=${employee.role}`}>
                                    <Eye className="w-3 h-3 mr-1" />
                                    {t('system.seeDetails')}
                                  </Link>
                                </Button>
                                {/* Only superadmin can see delete, and cannot delete themselves */}
                                {user?.role === "superadmin" && !(employee.role === "superadmin" && isMe) ? (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="text-xs px-2 py-1 min-w-[80px]"
                                        onClick={() => setDeleteTarget(employee)}
                                      >
                                        {t('system.delete', 'Delete')}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>{t('system.confirmDelete', 'Confirm Delete')}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          {t('system.confirmDeleteUser', { name: employee.full_name })}
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel disabled={deleting}>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                                        <AlertDialogAction disabled={deleting} onClick={handleDelete}>
                                          {deleting ? t('common.loading', 'Loading...') : t('system.confirm', 'Confirm')}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                ) : null}
                              </div>
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