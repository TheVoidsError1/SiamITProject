<<<<<<< HEAD
=======

>>>>>>> origin/db_yod
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { th } from "date-fns/locale";
<<<<<<< HEAD
import { useEffect, useState } from "react";

interface LeaveRequest {
  id: string;
=======

interface LeaveRequest {
  id: number;
>>>>>>> origin/db_yod
  type: string;
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: string;
  submittedDate: Date;
  attachments?: File[];
  rejectionReason?: string;
<<<<<<< HEAD
  approvedBy?: string;
  approvedTime?: string;
  startTime?: string;
  endTime?: string;
  personalLeaveType?: string;
  imgLeave?: string;
  phone?: string;
=======
>>>>>>> origin/db_yod
}

interface LeaveDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveRequest: LeaveRequest | null;
}

export const LeaveDetailDialog = ({ open, onOpenChange, leaveRequest }: LeaveDetailDialogProps) => {
<<<<<<< HEAD
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
          <DialogTitle>รายละเอียดการลา</DialogTitle>
        </DialogHeader>
        <div>กำลังโหลดข้อมูล...</div>
      </DialogContent>
    </Dialog>
  );
=======
  if (!leaveRequest) return null;
>>>>>>> origin/db_yod

  const getStatusBadge = (status: string) => {
    if (status === 'approved') return <Badge className="bg-green-100 text-green-800">อนุมัติแล้ว</Badge>;
    if (status === 'rejected') return <Badge className="bg-red-100 text-red-800">ไม่อนุมัติ</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800">รอการอนุมัติ</Badge>;
  };

<<<<<<< HEAD
  const hasAttachments = ['ลาป่วย', 'ลาคลอด', 'ลาฉุกเฉิน'].includes(leaveDetail.type);
=======
  const hasAttachments = ['ลาป่วย', 'ลาคลอด', 'ลาฉุกเฉิน'].includes(leaveRequest.type);
>>>>>>> origin/db_yod

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
<<<<<<< HEAD
              <p className="text-sm">{leaveDetail.type || leaveDetail.personalLeaveType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">สถานะ</label>
              <div className="mt-1">{getStatusBadge(leaveDetail.status)}</div>
=======
              <p className="text-sm">{leaveRequest.type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">สถานะ</label>
              <div className="mt-1">{getStatusBadge(leaveRequest.status)}</div>
>>>>>>> origin/db_yod
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">วันเริ่มลา</label>
<<<<<<< HEAD
              <p className="text-sm">{leaveDetail.startDate ? format(new Date(leaveDetail.startDate), "dd MMMM yyyy", { locale: th }) : ''}</p>
              {leaveDetail.startTime && <p className="text-xs text-gray-500">เวลา: {leaveDetail.startTime}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">วันสิ้นสุด</label>
              <p className="text-sm">{leaveDetail.endDate ? format(new Date(leaveDetail.endDate), "dd MMMM yyyy", { locale: th }) : ''}</p>
              {leaveDetail.endTime && <p className="text-xs text-gray-500">เวลา: {leaveDetail.endTime}</p>}
            </div>
          </div>

          {leaveDetail.personalLeaveType && (
            <div>
              <label className="text-sm font-medium text-gray-700">ประเภทลาเฉพาะ</label>
              <p className="text-sm">{leaveDetail.personalLeaveType}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">จำนวนวัน</label>
            <p className="text-sm">{leaveDetail.days || ''} วัน</p>
=======
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
>>>>>>> origin/db_yod
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">เหตุผลการลา</label>
<<<<<<< HEAD
            <p className="text-sm bg-gray-50 p-3 rounded-lg">{leaveDetail.reason}</p>
          </div>

          {leaveDetail.status === 'rejected' && leaveDetail.rejectionReason && (
            <div>
              <label className="text-sm font-medium text-red-700">เหตุผลที่ไม่อนุมัติ</label>
              <p className="text-sm bg-red-50 p-3 rounded-lg text-red-800">{leaveDetail.rejectionReason}</p>
=======
            <p className="text-sm bg-gray-50 p-3 rounded-lg">{leaveRequest.reason}</p>
          </div>

          {leaveRequest.status === 'rejected' && leaveRequest.rejectionReason && (
            <div>
              <label className="text-sm font-medium text-red-700">เหตุผลที่ไม่อนุมัติ</label>
              <p className="text-sm bg-red-50 p-3 rounded-lg text-red-800">{leaveRequest.rejectionReason}</p>
>>>>>>> origin/db_yod
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">วันที่ส่งคำขอ</label>
<<<<<<< HEAD
            <p className="text-sm">{leaveDetail.submittedDate ? format(new Date(leaveDetail.submittedDate), "dd MMMM yyyy", { locale: th }) : ''}</p>
          </div>

          {leaveDetail.approvedBy && (
            <div>
              <label className="text-sm font-medium text-gray-700">ผู้อนุมัติ</label>
              <p className="text-sm">{leaveDetail.approvedBy}</p>
            </div>
          )}
          {leaveDetail.approvedTime && (
            <div>
              <label className="text-sm font-medium text-gray-700">วันที่อนุมัติ</label>
              <p className="text-sm">{format(new Date(leaveDetail.approvedTime), "dd MMMM yyyy HH:mm", { locale: th })}</p>
            </div>
          )}
          {leaveDetail.phone && (
            <div>
              <label className="text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
              <p className="text-sm">{leaveDetail.phone}</p>
            </div>
          )}
          {leaveDetail.imgLeave && (
            <div>
              <label className="text-sm font-medium text-gray-700">ไฟล์แนบ</label>
              <a href={leaveDetail.imgLeave} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">ดูไฟล์แนบ</a>
            </div>
          )}

          {hasAttachments && leaveDetail.attachments && leaveDetail.attachments.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700">เอกสารแนบ</label>
              <div className="mt-2 grid grid-cols-2 gap-4">
                {leaveDetail.attachments.map((file, index) => (
=======
            <p className="text-sm">{format(leaveRequest.submittedDate, "dd MMMM yyyy", { locale: th })}</p>
          </div>

          {hasAttachments && leaveRequest.attachments && leaveRequest.attachments.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700">เอกสารแนบ</label>
              <div className="mt-2 grid grid-cols-2 gap-4">
                {leaveRequest.attachments.map((file, index) => (
>>>>>>> origin/db_yod
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
