import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";

interface ImageUploadFieldProps {
  label: string;
  imageUrl: string;
  uploading: boolean;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}

export const ImageUploadField = ({
  label,
  imageUrl,
  uploading,
  onFileSelect,
  onClear,
}: ImageUploadFieldProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {imageUrl && (
        <div className="relative w-32 h-32">
          <img
            src={imageUrl}
            alt="Preview"
            className="w-full h-full object-cover rounded-md border"
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={onClear}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Subiendo..." : "Subir imagen"}
        </Button>
      </div>
    </div>
  );
};
