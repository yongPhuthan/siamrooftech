'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { contactService } from '../../../lib/firestore';
import { trackContactFormSubmitSuccess } from '@/lib/gtag';

interface ContactFormProps {
  projectTitle?: string;
  category?: string;
}

export default function ContactForm({ projectTitle, category }: ContactFormProps = {}) {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: ''
  });
  
  // Pre-fill form based on URL params or props
  useEffect(() => {
    const urlProject = searchParams?.get('project');
    const urlCategory = searchParams?.get('category');
    const referenceProject = projectTitle || urlProject;
    const referenceCategory = category || urlCategory;
    
    if (referenceProject || referenceCategory) {
      let initialMessage = '';
      
      if (referenceProject) {
        initialMessage += `สนใจโปรเจกต์: ${referenceProject}\n\n`;
      }
      
      if (referenceCategory) {
        initialMessage += `หมวดหมู่: ${referenceCategory}\n\n`;
      }
      
      initialMessage += 'รายละเอียดเพิ่มเติม:\n- ขนาดพื้นที่: \n- สถานที่ติดตั้ง: \n- งบประมาณ: \n- เวลาที่ต้องการ: ';
      
      setFormData(prev => ({
        ...prev,
        subject: 'quotation',
        message: initialMessage
      }));
    }
  }, [searchParams, projectTitle, category]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await contactService.submit(formData);
      setSubmitStatus('success');
      trackContactFormSubmitSuccess(formData.subject);
      setFormData({
        name: '',
        phone: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-semibold text-[#002573] mb-6 flex items-center">
        <svg className="w-8 h-8 mr-3 text-[#002573]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        ส่งข้อความถึงเรา
      </h2>

      {submitStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center text-green-700">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">ส่งข้อความเรียบร้อยแล้ว!</span>
          </div>
          <p className="text-green-600 text-sm mt-1">เราจะติดต่อกลับภายใน 24 ชั่วโมง</p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center text-red-700">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="font-medium">เกิดข้อผิดพลาด</span>
          </div>
          <p className="text-red-600 text-sm mt-1">กรุณาลองอีกครั้ง หรือติดต่อผ่านช่องทางอื่น</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-[#002573] mb-2">
              ชื่อ-นามสกุล *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#002573] focus:border-[#002573] transition-colors disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="กรอกชื่อ-นามสกุล"
            />
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-[#002573] mb-2">
              เบอร์โทรศัพท์ *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#002573] focus:border-[#002573] transition-colors disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="0x-xxxx-xxxx"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-[#002573] mb-2">
            อีเมล
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#002573] focus:border-[#002573] transition-colors disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="example@email.com"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-semibold text-[#002573] mb-2">
            หัวข้อ *
          </label>
          <select
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#002573] focus:border-[#002573] transition-colors disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">เลือกหัวข้อ</option>
            <option value="quotation">ขอใบเสนอราคา</option>
            <option value="consultation">ปรึกษาการติดตั้ง</option>
            <option value="project-inquiry">สอบถามเกี่ยวกับโปรเจกต์</option>
            <option value="maintenance">บริการหลังการขาย</option>
            <option value="other">อื่นๆ</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-[#002573] mb-2">
            รายละเอียด *
          </label>
          <textarea
            id="message"
            name="message"
            rows={6}
            value={formData.message}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#002573] focus:border-[#002573] transition-colors resize-none disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="กรุณาระบุรายละเอียดความต้องการ เช่น ขนาดพื้นที่ ประเภทงาน งบประมาณ ฯลฯ"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-[#002573] to-[#1e40af] text-white py-4 px-6 rounded-xl font-semibold hover:from-[#001a5c] hover:to-[#1e3a8a] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <span className="flex items-center justify-center space-x-2">
            {isSubmitting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>กำลังส่ง...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>ส่งข้อความ</span>
              </>
            )}
          </span>
        </button>
      </form>

      <div className="mt-8 p-6 bg-gradient-to-r from-[#002573]/5 to-blue-50 rounded-xl border border-[#002573]/10">
        <h3 className="font-semibold text-[#002573] mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          เคล็ดลับ: การได้ใบเสนอราคาที่แม่นยำ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-[#002573] rounded-full"></span>
            <span>แนบรูปพื้นที่ที่ต้องการติดตั้ง</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-[#002573] rounded-full"></span>
            <span>ระบุขนาดพื้นที่โดยประมาณ</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-[#002573] rounded-full"></span>
            <span>บอกความสูงของการติดตั้ง</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-[#002573] rounded-full"></span>
            <span>ระบุงบประมาณที่มี (ถ้ามี)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
