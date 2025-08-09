"use client";

import { useState, useRef } from "react";

interface PDFAutofillData {
  title?: string;
  location?: string;
  width?: number;
  extension?: number;
  category?: string;
  type?: string;
  arms_count?: string;
  canvas_material?: string;
  fabric_edge?: string;
  price?: string;
  notes?: string;
}

interface PDFAutofillComponentProps {
  onDataExtracted: (data: PDFAutofillData) => void;
  isLoading?: boolean;
}

export default function PDFAutofillComponent({ onDataExtracted, isLoading = false }: PDFAutofillComponentProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('กรุณาอัพโหลดไฟล์ PDF เท่านั้น');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 10MB');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/pdf-autofill', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการประมวลผล PDF');
      }

      if (result.success && result.data) {
        onDataExtracted(result.data);
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error('ไม่สามารถแยกข้อมูลจาก PDF ได้');
      }

    } catch (err) {
      console.error('PDF autofill error:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการประมวลผล PDF');
    } finally {
      setProcessing(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-full mb-4">
          <svg 
            className="w-8 h-8" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          ✨ Autofill with AI
        </h3>
        
        <p className="text-gray-600 mb-4 text-sm">
          อัพโหลดใบเสนอราคา PDF เพื่อให้ AI กรอกข้อมูลอัตโนมัติ
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleButtonClick}
          disabled={processing || isLoading}
          className={`
            inline-flex items-center px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300
            ${processing || isLoading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 hover:shadow-lg hover:scale-105'
            }
          `}
        >
          {processing ? (
            <>
              <svg 
                className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              กำลังประมวลผล...
            </>
          ) : (
            <>
              <svg 
                className="w-4 h-4 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
              อัพโหลด PDF
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="mt-4 text-xs text-gray-500">
          รองรับไฟล์ PDF ขนาดไม่เกิน 10MB
        </div>
      </div>
    </div>
  );
}