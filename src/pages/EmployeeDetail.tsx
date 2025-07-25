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
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Avatar } from "@/components/ui/avatar";

const EmployeeDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const { t } = useTranslation();
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
  // เพิ่ม state สำหรับ processCheckId
  const [processCheckId, setProcessCheckId] = useState(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/departments')
      .then(res => res.json())
      .then(data => {
        let depts = data.data.map((d: any) => d.department_name);
        const isNoDept = (d: string) => !d || d.trim() === '' || d.toLowerCase() === 'none' || d.toLowerCase() === 'no department' || d.toLowerCase() === 'nodepartment';
        const noDept = depts.filter(isNoDept);
        // Sort by translated label
        const normalDepts = depts.filter(d => !isNoDept(d)).sort((a, b) => t(`departments.${a}`).localeCompare(t(`departments.${b}`)));
        setDepartments([...normalDepts, ...noDept]);
      })
      .catch(() => setDepartments([]));

    fetch('http://localhost:3001/api/positions')
      .then(res => res.json())
      .then(data => {
        let pos = data.data.map((p: any) => p.position_name);
        const isNoPos = (p: string) => !p || p.trim() === '' || p.toLowerCase() === 'none' || p.toLowerCase() === 'no position' || p.toLowerCase() === 'noposition';
        const noPos = pos.filter(isNoPos);
        // Sort by translated label
        const normalPos = pos.filter(p => !isNoPos(p)).sort((a, b) => t(`positions.${a}`).localeCompare(t(`positions.${b}`)));
        setPositions([...normalPos, ...noPos]);
      })
      .catch(() => setPositions([]));
  }, []);

  // อ่าน role จาก query string
  const queryParams = new URLSearchParams(location.search);
  const role = queryParams.get("role");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`http://localhost:3001/api/employee/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEmployee(data.data);
        } else {
          setEmployee(null);
          setError(t('employee.notFound'));
        }
        setLoading(false);
      })
      .catch(() => {
        setEmployee(null);
        setError(t('employee.loadError'));
        setLoading(false);
      });
  }, [id, t]);

  const handleEdit = () => {
    setEditData({
      full_name: employee?.name || '',
      email: employee?.email || '',
      password: '', // Always blank when editing
      department: employee?.department || '',
      position: employee?.position || '',
      role: employee?.role || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!processCheckId) {
      toast({ title: t('error.title'), description: t('employee.noProcessCheckId') });
      return;
    }
    try {
      const payload: any = {
        User_name: editData.full_name,
        position: editData.position,
        department: editData.department,
        email: editData.email,
      };
      if (editData.password && editData.password.trim() !== '') payload.password = editData.password;
      // role ไม่ได้อัปเดตใน backend (process_check.Role) ใน API นี้
      const response = await fetch(`http://localhost:3001/api/profile/${processCheckId}` , {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: t('employee.saveSuccess'),
          description: t('employee.updateSuccess'),
        });
        setIsEditing(false);
        // รีเฟรชข้อมูลใหม่
        let url = "";
        if (role === "admin") {
          url = `http://localhost:3001/api/admin/${id}`;
        } else {
          url = `http://localhost:3001/api/users/${id}`;
        }
        const res = await fetch(url);
        const empData = await res.json();
        if (empData.success) setEmployee(empData.data);
      } else {
        toast({ title: t('error.title'), description: data.message || t('employee.saveError') });
      }
    } catch (err) {
      toast({ title: t('error.title'), description: t('employee.saveError') });
    }
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

  if (loading) return <div>{t('common.loading')}</div>;
  if (error) return <div>{error}</div>;
  if (!employee) return <div>{t('employee.notFound')}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 relative overflow-x-hidden">
      {/* Floating/Parallax Background Shapes */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[350px] h-[350px] rounded-full bg-gradient-to-br from-blue-200 via-indigo-100 to-purple-100 opacity-30 blur-2xl animate-float-slow" />
        <div className="absolute bottom-0 right-0 w-[250px] h-[250px] rounded-full bg-gradient-to-tr from-purple-200 via-blue-100 to-indigo-100 opacity-20 blur-xl animate-float-slow2" />
        <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full bg-blue-100 opacity-10 blur-xl animate-pulse-slow" style={{transform:'translate(-50%,-50%)'}} />
      </div>
      {/* Topbar */}
      <div className="border-b bg-white/80 backdrop-blur-sm z-10 relative shadow-lg">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/employees">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight drop-shadow-lg animate-slide-in-left">{t('employee.details')}</h1>
            <p className="text-sm text-blue-500 animate-slide-in-left delay-100">{employee.name}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>
      <div className="p-6 animate-fade-in">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Personal Info Card */}
          <Card className="glass shadow-2xl border-0 animate-fade-in-up">
            <CardHeader className="bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-400 text-white rounded-t-2xl p-5 shadow-lg">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold animate-slide-in-left">
                <User className="h-6 w-6" />
                {t('employee.personalInfo')}
              </CardTitle>
              <CardDescription className="text-blue-100 text-sm animate-slide-in-left delay-100">
                {t('employee.personalInfoDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row gap-8 p-6 items-center md:items-start">
                <Avatar className="w-24 h-24 shadow-xl">
                  <span className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200 text-blue-900 font-bold text-3xl rounded-full">
                    {employee.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                  </span>
                </Avatar>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <Label className="text-sm font-medium text-blue-700">{t('employee.fullName')}</Label>
                    {isEditing ? (
                      <Input
                        value={editData.full_name}
                        onChange={e => setEditData({ ...editData, full_name: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-lg font-bold text-blue-900 mt-1">{employee.name}</p>
                    )}
                  </div>
                  {/* Position */}
                  <div>
                    <Label className="text-sm font-medium text-blue-700">{t('employee.position')}</Label>
                    {isEditing ? (
                      <Select value={editData.position} onValueChange={value => setEditData({ ...editData, position: value })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={t('positions.selectPosition')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_specified">
                            {t('positions.noPosition')}
                          </SelectItem>
                          {positions
                            .filter(key => key && key.trim() !== '' && key.toLowerCase() !== 'none' && key.toLowerCase() !== 'no position' && key.toLowerCase() !== 'noposition')
                            .map((key) => (
                              <SelectItem key={key} value={key}>
                                {t(`positions.${key}`)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-base text-blue-700 mt-1">{t(`positions.${employee.position}`)}</p>
                    )}
                  </div>
                  {/* Department */}
                  <div>
                    <Label className="text-sm font-medium text-blue-700">{t('employee.department')}</Label>
                    {isEditing ? (
                      <Select value={editData.department} onValueChange={value => setEditData({ ...editData, department: value })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={t('departments.selectDepartment')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_specified">
                            {t('departments.noDepartment')}
                          </SelectItem>
                          {departments
                            .filter(key => key && key.trim() !== '' && key.toLowerCase() !== 'none' && key.toLowerCase() !== 'no department' && key.toLowerCase() !== 'nodepartment')
                            .map((key) => (
                              <SelectItem key={key} value={key}>
                                {t(`departments.${key}`)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-base text-blue-700 mt-1">{t(`departments.${employee.department}`)}</p>
                    )}
                  </div>
                  {/* Status/Role */}
                  <div>
                    <Label className="text-sm font-medium text-blue-700">{t('employee.status')}</Label>
                    {isEditing ? (
                      <Select value={editData.role} onValueChange={value => setEditData({ ...editData, role: value })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={t('employee.status')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">{t('employee.admin')}</SelectItem>
                          <SelectItem value="employee">{t('employee.employee')}</SelectItem>
                          <SelectItem value="intern">{t('employee.intern')}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge 
                        variant={employee.role === 'admin' ? 'default' : employee.role === 'employee' ? 'secondary' : 'outline'}
                        className="ml-2 text-base px-4 py-1 rounded-full shadow"
                      >
                        {employee.role === 'admin' ? t('employee.admin') : employee.role === 'employee' ? t('employee.employee') : t('employee.intern')}
                      </Badge>
                    )}
                  </div>
                  {/* Email */}
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-blue-700">{t('employee.email')}</Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editData.email}
                        onChange={e => setEditData({ ...editData, email: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-blue-400" />
                        <p className="text-base text-blue-700">{employee.email}</p>
                      </div>
                    )}
                  </div>
                  {/* Used Leave Days */}
                  <div>
                    <Label className="text-sm font-medium text-blue-700">{t('employee.usedLeaveDays')}</Label>
                    <p className={`text-lg font-bold mt-1 ${employee.usedLeaveDays && employee.totalLeaveDays && employee.usedLeaveDays > employee.totalLeaveDays * 0.8 ? 'text-red-600' : 'text-green-600'}`}>{employee.usedLeaveDays ?? '-'} / {employee.totalLeaveDays ?? '-'} {t('leave.days')}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 mt-6 md:mt-0 md:ml-6">
                  {isEditing ? (
                    <>
                      <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-full px-4 py-2 font-bold shadow">
                        <Save className="w-4 h-4 mr-1" />{t('common.save')}
                      </Button>
                      <Button onClick={handleCancel} size="sm" variant="outline" className="rounded-full px-4 py-2 font-bold border-blue-200 text-blue-700 hover:bg-blue-50 shadow">
                        <X className="w-4 h-4 mr-1" />{t('common.cancel')}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleEdit} size="sm" variant="outline" className="rounded-full px-4 py-2 font-bold border-blue-200 text-blue-700 hover:bg-blue-50 shadow">
                      <Edit className="w-4 h-4 mr-1" />{t('common.edit')}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Leave History Card */}
          <Card className="glass shadow-2xl border-0 animate-fade-in-up">
            <CardHeader className="bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-400 text-white rounded-t-2xl p-5 shadow-lg">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold animate-slide-in-left">
                <Calendar className="h-6 w-6" />
                {t('leave.leaveHistory')}
              </CardTitle>
              <CardDescription className="text-blue-100 text-sm animate-slide-in-left delay-100">
                {t('employee.leaveHistoryDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('leave.type')}</TableHead>
                      <TableHead>{t('leave.date')}</TableHead>
                      <TableHead>{t('leave.duration') || 'จำนวนวัน'}</TableHead>
                      <TableHead>{t('leave.reason')}</TableHead>
                      <TableHead>{t('leave.status')}</TableHead>
                      <TableHead>{t('leave.submittedDate')}</TableHead>
                      <TableHead className="text-center">{t('common.actions') || 'การจัดการ'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveHistory.map((leave, idx) => (
                      <TableRow key={leave.id} className="hover:bg-blue-50/60 group animate-fade-in-up" style={{ animationDelay: `${idx * 60}ms` }}>
                        <TableCell className="font-medium text-blue-900">{leave.leaveType}</TableCell>
                        <TableCell className="text-blue-700">
                          {leave.startDate ? format(new Date(leave.startDate), "dd MMM", { locale: th }) : ''} - {leave.endDate ? format(new Date(leave.endDate), "dd MMM yyyy", { locale: th }) : ''}
                        </TableCell>
                        <TableCell className="text-blue-700">{leave.days || ''} {t('leave.days')}</TableCell>
                        <TableCell className="max-w-xs truncate text-blue-700">{leave.reason}</TableCell>
                        <TableCell>
                          <Badge className={
                            leave.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                            leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                            'bg-red-100 text-red-700 border-red-200'
                          }>
                            {leave.status === 'approved' ? t('leave.approved') : leave.status === 'pending' ? t('leave.pending') : t('leave.rejected')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-blue-700">
                          {leave.submittedDate ? format(new Date(leave.submittedDate), "dd MMM yyyy", { locale: th }) : ''}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full px-4 py-2 font-bold border-blue-200 text-blue-700 hover:bg-blue-50 shadow"
                            onClick={() => handleViewLeaveDetails(leave)}
                          >
                            <Eye className="w-4 h-4 mr-1" />{t('common.viewDetails')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
