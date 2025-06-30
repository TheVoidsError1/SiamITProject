
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, User, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const EmployeeManagement = () => {
  const employees = [
    {
      id: '1',
      full_name: 'ผู้ดูแลระบบ',
      email: 'admin@siamit.com',
      role: 'admin',
      department: 'IT Department',
      position: 'System Administrator',
      usedLeaveDays: 5,
      totalLeaveDays: 20
    },
    {
      id: '2',
      full_name: 'พนักงานทั่วไป',
      email: 'user@siamit.com',
      role: 'employee',
      department: 'Marketing',
      position: 'Marketing Executive',
      usedLeaveDays: 12,
      totalLeaveDays: 18
    },
    {
      id: '3',
      full_name: 'John Smith',
      email: 'john@siamit.com',
      role: 'employee',
      department: 'Sales',
      position: 'Sales Manager',
      usedLeaveDays: 8,
      totalLeaveDays: 20
    },
    {
      id: '4',
      full_name: 'สมชาย ใจดี',
      email: 'somchai@siamit.com',
      role: 'intern',
      department: 'IT Department',
      position: 'Intern Developer',
      usedLeaveDays: 3,
      totalLeaveDays: 10
    }
  ];

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
            <CardHeader className="gradient-bg text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                รายชื่อบุคลากร
              </CardTitle>
              <CardDescription className="text-blue-100">
                รายการพนักงานและเด็กฝึกงานทั้งหมด
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ-นามสกุล</TableHead>
                    <TableHead>อีเมล</TableHead>
                    <TableHead>ตำแหน่ง</TableHead>
                    <TableHead>แผนก</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>วันลาใช้แล้ว/ทั้งหมด</TableHead>
                    <TableHead className="text-center">การจัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.full_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {employee.email}
                        </div>
                      </TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={employee.role === 'admin' ? 'default' : employee.role === 'employee' ? 'secondary' : 'outline'}
                        >
                          {employee.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                           employee.role === 'employee' ? 'พนักงาน' : 'เด็กฝึกงาน'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${employee.usedLeaveDays > employee.totalLeaveDays * 0.8 ? 'text-red-600' : 'text-green-600'}`}>
                          {employee.usedLeaveDays}/{employee.totalLeaveDays} วัน
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/admin/employees/${employee.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            ดูรายละเอียด
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;
