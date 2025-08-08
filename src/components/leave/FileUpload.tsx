
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Eye } from "lucide-react";
import ImagePreviewDialog from "@/components/dialogs/ImagePreviewDialog";
import { handleImageClick } from '../../lib/utils';

interface FileUploadProps {
  attachments: File[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (index: number) => void;
}

export const FileUpload = ({
  attachments,
  onFileUpload,
  onRemoveAttachment,
}: FileUploadProps) => {
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const isImageFile = (file: File) => {
    return file.type.startsWith('image/');
  };

  return (
    <div className="space-y-2">
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
            คลิกเพื่อเลือกไฟล์หรือลากไฟล์มาวาง
          </p>
          <p className="text-xs text-gray-500 mt-1">
            รองรับ PDF, JPG, PNG, DOC, DOCX
          </p>
        </label>
      </div>
      
      {attachments.length > 0 && (
        <div className="mt-3 space-y-2">
          <Label className="text-sm font-medium">ไฟล์ที่แนบ:</Label>
          {attachments.map((file, index) => (
            <div
              key={index}
              className="bg-gray-50 p-3 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700 font-medium">{file.name}</span>
                <div className="flex gap-2">
                  {isImageFile(file) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleImageClick(file, setPreviewImage, setImageDialogOpen)}
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveAttachment(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {isImageFile(file) && (
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full max-w-[30vw] h-auto rounded border object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ maxHeight: '200px' }}
                    onClick={() => handleImageClick(file, setPreviewImage, setImageDialogOpen)}
                  />
                </div>
              )}
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
          title="รูปภาพแนบ"
        />
      )}
    </div>
  );
};
