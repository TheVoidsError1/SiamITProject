import { LeaveDetailDialog } from "@/components/dialogs/LeaveDetailDialog";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useParams, useLocation, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, Edit, Eye, Mail, Save, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/avatar";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const EmployeeDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user, showSessionExpiredDialog } = useAuth();
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
  const [leaveSummary, setLeaveSummary] = useState<{ totalLeaveDays: number, totalLeaveHours: number } | null>(null); // <--- เพิ่ม state
  // เพิ่ม state สำหรับ processCheckId
  const [processCheckId, setProcessCheckId] = useState(null);
  const [departments, setDepartments] = useState<{ id: string; department_name: string; department_name_en?: string; department_name_th?: string }[]>([]);
  const [positions, setPositions] = useState<{ id: string; position_name: string; position_name_en?: string; position_name_th?: string }[]>([]);
  // --- เพิ่ม state สำหรับ paging ---
  const [leavePage, setLeavePage] = useState(1);
  const [leaveTotalPages, setLeaveTotalPages] = useState(1);

  // --- State สำหรับ Filter ---
  // state สำหรับค่าที่เลือกในฟิลเตอร์ (pending)
  const [pendingFilterType, setPendingFilterType] = useState("all");
  const [pendingFilterMonth, setPendingFilterMonth] = useState("all");
  const [pendingFilterYear, setPendingFilterYear] = useState("all");
  const [pendingFilterStatus, setPendingFilterStatus] = useState("all");
  const [pendingFilterBackdated, setPendingFilterBackdated] = useState("all"); // เพิ่ม state สำหรับ backdated
  // state สำหรับค่าฟิลเตอร์ที่ใช้งานจริง (active)
  const [filterType, setFilterType] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBackdated, setFilterBackdated] = useState("all"); // เพิ่ม state สำหรับ backdated
  // state สำหรับ error ของ filter
  const [filterError, setFilterError] = useState("");
  // state สำหรับแสดง * สีแดงแต่ละ filter
  const [showTypeError, setShowTypeError] = useState(false);
  const [showMonthError, setShowMonthError] = useState(false);
  const [showYearError, setShowYearError] = useState(false);
  const [showStatusError, setShowStatusError] = useState(false);

  // เพิ่ม state สำหรับ force render เมื่อเปลี่ยนภาษา
  const [langVersion, setLangVersion] = useState(0);

  // --- สร้างรายการปี (ย้อนหลัง 3 ปี) ---
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear-1, currentYear-2];

  // --- กรอง leaveHistory ตาม filter ---
  // ลบ useMemo เดิมออก ไม่ต้อง filter ฝั่ง frontend แล้ว

  // --- Move fetch leave history logic to a function ---
  const fetchLeaveHistory = () => {
    if (!id) return;
    let params = [];
    if (filterType && filterType !== "all") params.push(`leaveType=${encodeURIComponent(filterType)}`);
    if (filterMonth && filterMonth !== "all" && filterYear && filterYear !== "all") {
      params.push(`month=${filterMonth}`);
      params.push(`year=${filterYear}`);
    } else if (filterYear && filterYear !== "all") {
      params.push(`year=${filterYear}`);
    }
    if (filterStatus && filterStatus !== "all") params.push(`status=${filterStatus}`);
    if (filterBackdated && filterBackdated !== "all") params.push(`backdated=${filterBackdated}`); // เพิ่ม backdated เข้า params
    params.push(`page=${leavePage}`);
    params.push(`limit=6`);
    const query = params.length > 0 ? `?${params.join("&")}` : "";
    fetch(`${API_BASE_URL}/api/employee/${id}/leave-history${query}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLeaveHistory(data.data);
          setLeaveTotalPages(data.totalPages || 1);
          setLeaveSummary(data.summary || null); // <--- เก็บ summary
        } else {
          setLeaveHistory([]);
          setLeaveTotalPages(1);
          setLeaveSummary(null); // <--- reset summary
        }
      })
      .catch(() => {
        setLeaveHistory([]);
        setLeaveTotalPages(1);
        setLeaveSummary(null); // <--- reset summary
      });
  };

  // useEffect สำหรับ fetch leaveHistory เฉพาะเมื่อ filter จริง (active) เปลี่ยน
  useEffect(() => {
    fetchLeaveHistory();
    // eslint-disable-next-line
  }, [id, t, filterType, filterMonth, filterYear, filterStatus, filterBackdated, leavePage]);

  // ลบ filteredLeaveHistory ออก

  const resetFilters = () => {
    setPendingFilterType("all");
    setPendingFilterMonth("all");
    setPendingFilterYear("all");
    setPendingFilterStatus("all");
    setPendingFilterBackdated("all"); // reset backdated
    setShowTypeError(false);
    setShowMonthError(false);
    setShowYearError(false);
    setShowStatusError(false);
    setFilterError("");
    setFilterType("all");
    setFilterMonth("all");
    setFilterYear("all");
    setFilterStatus("all");
    setFilterBackdated("all"); // reset backdated
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/departments`)
      .then(res => {
        if (res.status === 401) {
          showSessionExpiredDialog();
          return Promise.reject(new Error('Session expired'));
        }
        return res.json();
      })
      .then(data => {
        setDepartments(Array.isArray(data.data) ? data.data : []);
      })
      .catch(() => setDepartments([]));

    fetch(`${API_BASE_URL}/api/positions`)
      .then(res => {
        if (res.status === 401) {
          showSessionExpiredDialog();
          return Promise.reject(new Error('Session expired'));
        }
        return res.json();
      })
      .then(data => {
        setPositions(Array.isArray(data.data) ? data.data : []);
      })
      .catch(() => setPositions([]));
  }, []);

  // --- เพิ่ม state สำหรับ leave types dropdown ---
  const [leaveTypes, setLeaveTypes] = useState<{ id: string; leave_type: string; leave_type_th: string; leave_type_en: string }[]>([]);
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(false);
  const [leaveTypesError, setLeaveTypesError] = useState<string | null>(null);

  // Fetch leave types from backend
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      setLeaveTypesLoading(true);
      setLeaveTypesError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/leave-types`);
        const data = await res.json();
        if (data.success) {
          setLeaveTypes(data.data);
        } else {
          setLeaveTypes([]);
          setLeaveTypesError(data.message || 'Failed to fetch leave types');
        }
      } catch (err: any) {
        setLeaveTypes([]);
        setLeaveTypesError(err.message || 'Failed to fetch leave types');
      } finally {
        setLeaveTypesLoading(false);
      }
    };
    fetchLeaveTypes();
  }, []);

  // useEffect สำหรับเปลี่ยนภาษาแล้ว force render dropdown label
  useEffect(() => {
    setLangVersion(v => v + 1);
  }, [i18n.language]);

  // อ่าน role จาก query string
  const queryParams = new URLSearchParams(location.search);
  const role = queryParams.get("role");

  const handleEdit = () => {
    // Prevent admin from editing superadmin
    if (user?.role === 'admin' && (employee?.role === 'superadmin' || role === 'superadmin')) {
      toast({
        title: t('error.title'),
        description: t('employee.adminCannotEditSuperadmin', 'Admins cannot edit superadmin information.'),
        variant: 'destructive',
      });
      return;
    }
    setEditData({
      full_name: employee?.name || '',
      email: employee?.email || '',
      password: '', // Always blank when editing
      department: (employee?.department_id || employee?.department?.id || '') + '',
      position: (employee?.position_id || employee?.position?.id || '') + '',
      role: employee?.role || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        name: editData.full_name,
        position_id: editData.position, // id
        department_id: editData.department, // id
        email: editData.email,
      };
      if (editData.password && editData.password.trim() !== '') payload.password = editData.password;
      const response = await fetch(`${API_BASE_URL}/api/employee/${id}` , {
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
        const res = await fetch(`${API_BASE_URL}/api/employee/${id}`);
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

  // เพิ่มฟังก์ชันนี้ด้านบน component
  const getLeaveTypeLabel = (typeId: string) => {
    const found = leaveTypes.find(lt => lt.id === typeId || lt.leave_type === typeId);
    if (!found) return typeId;
    return i18n.language.startsWith('th') ? found.leave_type_th : found.leave_type_en;
  };

  const [deleteLeaveId, setDeleteLeaveId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // --- Add delete handler ---
  const handleDeleteLeave = async () => {
    if (!deleteLeaveId) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/leave-request/${deleteLeaveId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setDeleteLeaveId(null);
        toast({
          title: t('system.deleteSuccess', 'ลบสำเร็จ'),
          description: t('system.deleteSuccessDesc', 'ลบใบลาสำเร็จ'),
          className: 'border-green-500 bg-green-50 text-green-900',
        });
        fetchLeaveHistory(); // fetch leave history again
      } else {
        alert(data.message || t("system.deleteFailed", "Delete failed"));
      }
    } catch (e) {
      alert(t("system.deleteFailed", "Delete failed"));
    } finally {
      setDeleting(false);
    }
  };

  // เพิ่ม useEffect สำหรับ fetch employee
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/api/employee/${id}`)
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
                        placeholder={t('employee.fullName')}
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
                            .filter(pos => (pos.position_name_th || pos.position_name_en) && (pos.position_name_th?.trim() !== '' || pos.position_name_en?.trim() !== ''))
                            .map((pos) => (
                              <SelectItem key={pos.id} value={pos.id}>
                                {i18n.language.startsWith('th') ? pos.position_name_th : pos.position_name_en}
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
                            .filter(dept => (dept.department_name_th || dept.department_name_en) && (dept.department_name_th?.trim() !== '' || dept.department_name_en?.trim() !== ''))
                            .map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {i18n.language.startsWith('th') ? dept.department_name_th : dept.department_name_en}
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
                        placeholder={t('employee.email')}
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
            {leaveTotalPages > 1 && leaveHistory.length > 0 && (
              <div className="flex justify-center mt-4 gap-1">
                {Array.from({ length: leaveTotalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setLeavePage(i + 1)}
                    className={`px-2 py-1 rounded border text-sm ${leavePage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-300'} transition`}
                    disabled={leavePage === i + 1}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
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
}

export default EmployeeDetail;