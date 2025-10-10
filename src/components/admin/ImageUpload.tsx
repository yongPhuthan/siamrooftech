'use client';

import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { uploadImageToCloudflare, UploadResult } from '../../app/lib/cloudflare/uploadImage';
import { generateFileHash } from '../../app/lib/utils/fileHash';

interface SelectedFile {
  file: File;
  preview: string;
  id: string;
}

interface ImageUploadProps {
  onUpload: (uploadResults: UploadResult[]) => void;
  maxFiles?: number;
  multiple?: boolean;
  className?: string;
  showUploadArea?: boolean;
}

export interface ImageUploadRef {
  reset: () => void;
  getSelectedFiles: () => SelectedFile[];
  uploadFiles: () => Promise<UploadResult[]>;
  triggerFileSelect: () => void;
}

// Validate image file
const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'ไฟล์ต้องเป็นรูปภาพเท่านั้น' };
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { valid: false, error: 'ขนาดไฟล์ต้องไม่เกิน 5MB' };
  }

  return { valid: true };
};

const ImageUpload = forwardRef<ImageUploadRef, ImageUploadProps>(({ 
  onUpload, 
  maxFiles = 5, 
  multiple = true, 
  className = '',
  showUploadArea = true
}, ref) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetComponent = () => {
    selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    setSelectedFiles([]);
    setUploadProgress([]);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return [];

    setUploading(true);
    setUploadProgress(new Array(selectedFiles.length).fill(0));

    try {
      const uploadPromises = selectedFiles.map(async (selectedFile, index) => {
        try {
          setUploadProgress(prev => {
            const newProgress = [...prev];
            newProgress[index] = 50;
            return newProgress;
          });

          const result = await uploadImageToCloudflare(selectedFile.file);

          setUploadProgress(prev => {
            const newProgress = [...prev];
            newProgress[index] = 100;
            return newProgress;
          });

          return result;
        } catch (error) {
          console.error(`Error uploading ${selectedFile.file.name}:`, error);
          throw error;
        }
      });

      const results = await Promise.all(uploadPromises);
      onUpload(results);

      selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
      setSelectedFiles([]);
      setUploadProgress([]);
      return results;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    reset: resetComponent,
    getSelectedFiles: () => selectedFiles,
    triggerFileSelect: () => fileInputRef.current?.click(),
    uploadFiles
  }));

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    
    // Check if adding new files would exceed the limit
    if (selectedFiles.length + fileArray.length > maxFiles) {
      alert(`สามารถเลือกได้สูงสุด ${maxFiles} ไฟล์ (ปัจจุบันเลือกแล้ว ${selectedFiles.length} ไฟล์)`);
      return;
    }

    // Validate each file and check for duplicates
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    const duplicateFiles: string[] = [];

    // Generate hashes for existing selected files
    const existingHashes = new Set<string>();
    for (const selectedFile of selectedFiles) {
      const hash = await generateFileHash(selectedFile.file);
      existingHashes.add(hash);
    }

    for (const file of fileArray) {
      const validation = validateImageFile(file);
      if (validation.valid) {
        // Generate hash for new file to check for duplicates
        const hash = await generateFileHash(file);
        
        if (existingHashes.has(hash)) {
          duplicateFiles.push(`${file.name}: รูปนี้ถูกเลือกไปแล้ว (เนื้อหาเดียวกัน)`);
        } else {
          validFiles.push(file);
          existingHashes.add(hash); // Add to set to prevent duplicates within current selection
        }
      } else {
        invalidFiles.push(`${file.name}: ${validation.error}`);
      }
    }

    if (invalidFiles.length > 0) {
      alert(`ไฟล์ที่ไม่ถูกต้อง:\n${invalidFiles.join('\n')}`);
      return;
    }

    if (duplicateFiles.length > 0) {
      alert(`ไฟล์ที่ซ้ำกัน:\n${duplicateFiles.join('\n')}`);
      return;
    }

    if (validFiles.length === 0) return;

    // Add to selected files with previews
    const newSelectedFiles: SelectedFile[] = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7)
    }));

    setSelectedFiles(prev => [...prev, ...newSelectedFiles]);
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };


  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(e.target.files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden input for file selection */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={uploading}
      />
      
      {/* Upload Area - Only show when showUploadArea is true */}
      {showUploadArea && (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : uploading
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={!uploading ? openFileDialog : undefined}
        >
          {uploading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600">กำลังอัพโหลด...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวางที่นี่
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  รองรับไฟล์ JPG, PNG, GIF ขนาดไม่เกิน 5MB {multiple && `(สูงสุด ${maxFiles} ไฟล์)`}
                  <br />
                  <span className="text-blue-600">เลือกไฟล์เพื่อดูตัวอย่างก่อนอัพโหลด</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Add Images Button - Show when showUploadArea is false */}
      {!showUploadArea && (
        <div className="text-center">
          <button
            type="button"
            onClick={openFileDialog}
            disabled={uploading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            เพิ่มรูปภาพ
          </button>
          {uploading && (
            <div className="mt-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm text-gray-600">กำลังอัพโหลด...</span>
            </div>
          )}
        </div>
      )}

      {/* Upload Progress */}
      {uploading && uploadProgress.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">ความคืบหน้าการอัพโหลด:</h4>
          {uploadProgress.map((progress, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>ไฟล์ที่ {index + 1}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Images Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">
            รูปภาพที่เลือก ({selectedFiles.length}/{maxFiles})
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {selectedFiles.map((selectedFile, index) => (
              <div key={selectedFile.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                <img
                  src={selectedFile.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeFile(selectedFile.id)}
                  disabled={uploading}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 disabled:opacity-50 transition-colors opacity-0 group-hover:opacity-100"
                  title="ลบรูปภาพนี้"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {/* File name */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 truncate">
                  {selectedFile.file.name}
                </div>
              </div>
            ))}
          </div>

          {/* Upload info - no button, will upload on form submit */}
          <div className="text-center py-2">
            <p className="text-sm text-gray-600">
              💡 รูปภาพจะถูกอัปโหลดเมื่อคุณกดปุ่มบันทึกบทความ
            </p>
          </div>
        </div>
      )}

    </div>
  );
});

ImageUpload.displayName = 'ImageUpload';

export default ImageUpload;