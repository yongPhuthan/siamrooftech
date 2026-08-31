'use client';

import { useEffect, useRef } from 'react';
import type { LeadPersona } from '@/lib/gtag';

interface LeadSurveyModalProps {
  isOpen: boolean;
  onAnswer: (persona: LeadPersona) => void;
  tone?: 'brand' | 'monochrome';
}

const OPTIONS: { persona: LeadPersona; label: string }[] = [
  { persona: 'homeowner', label: 'เจ้าของบ้าน / เจ้าของอาคาร' },
  { persona: 'procurement', label: 'ฝ่ายจัดซื้อ / บริษัท' },
  { persona: 'contractor', label: 'ผู้รับเหมา / ช่าง' },
];

export default function LeadSurveyModal({ isOpen, onAnswer, tone = 'brand' }: LeadSurveyModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const monochrome = tone === 'monochrome';

  useEffect(() => {
    if (!isOpen || !monochrome) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.querySelector('button')?.focus();
    return () => previousFocus?.focus();
  }, [isOpen, monochrome]);

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
      <div
        ref={panelRef}
        className={`w-full max-w-md bg-white p-6 sm:p-8 ${monochrome ? 'border border-neutral-300 text-neutral-900' : 'rounded-2xl shadow-2xl'}`}
        onKeyDown={monochrome ? (event) => {
          if (event.key !== 'Tab') return;
          const buttons = panelRef.current?.querySelectorAll('button');
          if (!buttons?.length) return;
          const first = buttons[0];
          const last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        } : undefined}
      >
        <h2 id="lead-survey-title" className={`text-lg font-bold sm:text-xl ${monochrome ? 'text-neutral-900' : 'text-gray-900'}`}>
          เลือกประเภทของผู้ติดต่อ
        </h2>

        <div className="mt-6 flex flex-col gap-3">
          {OPTIONS.map(({ persona, label }) => (
            <button
              key={persona}
              type="button"
              onClick={() => onAnswer(persona)}
              className={`w-full border px-4 py-3 text-left font-medium transition-colors duration-200 ${monochrome
                ? 'min-h-12 rounded-[4px] border-neutral-300 bg-white text-neutral-900 hover:border-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004589] focus-visible:ring-offset-2'
                : 'rounded-xl border-gray-200 bg-gray-50 text-gray-800 hover:border-[#027DFF] hover:bg-blue-50 hover:text-[#027DFF]'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
