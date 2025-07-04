
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  imageName: string;
}

export const ImagePreviewDialog = ({ open, onOpenChange, imageUrl, imageName }: ImagePreviewDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-2">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-4">{imageName}</h3>
          <img
            src={imageUrl}
            alt={imageName}
            className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
