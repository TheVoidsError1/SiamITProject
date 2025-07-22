import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface LeaveRequest {
  id: string;
  type?: string;
  leaveTypeName?: string;
  user?: { User_name?: string; department?: string; position?: string; department_name_th?: string; position_name_th?: string };
  startDate: string;
  endDate: string;
  days?: number;
  reason: string;
  status: string;
  createdAt?: string;
  statusBy?: string;
  approvedTime?: string;
  startTime?: string;
  endTime?: string;
  personalLeaveType?: string;
  imgLeave?: string;
  contact?: string;
  rejectedReason?: string;
  // Added for new API
  employeeName?: string;
  leaveType?: string;
  submittedDate?: string;
  name?: string;
  leaveDate?: string;
  leaveTypeEn?: string;
  backdated?: boolean;
}

interface LeaveDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveRequest: LeaveRequest | null;
}

export const LeaveDetailDialog = ({ open, onOpenChange, leaveRequest }: LeaveDetailDialogProps) => {
  const { t, i18n } = useTranslation();
  const [leaveDetail, setLeaveDetail] = useState<LeaveRequest | null>(leaveRequest);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (open && leaveRequest?.id) {
      setLoading(true);
      fetch(`${API_BASE_URL}/api/leave-request/detail/${leaveRequest.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setLeaveDetail(data.data);
          } else {
            setLeaveDetail(null); // do not fallback to leaveRequest
          }
          setLoading(false);
        })
        .catch(() => {
          setLeaveDetail(null);
          setLoading(false);
        });
    } else {
      setLeaveDetail(null);
    }
  }, [open, leaveRequest]);

  const getStatusBadge = (status: string) => {
    if (status === 'approved') return <Badge className="bg-green-100 text-green-800">{t('leave.approved')}</Badge>;
    if (status === 'rejected') return <Badge className="bg-red-100 text-red-800">{t('leave.rejected')}</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800">{t('leave.pending')}</Badge>;
  };

  if (loading) return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('leave.details')}</DialogTitle>
          <DialogDescription>
            {t('leave.detailDescription', 'Detailed information about this leave request.')}
          </DialogDescription>
        </DialogHeader>
        <div>{t('common.loading')}</div>
      </DialogContent>
    </Dialog>
  );

  // Always show the dialog, even if leaveDetail is null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('leave.details')}</DialogTitle>
          <DialogDescription>
            {t('leave.detailDescription', 'Detailed information about this leave request.')}
          </DialogDescription>
        </DialogHeader>
        {leaveDetail && leaveDetail.backdated && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-300 text-orange-800 rounded text-center font-semibold">
            {t('leave.backdatedNotice', 'ใบลานี้เป็นการลาย้อนหลัง')}
          </div>
        )}
        {leaveDetail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">{t('employee.name')}</label>
                <p className="text-sm">{leaveDetail.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{t('leave.type')}</label>
                <p className="text-sm">
                  {(() => {
                    // แสดงชื่อ leave type ตามภาษา
                    if (i18n.language === 'th') {
                      return leaveDetail.leaveTypeName || leaveDetail.leaveTypeEn || leaveDetail.leaveType || '-';
                    } else {
                      return leaveDetail.leaveTypeEn || leaveDetail.leaveTypeName || leaveDetail.leaveType || '-';
                    }
                  })()}

                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">{t('leave.status')}</label>
                <div className="mt-1">{getStatusBadge(leaveDetail.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{t('leave.submittedDate')}</label>
                <p className="text-sm">{leaveDetail.submittedDate || '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">{t('leave.date')}</label>
                <p className="text-sm">{leaveDetail.leaveDate || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{t('leave.endDate')}</label>
                <p className="text-sm">{leaveDetail.endDate || '-'}</p>
              </div>
            </div>
            {leaveDetail.contact && (
              <div>
                <label className="text-sm font-medium text-gray-700">{t('leave.contactInfo')}</label>
                <p className="text-sm">{leaveDetail.contact}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">{t('leave.reason')}</label>
              <p className="text-sm bg-gray-50 p-3 rounded-lg">{leaveDetail.reason || '-'}</p>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">{t('leave.noDetailFound', 'No data found for this leave request.')}</div>
        )}
      </DialogContent>
    </Dialog>
  );
};
