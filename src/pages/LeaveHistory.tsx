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
  const { t } = useTranslation();
  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaveHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found, please login');
        const res = await fetch('/api/leave-history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === "success") {
          setLeaveHistory(data.data);
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
  }, []);

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
                    <p className="text-2xl font-bold">11</p>
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
                    <p className="text-2xl font-bold">3</p>
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
                    <p className="text-2xl font-bold">1</p>
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
              leaveHistory.map((leave) => (
                <Card key={leave.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`text-lg font-semibold ${getTypeColor(leave.type)}`}>
                          {leave.type}
                        </div>
                        {getStatusBadge(leave.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(leave.submittedDate), 'dd MMM yyyy', { locale: th })}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{t('leave.startDate')}:</span>
                          <span>{format(new Date(leave.startDate), 'dd MMM yyyy', { locale: th })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{t('leave.endDate')}:</span>
                          <span>{format(new Date(leave.endDate), 'dd MMM yyyy', { locale: th })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{t('leave.duration')}:</span>
                          <span>{leave.days} {t('leave.days')}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 text-sm">
                          <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="font-medium">{t('leave.reason')}:</span>
                            <p className="text-muted-foreground">{leave.reason}</p>
                          </div>
                        </div>
                        {leave.status === "approved" && leave.approvedBy && (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="font-medium">{t('leave.approvedBy')}:</span>
                            <span>{leave.approvedBy}</span>
                          </div>
                        )}
                        {leave.status === "rejected" && leave.rejectedBy && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <XCircle className="w-4 h-4 text-red-600" />
                              <span className="font-medium">{t('leave.rejectedBy')}:</span>
                              <span>{leave.rejectedBy}</span>
                            </div>
                            {leave.rejectionReason && (
                              <div className="flex items-start gap-2 text-sm">
                                <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <span className="font-medium">{t('leave.rejectionReason')}:</span>
                                  <p className="text-muted-foreground">{leave.rejectionReason}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveHistory;
