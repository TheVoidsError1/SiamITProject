import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// เพิ่ม type สำหรับข้อมูลพนักงาน
type Employee = {
  id: string;
  full_name: string;
  email: string;
  position: string;
  department: string;
  role: string;
  usedLeaveDays: number;
  totalLeaveDays: number;
};

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    fetch("http://localhost:3001/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          // map field ให้ตรงกับ type Employee
          const employees = data.data.map((item, idx) => ({
            id: idx + 1 + '', // สร้าง id ชั่วคราว (ถ้าไม่มี id จริง)
            full_name: item.name,
            email: item.email,
            position: item.position,
            department: item.department,
            role: item.role || 'employee', // ถ้าไม่มี role ให้ default เป็น employee
            usedLeaveDays: item.usedLeaveDays || 0,
            totalLeaveDays: item.totalLeaveDays || 20 // กำหนดค่า default
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
      title: "พนักงานทั้งหมด",
      value: employees.length.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "พนักงานประจำ",
      value: employees.filter(emp => emp.role === 'employee').length.toString(),
      icon: User,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "เด็กฝึกงาน",
      value: employees.filter(emp => emp.role === 'intern').length.toString(),
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
            <h1 className="text-2xl font-bold text-gray-900">บุคลากรทั้งหมด</h1>
            <p className="text-sm text-gray-600">
              จัดการข้อมูลพนักงานและเด็กฝึกงาน
            </p>
          </div>
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
                รายชื่อบุคลากร
              </CardTitle>
              <CardDescription className="text-blue-100 text-xs">
                รายการพนักงานและเด็กฝึกงานทั้งหมด
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3">
              {loading ? (
                <div className="text-sm">กำลังโหลดข้อมูล...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-sm">ชื่อ-นามสกุล</TableHead>
                        <TableHead className="text-sm">อีเมล</TableHead>
                        <TableHead className="text-sm">ตำแหน่ง</TableHead>
                        <TableHead className="text-sm">แผนก</TableHead>
                        <TableHead className="text-sm">สถานะ</TableHead>
                        <TableHead className="text-sm">วันลาใช้แล้ว/ทั้งหมด</TableHead>
                        <TableHead className="text-center text-sm">การจัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium text-sm">{employee.full_name}</TableCell>
                          <TableCell className="text-sm">{employee.email}</TableCell>
                          <TableCell className="text-sm">{employee.position}</TableCell>
                          <TableCell className="text-sm">{employee.department}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={employee.role === 'admin' ? 'default' : employee.role === 'employee' ? 'secondary' : 'outline'}
                              className="text-xs px-2 py-0.5"
                            >
                              {employee.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                                employee.role === 'employee' ? 'พนักงาน' : 'เด็กฝึกงาน'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`font-medium text-sm ${employee.usedLeaveDays > employee.totalLeaveDays * 0.8 ? 'text-red-600' : 'text-green-600'}`}>
                              {employee.usedLeaveDays}/{employee.totalLeaveDays} วัน
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button asChild size="sm" variant="outline" className="text-xs px-2 py-1">
                              <Link to={`/admin/employees/${employee.id}`}>
                                <Eye className="w-3 h-3 mr-1" />
                                ดูรายละเอียด
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
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
