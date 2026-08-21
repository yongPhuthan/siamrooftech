'use client';

import { useEffect } from 'react';
import type { LeadPersona } from '@/lib/gtag';

interface LeadSurveyModalProps {
  isOpen: boolean;
  onAnswer: (persona: LeadPersona) => void;
  onDecline: () => void;
}

const OPTIONS: { persona: LeadPersona; label: string }[] = [
  { persona: 'homeowner', label: 'ฉันเป็นเจ้าของบ้าน / เจ้าของอาคาร' },
  { persona: 'procurement', label: 'ฉันดูแลฝ่ายจัดซื้อ / บริษัท' },
  { persona: 'contractor', label: 'ฉันเป็นผู้รับเหมา / ร้านติดตั้ง (รับราคาช่าง)' },
];

export default function LeadSurveyModal({ isOpen, onAnswer, onDecline }: LeadSurveyModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-survey-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <h2 id="lead-survey-title" className="text-lg font-bold text-gray-900 sm:text-xl">
          เพื่อเตรียมราคาและคำแนะนำให้ตรงกับคุณที่สุด
        </h2>

        <div className="mt-6 flex flex-col gap-3">
          {OPTIONS.map(({ persona, label }) => (
            <button
              key={persona}
              type="button"
              onClick={() => onAnswer(persona)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left font-medium text-gray-800 transition-colors duration-200 hover:border-[#027DFF] hover:bg-blue-50 hover:text-[#027DFF]"
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onDecline}
          className="mt-4 w-full text-center text-sm text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline"
        >
          ไม่สะดวกตอบตอนนี้
        </button>
      </div>
    </div>
  );
}
