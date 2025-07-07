import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface LeaveRequest {
  id: string;
  type: string;
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: string;
  submittedDate: Date;
  attachments?: File[];
  rejectionReason?: string;
  approvedBy?: string;
  approvedTime?: string;
  startTime?: string;
  endTime?: string;
  personalLeaveType?: string;
  imgLeave?: string;
  phone?: string;
}

interface LeaveDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveRequest: LeaveRequest | null;
}

export const LeaveDetailDialog = ({ open, onOpenChange, leaveRequest }: LeaveDetailDialogProps) => {
  const { t } = useTranslation();
  const [leaveDetail, setLeaveDetail] = useState<LeaveRequest | null>(leaveRequest);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && leaveRequest?.id) {
      setLoading(true);
      fetch(`http://localhost:3001/api/leave-request/${leaveRequest.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setLeaveDetail(data.data);
          } else {
            setLeaveDetail(leaveRequest); // fallback
          }
          setLoading(false);
        })
        .catch(() => {
          setLeaveDetail(leaveRequest);
          setLoading(false);
        });
    } else {
      setLeaveDetail(leaveRequest);
    }
  }, [open, leaveRequest]);

  if (!leaveDetail) return null;
  if (loading) return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('leave.details')}</DialogTitle>
        </DialogHeader>
        <div>{t('common.loading')}</div>
      </DialogContent>
    </Dialog>
  );

  const getStatusBadge = (status: string) => {
    if (status === 'approved') return <Badge className="bg-green-100 text-green-800">{t('leave.approved')}</Badge>;
    if (status === 'rejected') return <Badge className="bg-red-100 text-red-800">{t('leave.rejected')}</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800">{t('leave.pending')}</Badge>;
  };

  const hasAttachments = ['ลาป่วย', 'ลาคลอด', 'ลาฉุกเฉิน'].includes(leaveDetail.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('leave.details')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">{t('leave.type')}</label>
              <p className="text-sm">{leaveDetail.type || leaveDetail.personalLeaveType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t('leave.status')}</label>
              <div className="mt-1">{getStatusBadge(leaveDetail.status)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">{t('leave.startDate')}</label>
              <p className="text-sm">{leaveDetail.startDate ? format(new Date(leaveDetail.startDate), "dd MMMM yyyy", { locale: th }) : ''}</p>
              {leaveDetail.startTime && <p className="text-xs text-gray-500">{t('leave.time')}: {leaveDetail.startTime}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t('leave.endDate')}</label>
              <p className="text-sm">{leaveDetail.endDate ? format(new Date(leaveDetail.endDate), "dd MMMM yyyy", { locale: th }) : ''}</p>
              {leaveDetail.endTime && <p className="text-xs text-gray-500">{t('leave.time')}: {leaveDetail.endTime}</p>}
            </div>
          </div>

          {leaveDetail.personalLeaveType && (
            <div>
              <label className="text-sm font-medium text-gray-700">{t('leave.specificType')}</label>
              <p className="text-sm">{leaveDetail.personalLeaveType}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">{t('leave.duration')}</label>
            <p className="text-sm">{leaveDetail.days || ''} {t('leave.days')}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">{t('leave.reason')}</label>
            <p className="text-sm bg-gray-50 p-3 rounded-lg">{leaveDetail.reason}</p>
          </div>

          {leaveDetail.status === 'rejected' && leaveDetail.rejectionReason && (
            <div>
              <label className="text-sm font-medium text-red-700">{t('leave.rejectionReason')}</label>
              <p className="text-sm bg-red-50 p-3 rounded-lg text-red-800">{leaveDetail.rejectionReason}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">{t('leave.submittedDate')}</label>
            <p className="text-sm">{leaveDetail.submittedDate ? format(new Date(leaveDetail.submittedDate), "dd MMMM yyyy", { locale: th }) : ''}</p>
          </div>

          {leaveDetail.approvedBy && (
            <div>
              <label className="text-sm font-medium text-gray-700">{t('leave.approvedBy')}</label>
              <p className="text-sm">{leaveDetail.approvedBy}</p>
            </div>
          )}
          {leaveDetail.approvedTime && (
            <div>
              <label className="text-sm font-medium text-gray-700">{t('leave.approvedTime')}</label>
              <p className="text-sm">{format(new Date(leaveDetail.approvedTime), "dd MMMM yyyy HH:mm", { locale: th })}</p>
            </div>
          )}
          {leaveDetail.phone && (
            <div>
              <label className="text-sm font-medium text-gray-700">{t('employee.phone')}</label>
              <p className="text-sm">{leaveDetail.phone}</p>
            </div>
          )}
          {leaveDetail.imgLeave && (
            <div>
              <label className="text-sm font-medium text-gray-700">{t('leave.attachments')}</label>
              <a href={leaveDetail.imgLeave} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{t('leave.viewAttachment')}</a>
            </div>
          )}

          {hasAttachments && leaveDetail.attachments && leaveDetail.attachments.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700">{t('leave.documents')}</label>
              <div className="mt-2 grid grid-cols-2 gap-4">
                {leaveDetail.attachments.map((file, index) => (
                  <div key={index} className="border rounded-lg p-2">
                    <p className="text-xs text-gray-600 mb-2">{file.name}</p>
                    {file.type.startsWith('image/') && (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-32 object-cover rounded"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
