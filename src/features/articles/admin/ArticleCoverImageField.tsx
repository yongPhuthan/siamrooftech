'use client';

import { useEffect, useState } from 'react';
import { uploadImageToCloudflare } from '@/app/lib/cloudflare/uploadImage';

interface ArticleCoverImageFieldProps {
  imageUrl?: string;
  altText?: string;
  onImageChange: (imageUrl: string | undefined) => void;
  onAltChange: (altText: string | undefined) => void;
}

const MAX_COVER_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export default function ArticleCoverImageField({ imageUrl, altText, onImageChange, onAltChange }: ArticleCoverImageFieldProps) {
  const [localPreview, setLocalPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  const uploadCover = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');

    if (!ALLOWED_IMAGE_TYPES.has(file.type) || file.size > MAX_COVER_SIZE) {
      setError('เลือกไฟล์ JPG, PNG, WebP หรือ AVIF ขนาดไม่เกิน 5 MB');
      return;
    }

    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setUploading(true);
    try {
      const result = await uploadImageToCloudflare(file, { watermarkText: null });
      const uploadedUrl = result.originalUrl || result.mediumUrl;
      if (!uploadedUrl) throw new Error('บริการอัปโหลดไม่ได้ส่ง URL ภาพกลับมา');
      onImageChange(uploadedUrl);
      setLocalPreview('');
      URL.revokeObjectURL(preview);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'อัปโหลดภาพปกไม่สำเร็จ');
      setLocalPreview('');
      URL.revokeObjectURL(preview);
    } finally {
      setUploading(false);
    }
  };

  const previewUrl = localPreview || imageUrl;

  return (
    <div className="space-y-3">
      <span className="block text-sm font-medium text-slate-800">ภาพปก</span>
      {previewUrl ? (
        <div className="flex flex-col gap-3">
          {/* This admin preview displays the uploaded source at its natural aspect ratio. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={altText || ''} className="aspect-video w-full max-w-sm rounded border border-slate-200 bg-slate-50 object-cover" />
          <div className="space-y-2">
            <label className="block space-y-1 text-sm font-medium text-slate-800">
              <span>คำอธิบายภาพปก</span>
              <input data-article-field="metadata.coverAlt" value={altText ?? ''} onChange={(event) => onAltChange(event.target.value || undefined)} className="article-admin-input" placeholder="อธิบายภาพให้ผู้ใช้ที่มองไม่เห็นภาพเข้าใจ" />
            </label>
            <div className="flex flex-wrap gap-2">
              <label className="article-editor-tool cursor-pointer">
                {uploading ? 'กำลังอัปโหลด…' : 'เปลี่ยนภาพปก'}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={uploadCover} disabled={uploading} className="sr-only" />
              </label>
              {!uploading && <button type="button" onClick={() => { onImageChange(undefined); onAltChange(undefined); setLocalPreview(''); setError(''); }} className="article-editor-tool">นำภาพปกออก</button>}
            </div>
          </div>
        </div>
      ) : (
        <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-700 hover:border-blue-400 hover:bg-blue-50">
          <span className="font-medium">{uploading ? 'กำลังอัปโหลดภาพปก…' : 'เลือกภาพปกจากอุปกรณ์'}</span>
          <span className="text-xs text-slate-500">JPG, PNG, WebP หรือ AVIF · ไม่เกิน 5 MB · อัปโหลดไปยัง R2</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={uploadCover} disabled={uploading} className="sr-only" />
        </label>
      )}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {!altText && imageUrl && <p className="text-sm text-amber-800">ก่อนเผยแพร่ ให้เพิ่มคำอธิบายภาพ หรือเอาภาพปกออก</p>}
    </div>
  );
}
