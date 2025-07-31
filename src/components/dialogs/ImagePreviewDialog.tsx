
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';

interface ImagePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName: string;
  title?: string;
}

export default function ImagePreviewDialog({
  isOpen,
  onClose,
  imageUrl,
  imageName,
  title = "รูปภาพ"
}: ImagePreviewDialogProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName;
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="bg-gray-100 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-800">
              {title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="bg-black flex-1 flex items-center justify-center p-8">
          <div className="relative max-w-full max-h-full">
            <img
              src={imageUrl}
              alt={imageName}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                console.error('Image failed to load:', imageUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>
        
        <div className="bg-gray-100 px-6 py-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 truncate" title={imageName}>
                {imageName}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                ดาวน์โหลด
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                ปิด
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
