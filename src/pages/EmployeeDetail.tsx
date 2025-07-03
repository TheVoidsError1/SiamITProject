import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, User, Mail, Calendar, Edit, Save, X, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { LeaveDetailDialog } from "@/components/dialogs/LeaveDetailDialog";

const EmployeeDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '',
    email: '',
    password: '',
    department: '',
    position: '',
    role: ''
  });

  // เพิ่ม state สำหรับข้อมูลจริง
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaveHistory, setLeaveHistory] = useState([]);

  // อ่าน role จาก query string
  const queryParams = new URLSearchParams(location.search);
  const role = queryParams.get("role");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    let url = "";
    if (role === "admin") {
      url = `http://localhost:3001/api/admin/${id}`;
    } else {
      url = `http://localhost:3001/api/users/${id}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEmployee(data.data);
          // ดึง leave history จริง
          const repid = role === 'admin' ? data.data.admin_id : id;
          fetch(`http://localhost:3001/api/leave-request/user/${repid}`)
            .then(res => res.json())
            .then(leaveData => {
              if (leaveData.success) {
                setLeaveHistory(leaveData.data);
              } else {
                setLeaveHistory([]);
              }
            })
            .catch(() => setLeaveHistory([]));
        } else {
          setEmployee(null);
          setError('ไม่พบข้อมูลพนักงาน');
        }
        setLoading(false);
      })
      .catch(() => {
        setEmployee(null);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        setLoading(false);
      });
  }, [id, role]);

  const departments = [
    'IT Department',
    'Human Resources',
    'Marketing',
    'Sales',
    'Finance',
    'Operations',
    'Customer Service'
  ];

  const handleEdit = () => {
    setEditData({
      full_name: employee?.name || '',
      email: employee?.email || '',
      password: '',
      department: employee?.department || '',
      position: employee?.position || '',
      role: employee?.role || ''
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    toast({
      title: "บันทึกข้อมูลสำเร็จ! ✅",
      description: "ข้อมูลของพนักงานได้รับการอัปเดตแล้ว",
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      full_name: '',
      email: '',
      password: '',
      department: '',
      position: '',
      role: ''
    });
  };

  const handleViewLeaveDetails = (leave) => {
    setSelectedLeave(leave);
    setLeaveDialogOpen(true);
  };

  if (loading) return <div>กำลังโหลดข้อมูล...</div>;
  if (error) return <div>{error}</div>;
  if (!employee) return <div>ไม่พบข้อมูลพนักงาน</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/employees">
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับ
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">ข้อมูลพนักงาน</h1>
            <p className="text-sm text-gray-600">{employee.name}</p>
          </div>
        </div>
      </div>

      <div className="p-6 animate-fade-in">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Employee Info Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="gradient-bg text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                ข้อมูลส่วนตัว
              </CardTitle>
              <CardDescription className="text-blue-100">
                รายละเอียดข้อมูลพนักงาน
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">ชื่อ-นามสกุล</Label>
                    {isEditing ? (
                      <Input
                        value={editData.full_name}
                        onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-lg font-semibold">{employee.name}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">ตำแหน่ง</Label>
                    {isEditing ? (
                      <Input
                        value={editData.position}
                        onChange={(e) => setEditData({...editData, position: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-600">{employee.position}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">แผนก</Label>
                    {isEditing ? (
                      <Select onValueChange={(value) => setEditData({...editData, department: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={editData.department} />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-600">{employee.department}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">สถานะ</Label>
                    {isEditing ? (
                      <Select onValueChange={(value) => setEditData({...editData, role: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={
                            editData.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                            editData.role === 'employee' ? 'พนักงาน' : 'เด็กฝึกงาน'
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                          <SelectItem value="employee">พนักงาน</SelectItem>
                          <SelectItem value="intern">เด็กฝึกงาน</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge 
                        variant={employee.role === 'admin' ? 'default' : employee.role === 'employee' ? 'secondary' : 'outline'}
                        className="ml-2"
                      >
                        {employee.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                         employee.role === 'employee' ? 'พนักงาน' : 'เด็กฝึกงาน'}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">อีเมล</Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-600">{employee.email}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">รหัสผ่าน</Label>
                    {isEditing ? (
                      <Input
                        type="password"
                        placeholder="ใส่รหัสผ่านใหม่"
                        value={editData.password}
                        onChange={(e) => setEditData({...editData, password: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-600 mt-1">{employee.password}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">วันลาที่ใช้แล้ว</Label>
                    <p className={`text-lg font-semibold mt-1 ${employee.usedLeaveDays > employee.totalLeaveDays * 0.8 ? 'text-red-600' : 'text-green-600'}`}>
                      {employee.usedLeaveDays}/{employee.totalLeaveDays} วัน
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {isEditing ? (
                      <>
                        <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700">
                          <Save className="w-4 h-4 mr-2" />
                          บันทึก
                        </Button>
                        <Button onClick={handleCancel} size="sm" variant="outline">
                          <X className="w-4 h-4 mr-2" />
                          ยกเลิก
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleEdit} size="sm" variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        แก้ไข
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leave History Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="gradient-bg text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                ประวัติการลา
              </CardTitle>
              <CardDescription className="text-blue-100">
                รายการการลาทั้งหมดของพนักงาน
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>วันที่ลา</TableHead>
                    <TableHead>จำนวนวัน</TableHead>
                    <TableHead>เหตุผล</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>วันที่ส่งคำขอ</TableHead>
                    <TableHead className="text-center">การจัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveHistory.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell className="font-medium">{leave.leaveType}</TableCell>
                      <TableCell>
                        {leave.startDate ? format(new Date(leave.startDate), "dd MMM", { locale: th }) : ''} - {leave.endDate ? format(new Date(leave.endDate), "dd MMM yyyy", { locale: th }) : ''}
                      </TableCell>
                      <TableCell>{leave.days || ''} วัน</TableCell>
                      <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                      <TableCell>
                        <Badge className={leave.status === 'approved' ? "bg-green-100 text-green-800 border-green-200" : "bg-yellow-100 text-yellow-800 border-yellow-200"}>
                          {leave.status === 'approved' ? 'อนุมัติแล้ว' : 'รอดำเนินการ'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {leave.submittedDate ? format(new Date(leave.submittedDate), "dd MMM yyyy", { locale: th }) : ''}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewLeaveDetails(leave)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          ดูรายละเอียด
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

      <LeaveDetailDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        leaveRequest={selectedLeave}
      />
    </div>
  );
};

export default EmployeeDetail;
