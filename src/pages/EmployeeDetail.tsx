import { LeaveDetailDialog } from "@/components/dialogs/LeaveDetailDialog";
import LanguageSwitcher from "@/components/LanguageSwitcher";
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
import { Link, useLocation, useParams } from "react-router-dom";

const EmployeeDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const { t, i18n } = useTranslation();
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
  const [departments, setDepartments] = useState<{ id: string; department_name: string }[]>([]);
  const [positions, setPositions] = useState<{ id: string; position_name: string }[]>([]);
  // --- เพิ่ม state สำหรับ paging ---
  const [leavePage, setLeavePage] = useState(1);
  const [leaveTotalPages, setLeaveTotalPages] = useState(1);

  // --- State สำหรับ Filter ---
  // state สำหรับค่าที่เลือกในฟิลเตอร์ (pending)
  const [pendingFilterType, setPendingFilterType] = useState("all");
  const [pendingFilterMonth, setPendingFilterMonth] = useState("all");
  const [pendingFilterYear, setPendingFilterYear] = useState("all");
  const [pendingFilterStatus, setPendingFilterStatus] = useState("all");
  // state สำหรับค่าฟิลเตอร์ที่ใช้งานจริง (active)
  const [filterType, setFilterType] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  // state สำหรับ error ของ filter
  const [filterError, setFilterError] = useState("");
  // state สำหรับแสดง * สีแดงแต่ละ filter
  const [showTypeError, setShowTypeError] = useState(false);
  const [showMonthError, setShowMonthError] = useState(false);
  const [showYearError, setShowYearError] = useState(false);
  const [showStatusError, setShowStatusError] = useState(false);

  // --- สร้างรายการปี (ย้อนหลัง 3 ปี) ---
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear-1, currentYear-2];

  // --- กรอง leaveHistory ตาม filter ---
  // ลบ useMemo เดิมออก ไม่ต้อง filter ฝั่ง frontend แล้ว

  // useEffect สำหรับ fetch leaveHistory เฉพาะเมื่อ filter จริง (active) เปลี่ยน
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

    // --- ดึง leave history ตาม filter (active) ---
    let params = [];
    if (filterType && filterType !== "all") params.push(`leaveType=${filterType}`);
    if (filterMonth && filterMonth !== "all" && filterYear && filterYear !== "all") {
      params.push(`month=${filterMonth}`);
      params.push(`year=${filterYear}`);
    } else if (filterYear && filterYear !== "all") {
      params.push(`year=${filterYear}`);
    }
    if (filterStatus && filterStatus !== "all") params.push(`status=${filterStatus}`);
    const query = params.length > 0 ? `?${params.join("&")}` : "";
    fetch(`http://localhost:3001/api/employee/${id}/leave-history${query}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLeaveHistory(data.data);
        } else {
          setLeaveHistory([]);
        }
      })
      .catch(() => {
        setLeaveHistory([]);
      });
  }, [id, t, filterType, filterMonth, filterYear, filterStatus, leavePage]);

  // filteredLeaveHistory = leaveHistory (ไม่ต้อง filter ฝั่ง frontend)
  const filteredLeaveHistory = leaveHistory;

  const resetFilters = () => {
    setPendingFilterType("all");
    setPendingFilterMonth("all");
    setPendingFilterYear("all");
    setPendingFilterStatus("all");
  };

  useEffect(() => {
    fetch('http://localhost:3001/api/departments')
      .then(res => res.json())
      .then(data => {
        setDepartments(Array.isArray(data.data) ? data.data : []);
      })
      .catch(() => setDepartments([]));

    fetch('http://localhost:3001/api/positions')
      .then(res => res.json())
      .then(data => {
        setPositions(Array.isArray(data.data) ? data.data : []);
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

    // Fetch leave history for this employee by id (paging)
    fetch(`http://localhost:3001/api/leave-request/user/${id}?page=${leavePage}&limit=6`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setLeaveHistory(data.data);
          setLeaveTotalPages(data.totalPages || 1);
        } else {
          setLeaveHistory([]);
          setLeaveTotalPages(1);
        }
      })
      .catch(() => {
        setLeaveHistory([]);
        setLeaveTotalPages(1);
      });
  }, [id, t, leavePage]);

  const handleEdit = () => {
    // หา id ของตำแหน่ง/แผนกจากชื่อที่ backend ส่งมา
    const positionId = positions.find(p => p.position_name === employee?.position)?.id || '';
    const departmentId = departments.find(d => d.department_name === employee?.department)?.id || '';
    setEditData({
      full_name: employee?.name || '',
      email: employee?.email || '',
      password: '', // Always blank when editing
      department: departmentId,
      position: positionId,
      role: employee?.role || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        name: editData.full_name,
        position: editData.position, // id
        department: editData.department, // id
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
        <div className="max-w-6xl mx-auto space-y-6">
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
                          {positions.map((pos) => (
                            <SelectItem key={pos.id} value={pos.id}>
                              {t(`positions.${pos.position_name}`, { defaultValue: pos.position_name })}
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
                          {departments.map((dep) => (
                            <SelectItem key={dep.id} value={dep.id}>
                              {t(`departments.${dep.department_name}`, { defaultValue: dep.department_name })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-600">{String(t(`departments.${employee.department}`, { defaultValue: employee.department }))}</p>
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
            {/* Filter + วันลาที่ใช้ไปแล้ว (flex row) */}
            <div className="flex flex-wrap items-center justify-between px-6 mt-4 gap-2">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex flex-col relative">
                  <Select value={pendingFilterType} onValueChange={v => { setPendingFilterType(v); setShowTypeError(false); }}>
                    <SelectTrigger className="w-40">{pendingFilterType && pendingFilterType !== "all" ? t(`leaveTypes.${pendingFilterType}`) : t('leave.type')}</SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('months.all')}</SelectItem>
                      <SelectItem value="sick">{t('leaveTypes.sick')}</SelectItem>
                      <SelectItem value="vacation">{t('leaveTypes.vacation')}</SelectItem>
                      <SelectItem value="personal">{t('leaveTypes.personal')}</SelectItem>
                    </SelectContent>
                  </Select>
                  {showTypeError && <span className="text-red-500 text-xs absolute right-2 top-0">*</span>}
                </div>
                <div className="flex flex-col relative">
                  <Select value={pendingFilterMonth} onValueChange={v => { setPendingFilterMonth(v); setShowMonthError(false); }}>
                    <SelectTrigger className="w-32">{pendingFilterMonth && pendingFilterMonth !== "all" ? t(`months.${pendingFilterMonth}`) : t('common.month')}</SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('months.all')}</SelectItem>
                      <SelectItem value="1">{t('months.1')}</SelectItem>
                      <SelectItem value="2">{t('months.2')}</SelectItem>
                      <SelectItem value="3">{t('months.3')}</SelectItem>
                      <SelectItem value="4">{t('months.4')}</SelectItem>
                      <SelectItem value="5">{t('months.5')}</SelectItem>
                      <SelectItem value="6">{t('months.6')}</SelectItem>
                      <SelectItem value="7">{t('months.7')}</SelectItem>
                      <SelectItem value="8">{t('months.8')}</SelectItem>
                      <SelectItem value="9">{t('months.9')}</SelectItem>
                      <SelectItem value="10">{t('months.10')}</SelectItem>
                      <SelectItem value="11">{t('months.11')}</SelectItem>
                      <SelectItem value="12">{t('months.12')}</SelectItem>
                    </SelectContent>
                  </Select>
                  {showMonthError && <span className="text-red-500 text-xs absolute right-2 top-0">*</span>}
                </div>
                <div className="flex flex-col relative">
                  <Select value={pendingFilterYear} onValueChange={v => { setPendingFilterYear(v); setShowYearError(false); }}>
                    <SelectTrigger className="w-28">{pendingFilterYear && pendingFilterYear !== "all" ?
                      i18n.language === 'th' ? (parseInt(pendingFilterYear) + 543) : pendingFilterYear
                    : t('common.year')}</SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('months.all')}</SelectItem>
                      {yearOptions.map(y => (
                        <SelectItem key={y} value={String(y)}>
                          {i18n.language === 'th' ? y + 543 : y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showYearError && <span className="text-red-500 text-xs absolute right-2 top-0">*</span>}
                </div>
                <div className="flex flex-col relative">
                  <Select value={pendingFilterStatus} onValueChange={v => { setPendingFilterStatus(v); setShowStatusError(false); }}>
                    <SelectTrigger className="w-36">{pendingFilterStatus && pendingFilterStatus !== "all" ? t(`leave.${pendingFilterStatus}`) : t('common.status')}</SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('months.all')}</SelectItem>
                      <SelectItem value="approved">{t('leave.approved')}</SelectItem>
                      <SelectItem value="pending">{t('leave.pending')}</SelectItem>
                      <SelectItem value="rejected">{t('leave.rejected')}</SelectItem>
                    </SelectContent>
                  </Select>
                  {showStatusError && <span className="text-red-500 text-xs absolute right-2 top-0">*</span>}
                </div>
                <Button variant="outline" onClick={resetFilters}>{t('common.reset') || 'รีเซ็ต'}</Button>
                <Button
                  onClick={() => {
                    let hasError = false;
                    if (pendingFilterType === "all") { setShowTypeError(true); hasError = true; }
                    if (pendingFilterMonth === "all") { setShowMonthError(true); hasError = true; }
                    if (pendingFilterYear === "all") { setShowYearError(true); hasError = true; }
                    if (pendingFilterStatus === "all") { setShowStatusError(true); hasError = true; }
                    if (pendingFilterMonth !== "all" && (pendingFilterYear === "all" || !pendingFilterYear)) {
                      setFilterError(t('leave.pleaseSelectYear') || "กรุณาเลือกปีให้ครบก่อนกดยืนยัน");
                      hasError = true;
                    }
                    if (hasError) return;
                    setFilterError("");
                    setFilterType(pendingFilterType);
                    setFilterMonth(pendingFilterMonth);
                    setFilterYear(pendingFilterYear);
                    setFilterStatus(pendingFilterStatus);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >{t('common.confirm') || 'ยืนยัน'}</Button>
              </div>
              {employee && typeof employee.usedLeaveDays === 'number' && (
                <div className="text-sm font-medium">
                  <span className={
                    employee.totalLeaveDays && employee.usedLeaveDays > employee.totalLeaveDays * 0.8
                      ? 'text-red-600'
                      : 'text-green-600'
                  }>
                    วันลาที่ใช้ไปแล้ว: {employee.usedLeaveDays} วัน
                  </span>
                </div>
              )}
            </div>
            {filterError && (
              <div className="text-red-600 text-sm px-6 mt-1">{filterError}</div>
            )}
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
                  {filteredLeaveHistory.map((leave, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{
                        leave.leaveTypeName
                          ? String(t(`leaveTypes.${leave.leaveTypeName}`, leave.leaveTypeName))
                          : leave.leaveType
                            ? String(t(`leaveTypes.${leave.leaveType}`, leave.leaveType))
                            : '-'
                      }</TableCell>
                      <TableCell className="whitespace-nowrap">{leave.leaveDate}</TableCell>
                      <TableCell>{leave.durationType === 'hour' ? parseInt(leave.duration) : leave.duration} {leave.durationType === 'hour' ? t('leave.durationHour') : leave.durationType === 'day' ? t('leave.durationDay') : ''}</TableCell>
                      <TableCell className="max-w-[100px] truncate">{leave.reason}</TableCell>
                      <TableCell>
                        <Badge
                          className={`rounded-full px-3 py-1 text-xs font-semibold
                            ${leave.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                            ${leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${leave.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                          `}
                        >
                          {leave.status === 'approved' ? t('leave.approved') : leave.status === 'pending' ? t('leave.pending') : leave.status === 'rejected' ? t('leave.rejected') : leave.status}
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
              {/* --- ปุ่มเปลี่ยนหน้า --- */}
              {leaveTotalPages > 1 && (
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
