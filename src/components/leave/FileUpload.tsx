
import ImagePreviewDialog from "@/components/dialogs/ImagePreviewDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, Upload, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { handleImageClick } from '../../lib/utils';

interface FileUploadProps {
  attachments: File[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (index: number) => void;
  readOnly?: boolean; // เพิ่ม prop สำหรับโหมด read-only
}

export const FileUpload = ({
  attachments,
  onFileUpload,
  onRemoveAttachment,
  readOnly = false, // ค่าเริ่มต้นเป็น false
}: FileUploadProps) => {
  const { t } = useTranslation();
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const isImageFile = (file: File) => {
    return file.type.startsWith('image/');
  };

  // ฟังก์ชันสำหรับดึง URL ของไฟล์ (รองรับทั้ง File object และ custom URL)
  const getFileUrl = (file: File) => {
    // ตรวจสอบว่ามี custom url property หรือไม่ (สำหรับโหมด view)
    if ((file as any).url) {
      return (file as any).url;
    }
    // ถ้าเป็น File object ปกติ ใช้ URL.createObjectURL
    return URL.createObjectURL(file);
  };

  return (
    <div className="space-y-2">
      {/* ซ่อนส่วนอัปโหลดถ้าเป็นโหมด read-only */}
      {!readOnly && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <input
            type="file"
            id="file-upload"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={onFileUpload}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center cursor-pointer"
          >
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              {t('leave.clickToSelectFile')}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {t('leave.supportedFormats')}
            </p>
          </label>
        </div>
      )}
      
      {attachments.length > 0 && (
        <div className="mt-3 space-y-2">
          <Label className="text-sm font-medium">{t('leave.attachedFiles')}:</Label>
          {attachments.map((file, index) => (
            <div
              key={index}
              className="bg-gray-50 p-3 rounded-lg"
            >
              {/* รูปไฟล์อยู่ด้านบน */}
              {isImageFile(file) && (
                <div className="mb-3 relative">
                  <img
                    src={getFileUrl(file)}
                    alt={file.name}
                    className="w-full h-auto rounded border object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ maxHeight: '150px', maxWidth: '200px' }}
                    onClick={() => handleImageClick(file, setPreviewImage, setImageDialogOpen)}
                  />
                  {/* Yellow overlay with See Details text */}
                  <div className="absolute bottom-2 left-2 space-y-1">
                    {/* แถบแรก */}
                    <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-medium shadow-md">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                        {t('leave.seeDetails')}
                      </div>
                    </div>
                    {/* แถบที่สอง */}
                    <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-medium shadow-md">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                        {t('leave.seeDetails')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* ส่วนของชื่อไฟล์และปุ่มต่างๆ อยู่ด้านล่าง */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 font-medium truncate max-w-[150px]" title={file.name}>
                  {/* Show only filename, not full path และตัดให้สั้น */}
                  {(() => {
                    const fileName = file.name.includes('/') ? file.name.split('/').pop() : file.name;
                    return fileName && fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName;
                  })()}
                </span>
                <div className="flex gap-2">
                  {isImageFile(file) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleImageClick(file, setPreviewImage, setImageDialogOpen)}
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      title={t('leave.seeDetails')}
                    >
                      <Eye className="w-4 h-4" />
                      <span className="sr-only">{t('leave.seeDetails')}</span>
                    </Button>
                  )}
                  {/* Show View and Download buttons in read-only mode */}
                  {readOnly && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if ((file as any).url) {
                            window.open((file as any).url, '_blank');
                          }
                        }}
                        className="text-xs px-2 py-1"
                      >
                        {t('common.view')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if ((file as any).url) {
                            const link = document.createElement('a');
                            link.href = (file as any).url;
                            link.download = file.name.includes('/') ? file.name.split('/').pop() : file.name;
                            link.click();
                          }
                        }}
                        className="text-xs px-2 py-1"
                      >
                        {t('common.download')}
                      </Button>
                    </>
                  )}
                  {/* Hide remove button in read-only mode */}
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveAttachment(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewImage && (
        <ImagePreviewDialog
          isOpen={imageDialogOpen}
          onClose={() => setImageDialogOpen(false)}
          imageUrl={previewImage.url}
          imageName={previewImage.name}
          title={t('leave.attachedImage')}
        />
      )}
    </div>
  );
};
