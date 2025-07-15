import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useEffect, useState } from "react";

const LeaveHistory = () => {
  const { t, i18n } = useTranslation();
  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // --- เพิ่ม state สำหรับ paging ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // --- เพิ่ม state สำหรับ summary ---
  const [summary, setSummary] = useState<{ totalLeaveDays: number; approvedCount: number; pendingCount: number } | null>(null);
  // --- เพิ่ม state สำหรับ show more/less ---
  const [expandedReason, setExpandedReason] = useState<string | null>(null);
  const [expandedReject, setExpandedReject] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaveHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found, please login');
        // --- ส่ง page, limit ไป backend ---
        const res = await fetch(`/api/leave-history?page=${page}&limit=6`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === "success") {
          setLeaveHistory(data.data);
          setTotalPages(data.totalPages || 1);
          setSummary(data.summary || null); // <-- set summary
        } else {
          setError(data.message || "Unknown error");
        }
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaveHistory();
  }, [page]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t('leave.approved')}
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            {t('history.pendingApproval')}
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            {t('leave.rejected')}
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    const tVacation = t('leaveTypes.vacation');
    const tSick = t('leaveTypes.sick');
    const tPersonal = t('leaveTypes.personal');
    const tEmergency = t('leaveTypes.emergency');
    const typeLower = (type || '').toLowerCase();
    if (type === tVacation || typeLower === 'vacation' || typeLower === 'ลาพักผ่อน') return "text-blue-600";
    if (type === tSick || typeLower === 'sick' || typeLower === 'ลาป่วย') return "text-red-600";
    if (type === tPersonal || typeLower === 'personal' || typeLower === 'ลากิจ') return "text-green-600";
    if (type === tEmergency || typeLower === 'emergency' || typeLower === 'ลาฉุกเฉิน') return "text-orange-500";
    return "text-gray-600";
  };

  // ฟังก์ชันแปลประเภทการลาให้ตรงกับภาษาที่เลือก
  const translateLeaveType = (type: string) => {
    const typeLower = (type || '').toLowerCase();
    // mapping: key = lower-case, value = i18n key
    const typeMap: Record<string, string> = {
      'vacation': 'leaveTypes.vacation',
      'ลาพักผ่อน': 'leaveTypes.vacation',
      'sick': 'leaveTypes.sick',
      'ลาป่วย': 'leaveTypes.sick',
      'personal': 'leaveTypes.personal',
      'ลากิจ': 'leaveTypes.personal',
      'emergency': 'leaveTypes.emergency',
      'ลาฉุกเฉิน': 'leaveTypes.emergency',
      'maternity': 'leaveTypes.maternity',
      'ลาคลอด': 'leaveTypes.maternity',
    };
    const i18nKey = typeMap[typeLower];
    if (i18nKey) return t(i18nKey);
    // fallback: try t(`leaveTypes.${typeLower}`) or raw type
    return t(`leaveTypes.${typeLower}`, type);
  };

  // ฟังก์ชันคำนวณชั่วโมงจากเวลาเริ่มและเวลาสิ้นสุด (string HH:mm)
  const calcHours = (start: string, end: string) => {
    if (!start || !end) return null;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    let diff = endMins - startMins;
    if (diff < 0) diff += 24 * 60; // ข้ามวัน
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    // แสดงเป็น ชั่วโมง.นาที (1.20)
    return `${hours}.${mins.toString().padStart(2, '0')}`;
  };
  // กำหนดหน่วยชั่วโมงตามภาษา
  const hourUnit = i18n.language === 'th' ? 'ชม' : 'Hours';

  // เพิ่มฟังก์ชันแปลงวันที่ตามภาษา
  const formatDateLocalized = (dateStr: string) => {
    const date = new Date(dateStr);
    if (i18n.language === 'th') {
      // แปลงปีเป็น พ.ศ.
      const buddhistYear = date.getFullYear() + 543;
      return `${date.getDate().toString().padStart(2, '0')} ${format(date, 'MMM', { locale: th })} ${buddhistYear}`;
    }
    // อังกฤษ: ใช้ year ปกติ
    return format(date, 'dd MMM yyyy');
  };

  // Calculate summary statistics from leaveHistory
  const totalLeaveDays = summary ? summary.totalLeaveDays : 0;
  const approvedCount = summary ? summary.approvedCount : 0;
  const pendingCount = summary ? summary.pendingCount : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{t('leave.leaveHistory')}</h1>
            <p className="text-sm text-gray-600">
              {t('history.leaveHistoryTitle')}
            </p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="p-6 animate-fade-in">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalLeaveDays}</p>
                    <p className="text-sm text-muted-foreground">{t('history.totalLeaveDays')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{approvedCount}</p>
                    <p className="text-sm text-muted-foreground">{t('history.approvedRequests')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pendingCount}</p>
                    <p className="text-sm text-muted-foreground">{t('history.pendingRequests')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leave History List */}
          <div className="space-y-4">
            {loading ? (
              <p>{t('history.loadingLeaveHistory')}</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <>
                {leaveHistory.map((leave) => (
                  <Card
                    key={leave.id}
                    className="border border-gray-200 rounded-xl shadow-md hover:shadow-xl hover:border-blue-400 transition-shadow bg-white/90 p-6 mb-4"
                  >
                    <CardHeader className="pb-3 border-b border-gray-100 mb-2 bg-white/0 rounded-t-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`text-lg font-bold ${getTypeColor(leave.type)}`}>{translateLeaveType(leave.type)}</div>
                          {getStatusBadge(leave.status)}
                        </div>
                        <div className="text-sm text-gray-400 font-medium">
                          {formatDateLocalized(leave.submittedDate)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {/* ฝั่งซ้าย: วันที่และระยะเวลา */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <span className="font-semibold">{t('leave.startDate')}:</span>
                            <span>{formatDateLocalized(leave.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <span className="font-semibold">{t('leave.endDate')}:</span>
                            <span>{formatDateLocalized(leave.endDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-yellow-500" />
                            <span className="font-semibold">{t('leave.duration')}:</span>
                            <span>
                              {leave.startTime && leave.endTime
                                ? `${leave.startTime} - ${leave.endTime} (${calcHours(leave.startTime, leave.endTime)} ${hourUnit})`
                                : `${leave.days} ${t('leave.day')}`}
                            </span>
                          </div>
                        </div>
                        {/* ฝั่งขวา: เหตุผล */}
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="font-semibold">{t('leave.reason')}:</span>
                            </div>
                            <p className={`text-gray-700 break-words mt-1 ${expandedReason === leave.id ? '' : 'line-clamp-2'}`}>
                              {leave.reason}
                            </p>
                            {leave.reason && leave.reason.length > 100 && (
                              <button
                                className="text-blue-500 ml-2 underline text-xs"
                                onClick={() => setExpandedReason(expandedReason === leave.id ? null : leave.id)}
                              >
                                {expandedReason === leave.id ? t('history.showLess') || 'Show less' : t('history.showMore') || 'Show more'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Approved by: และ Rejected by: แยกออกมาอยู่ล่างสุดของ Card */}
                      {leave.status === "approved" && leave.approvedBy && (
                        <div className="mt-6 border-t pt-4">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="font-semibold">{t('leave.approvedBy')}:</span>
                            <span>{leave.approvedBy}</span>
                          </div>
                        </div>
                      )}
                      {leave.status === "rejected" && leave.rejectedBy && (
                        <div className="mt-6 border-t pt-4">
                          <div className="flex items-center gap-2 text-sm">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="font-semibold">{t('leave.rejectedBy')}:</span>
                            <span>{leave.rejectedBy}</span>
                          </div>
                          {leave.rejectionReason && (
                            <div className="flex items-start gap-2 mt-2 text-sm">
                              <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                              <div>
                                <span className="font-semibold">{t('leave.rejectionReason')}:</span>
                                <p className={`text-gray-700 break-words mt-1 ${expandedReject === leave.id ? '' : 'line-clamp-2'}`}>
                                  {leave.rejectionReason}
                                </p>
                                {leave.rejectionReason.length > 100 && (
                                  <button
                                    className="text-blue-500 ml-2 underline text-xs"
                                    onClick={() => setExpandedReject(expandedReject === leave.id ? null : leave.id)}
                                  >
                                    {expandedReject === leave.id ? t('history.showLess') || 'Show less' : t('history.showMore') || 'Show more'}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {/* --- ปุ่มเปลี่ยนหน้า --- */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-6 gap-2">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`px-3 py-1 rounded border ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'} transition`}
                        disabled={page === i + 1}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveHistory;
