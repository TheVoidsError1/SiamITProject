
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
<<<<<<< HEAD

const LeaveHistory = () => {
  const leaveHistory = [
    {
      id: '1',
      type: "ลาพักผ่อน",
=======
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const LeaveHistory = () => {
  const { t } = useTranslation();

  const leaveHistory = [
    {
      id: 1,
      type: t('leaveTypes.vacation'),
>>>>>>> origin/db_yod
      startDate: new Date(2024, 11, 20),
      endDate: new Date(2024, 11, 22),
      days: 3,
      reason: "พักผ่อนกับครอบครัว",
      status: "approved",
      approvedBy: "คุณสมศรี ผู้จัดการ",
      submittedDate: new Date(2024, 11, 15),
    },
    {
<<<<<<< HEAD
      id: '2',
      type: "ลาป่วย",
=======
      id: 2,
      type: t('leaveTypes.sick'),
>>>>>>> origin/db_yod
      startDate: new Date(2024, 10, 5),
      endDate: new Date(2024, 10, 6),
      days: 2,
      reason: "ไข้หวัดใหญ่",
      status: "approved",
      approvedBy: "คุณสมศรี ผู้จัดการ",
      submittedDate: new Date(2024, 10, 4),
    },
    {
<<<<<<< HEAD
      id: '3',
      type: "ลากิจ",
=======
      id: 3,
      type: t('leaveTypes.personal'),
>>>>>>> origin/db_yod
      startDate: new Date(2024, 9, 15),
      endDate: new Date(2024, 9, 15),
      days: 1,
      reason: "ติดต่อราชการ",
      status: "pending",
      submittedDate: new Date(2024, 9, 12),
    },
    {
<<<<<<< HEAD
      id: '4',
      type: "ลาพักผ่อน",
=======
      id: 4,
      type: t('leaveTypes.vacation'),
>>>>>>> origin/db_yod
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
<<<<<<< HEAD
            อนุมัติแล้ว
=======
            {t('leave.approved')}
>>>>>>> origin/db_yod
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertCircle className="w-3 h-3 mr-1" />
<<<<<<< HEAD
            รออนุมัติ
=======
            {t('history.pendingApproval')}
>>>>>>> origin/db_yod
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
<<<<<<< HEAD
            ไม่อนุมัติ
=======
            {t('leave.rejected')}
>>>>>>> origin/db_yod
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
<<<<<<< HEAD
    switch (type) {
      case "ลาพักผ่อน":
        return "text-blue-600";
      case "ลาป่วย":
        return "text-red-600";
      case "ลากิจ":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
=======
    if (type === t('leaveTypes.vacation')) return "text-blue-600";
    if (type === t('leaveTypes.sick')) return "text-red-600";
    if (type === t('leaveTypes.personal')) return "text-green-600";
    return "text-gray-600";
>>>>>>> origin/db_yod
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
<<<<<<< HEAD
            <h1 className="text-2xl font-bold text-gray-900">ประวัติการลา</h1>
            <p className="text-sm text-gray-600">
              ข้อมูลการลาทั้งหมดของคุณ
            </p>
          </div>
=======
            <h1 className="text-2xl font-bold text-gray-900">{t('leave.leaveHistory')}</h1>
            <p className="text-sm text-gray-600">
              {t('history.leaveHistoryTitle')}
            </p>
          </div>
          <LanguageSwitcher />
>>>>>>> origin/db_yod
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
                    <p className="text-2xl font-bold">11</p>
<<<<<<< HEAD
                    <p className="text-sm text-muted-foreground">วันที่ลาแล้ว</p>
=======
                    <p className="text-sm text-muted-foreground">{t('history.totalLeaveDays')}</p>
>>>>>>> origin/db_yod
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
                    <p className="text-2xl font-bold">3</p>
<<<<<<< HEAD
                    <p className="text-sm text-muted-foreground">คำขอที่อนุมัติ</p>
=======
                    <p className="text-sm text-muted-foreground">{t('history.approvedRequests')}</p>
>>>>>>> origin/db_yod
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">1</p>
<<<<<<< HEAD
                    <p className="text-sm text-muted-foreground">รออนุมัติ</p>
=======
                    <p className="text-sm text-muted-foreground">{t('history.pendingApproval')}</p>
>>>>>>> origin/db_yod
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leave History List */}
          <div className="space-y-4">
            {leaveHistory.map((leave, index) => (
              <Card 
                key={leave.id} 
                className="border-0 shadow-md hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className={`text-lg ${getTypeColor(leave.type)}`}>
                          {leave.type}
                        </CardTitle>
                        <CardDescription>
<<<<<<< HEAD
                          ส่งคำขอเมื่อ {format(leave.submittedDate, "dd MMMM yyyy", { locale: th })}
=======
                          {t('history.submittedOn')} {format(leave.submittedDate, "dd MMMM yyyy", { locale: th })}
>>>>>>> origin/db_yod
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(leave.status)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        {format(leave.startDate, "dd MMM", { locale: th })} - {format(leave.endDate, "dd MMM yyyy", { locale: th })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
<<<<<<< HEAD
                      <span className="text-sm">{leave.days} วัน</span>
=======
                      <span className="text-sm">{leave.days} {t('common.days')}</span>
>>>>>>> origin/db_yod
                    </div>
                  </div>
                  
                  <div>
<<<<<<< HEAD
                    <p className="text-sm font-medium text-gray-700">เหตุผล:</p>
=======
                    <p className="text-sm font-medium text-gray-700">{t('leave.reason')}:</p>
>>>>>>> origin/db_yod
                    <p className="text-sm text-gray-600 mt-1">{leave.reason}</p>
                  </div>
                  
                  {leave.status === "approved" && leave.approvedBy && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-800">
<<<<<<< HEAD
                        <strong>อนุมัติโดย:</strong> {leave.approvedBy}
=======
                        <strong>{t('history.approvedBy')}:</strong> {leave.approvedBy}
>>>>>>> origin/db_yod
                      </p>
                    </div>
                  )}
                  
                  {leave.status === "rejected" && leave.rejectedBy && (
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-sm text-red-800 mb-1">
<<<<<<< HEAD
                        <strong>ไม่อนุมัติโดย:</strong> {leave.rejectedBy}
                      </p>
                      {leave.rejectionReason && (
                        <p className="text-sm text-red-700">
                          <strong>เหตุผล:</strong> {leave.rejectionReason}
=======
                        <strong>{t('history.rejectedBy')}:</strong> {leave.rejectedBy}
                      </p>
                      {leave.rejectionReason && (
                        <p className="text-sm text-red-700">
                          <strong>{t('history.reasonForRejection')}:</strong> {leave.rejectionReason}
>>>>>>> origin/db_yod
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveHistory;
