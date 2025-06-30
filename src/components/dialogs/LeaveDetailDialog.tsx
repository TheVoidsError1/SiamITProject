
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface LeaveRequest {
  id: number;
  type: string;
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: string;
  submittedDate: Date;
  attachments?: File[];
  rejectionReason?: string;
}

interface LeaveDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveRequest: LeaveRequest | null;
}

export const LeaveDetailDialog = ({ open, onOpenChange, leaveRequest }: LeaveDetailDialogProps) => {
  if (!leaveRequest) return null;

  const getStatusBadge = (status: string) => {
    if (status === 'approved') return <Badge className="bg-green-100 text-green-800">อนุมัติแล้ว</Badge>;
    if (status === 'rejected') return <Badge className="bg-red-100 text-red-800">ไม่อนุมัติ</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800">รอการอนุมัติ</Badge>;
  };

  const hasAttachments = ['ลาป่วย', 'ลาคลอด', 'ลาฉุกเฉิน'].includes(leaveRequest.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>รายละเอียดการลา</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">ประเภทการลา</label>
              <p className="text-sm">{leaveRequest.type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">สถานะ</label>
              <div className="mt-1">{getStatusBadge(leaveRequest.status)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">วันเริ่มลา</label>
              <p className="text-sm">{format(leaveRequest.startDate, "dd MMMM yyyy", { locale: th })}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">วันสิ้นสุด</label>
              <p className="text-sm">{format(leaveRequest.endDate, "dd MMMM yyyy", { locale: th })}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">จำนวนวัน</label>
            <p className="text-sm">{leaveRequest.days} วัน</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">เหตุผลการลา</label>
            <p className="text-sm bg-gray-50 p-3 rounded-lg">{leaveRequest.reason}</p>
          </div>

          {leaveRequest.status === 'rejected' && leaveRequest.rejectionReason && (
            <div>
              <label className="text-sm font-medium text-red-700">เหตุผลที่ไม่อนุมัติ</label>
              <p className="text-sm bg-red-50 p-3 rounded-lg text-red-800">{leaveRequest.rejectionReason}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">วันที่ส่งคำขอ</label>
            <p className="text-sm">{format(leaveRequest.submittedDate, "dd MMMM yyyy", { locale: th })}</p>
          </div>

          {hasAttachments && leaveRequest.attachments && leaveRequest.attachments.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700">เอกสารแนบ</label>
              <div className="mt-2 grid grid-cols-2 gap-4">
                {leaveRequest.attachments.map((file, index) => (
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
