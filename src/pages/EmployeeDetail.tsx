import { LeaveDetailDialog } from "@/components/dialogs/LeaveDetailDialog";
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
} from "@/components/ui/alert-dialog";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { ArrowLeft, Calendar, Edit, Eye, Mail, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useParams } from 'react-router-dom';

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
  const [leaveSummary, setLeaveSummary] = useState<{ days: number, hours: number, totalLeaveDays: number } | null>(null); // <--- เพิ่ม state
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
    
    // เพิ่ม debug log
    console.log('🔍 Fetching leave history with params:', params);
    console.log('🔍 filterBackdated value:', filterBackdated);
    console.log('🔍 Full URL:', `${API_BASE_URL}/api/employee/${id}/leave-history${query}`);
    
    fetch(`${API_BASE_URL}/api/employee/${id}/leave-history${query}`)
      .then(res => res.json())
      .then(data => {
        // เพิ่ม debug log
        console.log('📥 Response from backend:', data);
        console.log('📥 leaveHistory data length:', data.data?.length);
        console.log('📥 Each leave backdated value:', data.data?.map(l => ({ id: l.id, backdated: l.backdated, leaveType: l.leaveType })));
        
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
      .catch((error) => {
        console.error('❌ Error fetching leave history:', error);
        setLeaveHistory([]);
        setLeaveTotalPages(1);
        setLeaveSummary(null); // <--- reset summary
      });
  };

  // useEffect สำหรับ fetch leaveHistory เฉพาะเมื่อ filter จริง (active) เปลี่ยน
  useEffect(() => {
    // เพิ่ม debug log
    console.log('🔄 useEffect triggered');
    console.log('🔄 filterBackdated:', filterBackdated);
    console.log('🔄 filterType:', filterType);
    console.log('🔄 filterStatus:', filterStatus);
    
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

  // ฟังก์ชันตรวจสอบว่าลาย้อนหลังหรือไม่
  const isBackdatedLeave = (leave) => {
    // ใช้ค่า backdated จาก backend แทนการคำนวณจากวันที่
    return Number(leave.backdated) === 1;
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

  // ฟังก์ชันช่วยแสดงชื่อแผนก/ตำแหน่งตามภาษา
  const getPositionLabel = (positionIdOrName: string) => {
    if (!positionIdOrName || positionIdOrName === "not_specified") {
      return t("positions.noPosition");
    }
    const found = positions.find(
      (pos) => pos.id === positionIdOrName || pos.position_name === positionIdOrName
    );
    if (!found) return t("positions.noPosition");
    return i18n.language.startsWith("th")
      ? found.position_name_th || found.position_name
      : found.position_name_en || found.position_name;
  };

  const getDepartmentLabel = (departmentIdOrName: string) => {
    if (!departmentIdOrName || departmentIdOrName === "not_specified") {
      return t("departments.noDepartment");
    }
    const found = departments.find(
      (dept) => dept.id === departmentIdOrName || dept.department_name === departmentIdOrName
    );
    if (!found) return t("departments.noDepartment");
    return i18n.language.startsWith("th")
      ? found.department_name_th || found.department_name
      : found.department_name_en || found.department_name;
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
        <div className="max-w-6xl mx-auto space-y-6">
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
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* ซ้าย: Full Name, Position, Department */}
                  <div className="space-y-8">
                    {/* Full Name */}
                    <div>
                      <Label className="text-sm font-medium text-blue-700">{t('employee.fullName')}</Label>
                      {isEditing ? (
                        <input
                          className="mt-1 px-3 py-2 border rounded w-full"
                          value={editData.full_name}
                          onChange={e => setEditData({ ...editData, full_name: e.target.value })}
                          placeholder={t('employee.fullName')}
                        />
                      ) : (
                        <p className="text-xl font-bold text-blue-900 mt-1">{employee.name}</p>
                      )}
                    </div>
                    {/* Position */}
                    <div>
                      <Label className="text-sm font-medium text-blue-700">{t('employee.position')}</Label>
                      {isEditing ? (
                        <select
                          className="mt-1 px-3 py-2 border rounded w-full"
                          value={editData.position}
                          onChange={e => setEditData({ ...editData, position: e.target.value })}
                        >
                          <option value="not_specified">{t('positions.noPosition')}</option>
                          {positions.map(pos => (
                            <option key={pos.id} value={pos.id}>
                              {i18n.language.startsWith('th') ? pos.position_name_th : pos.position_name_en}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-lg text-blue-700 mt-1">{getPositionLabel(employee.position_id || employee.position)}</p>
                      )}
                    </div>
                    {/* Department */}
                    <div>
                      <Label className="text-sm font-medium text-blue-700">{t('employee.department')}</Label>
                      {isEditing ? (
                        <select
                          className="mt-1 px-3 py-2 border rounded w-full"
                          value={editData.department}
                          onChange={e => setEditData({ ...editData, department: e.target.value })}
                        >
                          <option value="not_specified">{t('departments.noDepartment')}</option>
                          {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>
                              {i18n.language.startsWith('th') ? dept.department_name_th : dept.department_name_en}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-lg text-blue-700 mt-1">{getDepartmentLabel(employee.department_id || employee.department)}</p>
                      )}
                    </div>
                  </div>
                  {/* ขวา: Email, Password, Edit/Save/Cancel */}
                  <div className="space-y-8">
                    {/* Email */}
                    <div>
                      <Label className="text-sm font-medium text-blue-700">{t('employee.email')}</Label>
                      {isEditing ? (
                        <input
                          className="mt-1 px-3 py-2 border rounded w-full"
                          type="email"
                          value={editData.email}
                          onChange={e => setEditData({ ...editData, email: e.target.value })}
                          placeholder={t('employee.email')}
                        />
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-5 h-5 text-blue-400" />
                          <p className="text-lg text-blue-700">{employee.email}</p>
                        </div>
                      )}
                    </div>
                    {/* Password */}
                    <div>
                      <Label className="text-sm font-medium text-blue-700">{t('employee.password') || 'Password'}</Label>
                      {isEditing ? (
                        <input
                          className="mt-1 px-3 py-2 border rounded w-full"
                          type="password"
                          value={editData.password}
                          onChange={e => setEditData({ ...editData, password: e.target.value })}
                          placeholder={t('employee.password') || 'Password'}
                        />
                      ) : (
                        <p className="text-lg text-blue-700 mt-1">********</p>
                      )}
                    </div>
                    {/* Edit/Save/Cancel Button */}
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-full px-4 py-2 font-bold shadow">
                            {t('common.save')}
                          </Button>
                          <Button onClick={handleCancel} size="sm" variant="outline" className="rounded-full px-4 py-2 font-bold border-blue-200 text-blue-700 hover:bg-blue-50 shadow">
                            {t('common.cancel')}
                          </Button>
                        </>
                      ) : (
                        <Button onClick={handleEdit} size="sm" variant="outline" className="rounded-full px-4 py-2 font-bold border-blue-200 text-blue-700 hover:bg-blue-50 shadow">
                          <Edit className="w-4 h-4 mr-1" />{t('common.edit')}
                        </Button>
                      )}
                    </div>
                  </div>
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
            {leaveSummary && (
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <div className="flex justify-end items-center gap-3">
                  <Calendar className="w-6 h-6 text-gray-600" />
                  <span className="text-base font-semibold text-gray-800">
                    {t('leave.usedLeaveDays', 'จำนวนวันลาที่ใช้ไป')}: {leaveSummary.days || 0} {t('leave.days', 'วัน')} {leaveSummary.hours || 0} {t('leave.hours', 'ชั่วโมง')}
                  </span>
                </div>
              </div>
            )}
            <CardContent className="p-0">
              {/* Filter Section */}
              <div className="bg-white border-b border-gray-200 p-3">
                <div className="grid grid-cols-8 gap-2 items-end">
                  {/* Leave Type Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('leave.type')}
                    </label>
                    <select
                      className="w-full py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={pendingFilterType}
                      onChange={(e) => setPendingFilterType(e.target.value)}
                    >
                      <option value="all">{t('common.all')}</option>
                      {leaveTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {i18n.language.startsWith('th') ? type.leave_type_th : type.leave_type_en}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Month Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('common.month')}
                    </label>
                    <select
                      className="w-full py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={pendingFilterMonth}
                      onChange={(e) => setPendingFilterMonth(e.target.value)}
                    >
                      <option value="all">{t('common.all')}</option>
                      <option value="1">{t('common.january')}</option>
                      <option value="2">{t('common.february')}</option>
                      <option value="3">{t('common.march')}</option>
                      <option value="4">{t('common.april')}</option>
                      <option value="5">{t('common.may')}</option>
                      <option value="6">{t('common.june')}</option>
                      <option value="7">{t('common.july')}</option>
                      <option value="8">{t('common.august')}</option>
                      <option value="9">{t('common.september')}</option>
                      <option value="10">{t('common.october')}</option>
                      <option value="11">{t('common.november')}</option>
                      <option value="12">{t('common.december')}</option>
                    </select>
                  </div>

                  {/* Year Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('common.year')}
                    </label>
                    <select
                      className="w-full py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={pendingFilterYear}
                      onChange={(e) => setPendingFilterYear(e.target.value)}
                    >
                      <option value="all">{t('common.all')}</option>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('common.status')}
                    </label>
                    <select
                      className="w-full py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={pendingFilterStatus}
                      onChange={(e) => setPendingFilterStatus(e.target.value)}
                    >
                      <option value="all">{t('common.all')}</option>
                      <option value="pending">{t('leave.pending')}</option>
                      <option value="approved">{t('leave.approved')}</option>
                      <option value="rejected">{t('leave.rejected')}</option>
                    </select>
                  </div>

                  {/* Backdated Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t('leave.backdatedOnly', 'เฉพาะย้อนหลัง')}
                    </label>
                    <select
                      className="w-full py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={pendingFilterBackdated}
                      onChange={(e) => setPendingFilterBackdated(e.target.value)}
                    >
                      <option value="all">{t('common.all')}</option>
                      <option value="1">{t('leave.backdated', 'ลาย้อนหลัง')}</option>
                      <option value="0">{t('leave.notBackdated', 'ไม่ใช่ลาย้อนหลัง')}</option>
                    </select>
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex gap-3 items-end h-full shrink-0">
                    <button
                      className="min-h-[42px] min-w-[100px] px-5 py-2.5 rounded-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-lg hover:from-blue-700 hover:to-indigo-600 hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm"
                      onClick={() => {
                        // เพิ่ม debug log
                        console.log('🔘 Confirm button clicked');
                        console.log('🔘 pendingFilterBackdated:', pendingFilterBackdated);
                        console.log('🔘 pendingFilterType:', pendingFilterType);
                        console.log('🔘 pendingFilterStatus:', pendingFilterStatus);
                        
                        setFilterType(pendingFilterType);
                        setFilterMonth(pendingFilterMonth);
                        setFilterYear(pendingFilterYear);
                        setFilterStatus(pendingFilterStatus);
                        setFilterBackdated(String(pendingFilterBackdated)); // บังคับเป็น string เสมอ
                        setLeavePage(1);
                      }}
                      type="button"
                    >
                      {t('common.confirm', 'ยืนยัน')}
                    </button>
                    <button
                      className="min-h-[42px] min-w-[100px] px-5 py-2.5 rounded-lg font-bold border border-blue-300 text-blue-700 bg-white hover:bg-blue-50 shadow transition-all duration-200 text-sm"
                      onClick={resetFilters}
                      type="button"
                    >
                      {t('common.reset', 'รีเซ็ต')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3">
                <Table className="w-full">
                  <TableHeader className="bg-gray-50">
                    <TableRow className="border-b border-gray-200">
                      <TableHead className="w-[15%] font-semibold text-gray-700 whitespace-nowrap px-4">{t('leave.type')}</TableHead>
                      <TableHead className="w-[18%] font-semibold text-gray-700 whitespace-nowrap px-4">{t('leave.date')}</TableHead>
                      <TableHead className="w-[12%] font-semibold text-gray-700 whitespace-nowrap px-4">{t('leave.duration') || 'จำนวนวัน'}</TableHead>
                      <TableHead className="w-[22%] font-semibold text-gray-700 whitespace-nowrap px-4">{t('leave.reason')}</TableHead>
                      <TableHead className="w-[12%] font-semibold text-gray-700 whitespace-nowrap px-4">{t('leave.status')}</TableHead>
                      <TableHead className="w-[12%] font-semibold text-gray-700 whitespace-nowrap px-4">{t('leave.submittedDate')}</TableHead>
                      <TableHead className="w-[9%] text-center font-semibold text-gray-700 whitespace-nowrap px-4">{t('common.actions') || 'การจัดการ'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveHistory.map((leave, idx) => {
                      // เพิ่ม debug log
                      console.log(`🎨 Rendering leave ${idx}:`, { id: leave.id, backdated: leave.backdated, leaveType: leave.leaveType });
                      
                      return (
                        <TableRow key={leave.id} className="hover:bg-blue-50/60 group animate-fade-in-up border-b border-gray-100" style={{ animationDelay: `${idx * 60}ms` }}>
                          <TableCell className="font-medium text-blue-900 px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm whitespace-nowrap">{getLeaveTypeLabel(leave.leaveType)}</span>
                              {isBackdatedLeave(leave) && (
                                <Badge className="bg-red-100 text-red-700 border-red-200 text-xs px-1.5 py-0.5 w-fit whitespace-nowrap">
                                  {t('leave.backdated', 'ลาย้อนหลัง')}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-blue-700 px-4 py-3">
                          {(() => {
                            if (leave.startDate && leave.endDate) {
                              const start = new Date(leave.startDate);
                              const end = new Date(leave.endDate);
                              const isSameDay = start.toDateString() === end.toDateString();
                              const locale = i18n.language.startsWith('th') ? th : undefined;
                              if (isSameDay) {
                                  return <span className="font-medium text-sm whitespace-nowrap">{format(start, 'dd MMM yyyy', { locale })}</span>;
                              } else {
                                  return (
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-medium text-sm">{format(start, 'dd MMM', { locale })} -</span>
                                      <span className="font-medium text-sm">{format(end, 'dd MMM yyyy', { locale })}</span>
                                    </div>
                                  );
                              }
                            } else if (leave.startDate) {
                              const start = new Date(leave.startDate);
                              const locale = i18n.language.startsWith('th') ? th : undefined;
                                return <span className="font-medium text-sm whitespace-nowrap">{format(start, 'dd MMM yyyy', { locale })}</span>;
                            } else {
                                return <span className="text-gray-400">-</span>;
                            }
                          })()}
                        </TableCell>
                          <TableCell className="text-blue-700 px-4 py-3">
                          {(() => {
                            if (leave.durationType === 'day') {
                              const days = Math.floor(Number(leave.duration));
                              const hours = Math.round((Number(leave.duration) - days) * 24);
                              if (days > 0 && hours > 0) {
                                  return <span className="font-medium text-sm whitespace-nowrap">{days} {t(days === 1 ? 'leave.day' : 'leave.days')} {hours} {t(hours === 1 ? 'leave.hour' : 'leave.hours')}</span>;
                              } else if (days > 0) {
                                  return <span className="font-medium text-sm whitespace-nowrap">{days} {t(days === 1 ? 'leave.day' : 'leave.days')}</span>;
                              } else if (hours > 0) {
                                  return <span className="font-medium text-sm whitespace-nowrap">{hours} {t(hours === 1 ? 'leave.hour' : 'leave.hours')}</span>;
                              } else {
                                  return <span className="text-gray-400">-</span>;
                              }
                            } else if (leave.durationType === 'hour') {
                                // ใช้ durationHours แทน duration เมื่อเป็นชั่วโมง
                                const hours = Number(leave.durationHours || leave.duration);
                                if (hours > 0) {
                                    return <span className="font-medium text-sm whitespace-nowrap">{hours} {t(hours === 1 ? 'leave.hour' : 'leave.hours')}</span>;
                                } else {
                                    return <span className="text-gray-400">-</span>;
                                }
                            } else {
                                return <span className="text-gray-400">-</span>;
                            }
                          })()}
                        </TableCell>
                          <TableCell className="text-blue-700 px-4 py-3">
                            <div className="pr-2">
                              <div className="break-words text-sm leading-relaxed" title={leave.reason}>
                                {leave.reason || <span className="text-gray-400">-</span>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                          <Badge className={
                              leave.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200 text-xs px-2 py-0.5 whitespace-nowrap' :
                              leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 text-xs px-2 py-0.5 whitespace-nowrap' :
                              'bg-red-100 text-red-700 border-red-200 text-xs px-2 py-0.5 whitespace-nowrap'
                          }>
                            {leave.status === 'approved' ? t('leave.approved') : leave.status === 'pending' ? t('leave.pending') : t('leave.rejected')}
                          </Badge>
                        </TableCell>
                          <TableCell className="text-blue-700 px-4 py-3">
                            {leave.submittedDate ? (
                              <span className="font-medium text-sm whitespace-nowrap">{format(new Date(leave.submittedDate), "dd MMM yyyy", { locale: th })}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                        </TableCell>
                          <TableCell className="text-center px-4 py-3">
                            <div className="flex justify-center gap-1.5">
                          <Button
                            size="sm"
                                variant="secondary"
                                className="rounded-lg px-3 py-1.5 font-medium bg-gradient-to-r from-blue-500 to-indigo-400 text-white shadow hover:scale-105 transition text-xs"
                            onClick={() => handleViewLeaveDetails(leave)}
                          >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                {t('common.viewDetails')}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="rounded-lg px-3 py-1.5 font-medium bg-gradient-to-r from-red-500 to-red-600 text-white shadow hover:scale-105 transition text-xs"
                                onClick={() => setDeleteLeaveId(leave.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                {t('common.delete')}
                          </Button>
                            </div>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                      {leaveHistory.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                            <div className="flex flex-col items-center gap-2">
                              <Calendar className="w-6 h-6 text-gray-300" />
                              <span className="text-sm">{t('leave.noHistory', 'ไม่มีประวัติการลา')}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            {leaveTotalPages > 1 && leaveHistory.length > 0 && (
                <div className="flex justify-center items-center mt-4 gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600 mr-2">
                    {t('common.page', 'หน้า')} {leavePage} {t('common.of', 'จาก')} {leaveTotalPages}
                  </span>
                  <div className="flex gap-1">
                {Array.from({ length: leaveTotalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setLeavePage(i + 1)}
                        className={`px-2.5 py-1 rounded-md border text-sm font-medium transition-all duration-200 ${
                          leavePage === i + 1 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                            : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400'
                        }`}
                    disabled={leavePage === i + 1}
                  >
                    {i + 1}
                  </button>
                ))}
                  </div>
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
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteLeaveId} onOpenChange={() => setDeleteLeaveId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('common.confirmDelete', 'ยืนยันการลบ')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('leave.deleteConfirmMessage', 'คุณต้องการลบใบลานี้หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteLeave}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? t('common.deleting', 'กำลังลบ...') : t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

export default EmployeeDetail;