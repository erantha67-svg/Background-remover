import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, className }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      onImageSelect(acceptedFiles[0]);
    }
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  } as any);

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative group cursor-pointer border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ease-in-out flex flex-col items-center justify-center gap-4",
        isDragActive ? "border-blue-500 bg-blue-50/50" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50",
        className
      )}
    >
      <input {...getInputProps()} />
      
      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
        <Upload className="w-8 h-8" />
      </div>
      
      <div className="text-center">
        <p className="text-lg font-semibold text-slate-900">
          {isDragActive ? "Drop your image here" : "Upload apparel image"}
        </p>
        <p className="text-sm text-slate-500 mt-1">
          Drag & drop or click to browse
        </p>
      </div>

      <div className="flex gap-2 mt-4">
        <span className="px-2 py-1 rounded bg-slate-100 text-[10px] font-medium text-slate-600 uppercase tracking-wider">PNG</span>
        <span className="px-2 py-1 rounded bg-slate-100 text-[10px] font-medium text-slate-600 uppercase tracking-wider">JPG</span>
        <span className="px-2 py-1 rounded bg-slate-100 text-[10px] font-medium text-slate-600 uppercase tracking-wider">WEBP</span>
      </div>
    </div>
  );
};
