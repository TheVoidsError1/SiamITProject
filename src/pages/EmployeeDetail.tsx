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
import { useAuth } from "@/contexts/AuthContext";

const EmployeeDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
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

    // Fetch leave history for this employee by id
    fetch(`http://localhost:3001/api/leave-request/user/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setLeaveHistory(data.data);
        } else {
          setLeaveHistory([]);
        }
      })
      .catch(() => setLeaveHistory([]));
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
    try {
      const payload: any = {
        name: editData.full_name,
        position: editData.position,
        department: editData.department,
        email: editData.email,
      };
      if (editData.password && editData.password.trim() !== '') payload.password = editData.password;
      const response = await fetch(`http://localhost:3001/api/employee/${id}` , {
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
        // Refresh profile data
        const res = await fetch(`http://localhost:3001/api/employee/${id}`);
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
    console.log('View Details clicked. leave:', leave, 'leave.id:', leave.id);
    setSelectedLeave(leave);
    setLeaveDialogOpen(true);
  };

  if (loading) return <div>{t('common.loading')}</div>;
  if (error) return <div>{error}</div>;
  if (!employee) return <div>{t('employee.notFound')}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/employees">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{t('employee.details')}</h1>
            <p className="text-sm text-gray-600">{employee.name}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="p-6 animate-fade-in">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Employee Info Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="gradient-bg text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('employee.personalInfo')}
              </CardTitle>
              <CardDescription className="text-blue-100">
                {t('employee.personalInfoDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">{t('employee.fullName')}</Label>
                    {isEditing ? (
                      <Input
                        value={editData.full_name}
                        onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                        className="mt-1"
                        placeholder={t('employee.fullName')}
                      />
                    ) : (
                      <p className="text-lg font-semibold">{employee.name}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">{t('employee.position')}</Label>
                    {isEditing ? (
                      <Select onValueChange={(value) => setEditData({...editData, position: value})} value={editData.position}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={t('positions.selectPosition')} />
                        </SelectTrigger>
                        <SelectContent>
                          {positions.map((key) => (
                            <SelectItem key={key} value={key}>
                              {key === '' || key.toLowerCase() === 'none' || key.toLowerCase() === 'no position' || key.toLowerCase() === 'noposition'
                                ? t('positions.noPosition')
                                : t(`positions.${key}`, { defaultValue: key })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-600">{String(t(`positions.${employee.position}`, { defaultValue: employee.position }))}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">{t('employee.department')}</Label>
                    {isEditing ? (
                      <Select onValueChange={(value) => setEditData({...editData, department: value})} value={editData.department}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={t('departments.selectDepartment')} />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((key) => (
                            <SelectItem key={key} value={key}>
                              {key === '' || key.toLowerCase() === 'none' || key.toLowerCase() === 'no department' || key.toLowerCase() === 'nodepartment'
                                ? t('departments.noDepartment')
                                : t(`departments.${key}`, { defaultValue: key })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-600">{String(t(`departments.${employee.department}`, { defaultValue: employee.department }))}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">{t('employee.status')}</Label>
                    {isEditing ? (
                      <Select onValueChange={(value) => setEditData({...editData, role: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={
                            editData.role === 'admin' ? t('employee.admin') : 
                            editData.role === 'employee' ? t('employee.employee') : t('employee.intern')
                          } />
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
                        className="ml-2"
                      >
                        {employee.role === 'admin' ? t('employee.admin') : 
                         employee.role === 'employee' ? t('employee.employee') : t('employee.intern')}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">{t('employee.email')}</Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                        className="mt-1"
                        placeholder={t('employee.email')}
                      />
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-600">{employee.email}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">{t('employee.password')}</Label>
                    {isEditing ? (
                      <Input
                        type="password"
                        placeholder={t('employee.setNewPassword')}
                        value={editData.password || ''}
                        onChange={(e) => setEditData({...editData, password: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-600 mt-1">
                        {employee.password ? '********' : t('employee.noPassword')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    {isEditing ? (
                      <>
                        <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700">
                          <Save className="w-4 h-4 mr-2" />
                          {t('common.save')}
                        </Button>
                        <Button onClick={handleCancel} size="sm" variant="outline">
                          <X className="w-4 h-4 mr-2" />
                          {t('common.cancel')}
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleEdit} size="sm" variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        {t('common.edit')}
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
                <Calendar className="h-5 w-5" />
                {t('leave.leaveHistory')}
              </CardTitle>
              <CardDescription className="text-blue-100">
                {t('employee.leaveHistoryDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('leave.type')}</TableHead>
                    <TableHead>{t('leave.date')}</TableHead>
                    <TableHead>{t('leave.duration')}</TableHead>
                    <TableHead>{t('leave.reason')}</TableHead>
                    <TableHead>{t('leave.status')}</TableHead>
                    <TableHead>{t('leave.submittedDate')}</TableHead>
                    <TableHead className="text-center">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveHistory.map((leave, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{
                        leave.leaveTypeName
                          ? String(t(`leaveTypes.${leave.leaveTypeName}`, leave.leaveTypeName))
                          : leave.leaveType
                            ? String(t(`leaveTypes.${leave.leaveType}`, leave.leaveType))
                            : '-'
                      }</TableCell>
                      <TableCell className="whitespace-nowrap">{leave.leaveDate}</TableCell>
                      <TableCell>{leave.duration} {leave.durationType ? t(`leave.${leave.durationType}`) : ''}</TableCell>
                      <TableCell className="max-w-[100px] truncate">{leave.reason}</TableCell>
                      <TableCell>
                        <Badge
                          className={`rounded-full px-3 py-1 text-xs font-semibold
                            ${leave.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                            ${leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${leave.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                          `}
                        >
                          {String(t(`leave.${leave.status}`, leave.status))}
                        </Badge>
                      </TableCell>
                      <TableCell>{leave.submittedDate ? new Date(leave.submittedDate).toLocaleDateString() : ''}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewLeaveDetails(leave)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {String(t('common.viewDetails'))}
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
