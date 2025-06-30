
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ApprovalConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (rejectionReason?: string) => void;
  action: 'approve' | 'reject';
  employeeName: string;
}

export const ApprovalConfirmDialog = ({ open, onOpenChange, onConfirm, action, employeeName }: ApprovalConfirmDialogProps) => {
  const [rejectionReason, setRejectionReason] = useState("");

  const handleConfirm = () => {
    onConfirm(action === 'reject' ? rejectionReason : undefined);
    setRejectionReason("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setRejectionReason("");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ยืนยันการ{action === 'approve' ? 'อนุมัติ' : 'ไม่อนุมัติ'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            คุณต้องการ{action === 'approve' ? 'อนุมัติ' : 'ไม่อนุมัติ'}คำขอลาของ {employeeName} หรือไม่?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {action === 'reject' && (
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">เหตุผลที่ไม่อนุมัติ *</Label>
            <Textarea
              id="rejection-reason"
              placeholder="กรุณาระบุเหตุผลที่ไม่อนุมัติคำขอนี้"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={action === 'reject' && !rejectionReason.trim()}
            className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            ยืนยัน{action === 'approve' ? 'อนุมัติ' : 'ไม่อนุมัติ'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
