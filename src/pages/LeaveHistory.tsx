import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const LeaveHistory = () => {
  const { t } = useTranslation();

  const leaveHistory = [
    {
      id: 1,
      type: t('leaveTypes.vacation'),
      startDate: new Date(2024, 11, 20),
      endDate: new Date(2024, 11, 22),
      days: 3,
      reason: "พักผ่อนกับครอบครัว",
      status: "approved",
      approvedBy: "คุณสมศรี ผู้จัดการ",
      submittedDate: new Date(2024, 11, 15),
    },
    {
      id: 2,
      type: t('leaveTypes.sick'),
      startDate: new Date(2024, 10, 5),
      endDate: new Date(2024, 10, 6),
      days: 2,
      reason: "ไข้หวัดใหญ่",
      status: "approved",
      approvedBy: "คุณสมศรี ผู้จัดการ",
      submittedDate: new Date(2024, 10, 4),
    },
    {
      id: 3,
      type: t('leaveTypes.personal'),
      startDate: new Date(2024, 9, 15),
      endDate: new Date(2024, 9, 15),
      days: 1,
      reason: "ติดต่อราชการ",
      status: "pending",
      submittedDate: new Date(2024, 9, 12),
    },
    {
      id: 4,
      type: t('leaveTypes.vacation'),
      startDate: new Date(2024, 8, 1),
      endDate: new Date(2024, 8, 5),
      days: 5,
      reason: "เดินทางท่องเที่ยว",
      status: "rejected",
      rejectedBy: "คุณสมศรี ผู้จัดการ",
      rejectionReason: "ช่วงเวลาดังกล่าวมีงานเร่งด่วน",
      submittedDate: new Date(2024, 7, 25),
    },
  ];

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
    if (type === t('leaveTypes.vacation')) return "text-blue-600";
    if (type === t('leaveTypes.sick')) return "text-red-600";
    if (type === t('leaveTypes.personal')) return "text-green-600";
    return "text-gray-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="border-b bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex h-20 items-center px-8 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-blue-800 tracking-tight">{t('leave.leaveHistory')}</h1>
            <p className="text-base text-gray-500 font-light mt-1">{t('history.leaveHistoryTitle')}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="p-6 animate-fade-in">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur rounded-2xl">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center shadow">
                  <Calendar className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-blue-800">11</p>
                  <p className="text-base text-blue-400">{t('history.totalLeaveDays')}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur rounded-2xl">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center shadow">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-green-700">3</p>
                  <p className="text-base text-green-400">{t('history.approvedRequests')}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur rounded-2xl">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center shadow">
                  <Clock className="w-7 h-7 text-yellow-600" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-yellow-700">1</p>
                  <p className="text-base text-yellow-400">{t('history.pendingRequests')}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leave History List */}
          <div className="space-y-6">
            {leaveHistory.map((leave) => (
              <Card key={leave.id} className="border-0 shadow-xl bg-white/80 backdrop-blur rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all">
                <CardHeader className="pb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="flex items-center gap-4">
                    <div className={`text-xl font-bold ${getTypeColor(leave.type)}`}>{leave.type}</div>
                    {getStatusBadge(leave.status)}
                  </div>
                  <div className="text-sm text-blue-400 font-medium md:text-right">
                    {format(leave.submittedDate, 'dd MMM yyyy', { locale: th })}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-base text-blue-900">
                        <Calendar className="w-5 h-5 text-blue-400" />
                        <span className="font-medium">{t('leave.startDate')}:</span>
                        <span>{format(leave.startDate, 'dd MMM yyyy', { locale: th })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-base text-blue-900">
                        <Calendar className="w-5 h-5 text-blue-400" />
                        <span className="font-medium">{t('leave.endDate')}:</span>
                        <span>{format(leave.endDate, 'dd MMM yyyy', { locale: th })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-base text-blue-900">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <span className="font-medium">{t('leave.duration')}:</span>
                        <span>{leave.days} {t('leave.days')}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 text-base text-blue-900">
                        <FileText className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                          <span className="font-medium">{t('leave.reason')}:</span>
                          <p className="text-blue-500">{leave.reason}</p>
                        </div>
                      </div>
                      {leave.status === "approved" && leave.approvedBy && (
                        <div className="flex items-center gap-2 text-base text-green-700">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="font-medium">{t('leave.approvedBy')}:</span>
                          <span>{leave.approvedBy}</span>
                        </div>
                      )}
                      {leave.status === "rejected" && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-base text-red-700">
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="font-medium">{t('leave.rejectedBy')}:</span>
                            <span>{leave.rejectedBy}</span>
                          </div>
                          {leave.rejectionReason && (
                            <div className="flex items-start gap-2 text-base text-red-700">
                              <FileText className="w-5 h-5 text-red-400 mt-0.5" />
                              <div>
                                <span className="font-medium">{t('leave.rejectionReason')}:</span>
                                <p className="text-red-500">{leave.rejectionReason}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .glass-card-history {
          background: rgba(255,255,255,0.8);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.10);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 2rem;
          border: 1px solid rgba(255,255,255,0.18);
        }
      `}</style>
    </div>
  );
};

export default LeaveHistory;
