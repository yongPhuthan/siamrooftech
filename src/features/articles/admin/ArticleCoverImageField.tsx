'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, Replace, Trash2, Upload, X } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  const selectCover = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');

    if (!ALLOWED_IMAGE_TYPES.has(file.type) || file.size > MAX_COVER_SIZE) {
      setError('เลือกไฟล์ JPG, PNG, WebP หรือ AVIF ขนาดไม่เกิน 5 MB');
      return;
    }

    setPendingFile(file);
    setLocalPreview(URL.createObjectURL(file));
  };

  const uploadSelectedCover = async () => {
    if (!pendingFile) return;
    setUploading(true);
    try {
      const result = await uploadImageToCloudflare(pendingFile, { watermarkText: null });
      const uploadedUrl = result.originalUrl || result.mediumUrl;
      if (!uploadedUrl) throw new Error('บริการอัปโหลดไม่ได้ส่ง URL ภาพกลับมา');
      onImageChange(uploadedUrl);
      setPendingFile(null);
      setLocalPreview('');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'อัปโหลดภาพปกไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  const cancelPendingCover = () => {
    setPendingFile(null);
    setLocalPreview('');
    setError('');
  };

  const previewUrl = localPreview || imageUrl;
  const hasPendingCover = pendingFile !== null;

  return (
    <div className="space-y-3">
      <span className="block text-sm font-medium text-slate-800">ภาพปก</span>
      {previewUrl ? (
        <div className="flex flex-col gap-3">
          {/* This admin preview displays the uploaded source at its natural aspect ratio. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={altText || ''} className="aspect-video w-full max-w-sm rounded border border-slate-200 bg-slate-50 object-cover" />
          <div className="space-y-2">
            {hasPendingCover && <p className="text-xs text-amber-800">ภาพที่เลือกยังไม่ถูกอัปโหลด · กด “อัปโหลดภาพปก” เมื่อพร้อม</p>}
            <label className="block space-y-1 text-sm font-medium text-slate-800">
              <span>คำอธิบายภาพปก</span>
              <input data-article-field="metadata.coverAlt" value={altText ?? ''} onChange={(event) => onAltChange(event.target.value || undefined)} className="article-admin-input" placeholder="อธิบายภาพให้ผู้ใช้ที่มองไม่เห็นภาพเข้าใจ" />
            </label>
            <div className="flex flex-wrap gap-2">
              {hasPendingCover ? (
                <>
                  <button type="button" onClick={uploadSelectedCover} disabled={uploading} className="article-cover-upload-button inline-flex min-h-10 items-center justify-center gap-2 px-4 py-2 text-sm font-semibold disabled:cursor-wait disabled:opacity-60" aria-label="อัปโหลดภาพปก" aria-busy={uploading}>
                    {uploading ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <Upload size={17} aria-hidden="true" />}
                    <span>{uploading ? 'กำลังอัปโหลด…' : 'อัปโหลดภาพปก'}</span>
                  </button>
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="article-editor-tool inline-flex size-10 items-center justify-center p-0 disabled:opacity-50" aria-label="เลือกภาพอื่น" title="เลือกภาพอื่น"><ImagePlus size={17} aria-hidden="true" /></button>
                  <button type="button" onClick={cancelPendingCover} disabled={uploading} className="article-editor-tool inline-flex size-10 items-center justify-center p-0 disabled:opacity-50" aria-label="ยกเลิกการเลือกภาพ" title="ยกเลิกการเลือกภาพ"><X size={17} aria-hidden="true" /></button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="article-editor-tool inline-flex size-10 items-center justify-center p-0" aria-label="เปลี่ยนภาพปก" title="เปลี่ยนภาพปก"><Replace size={17} aria-hidden="true" /></button>
                  <button type="button" onClick={() => { onImageChange(undefined); onAltChange(undefined); setLocalPreview(''); setError(''); }} className="article-editor-tool inline-flex size-10 items-center justify-center p-0" aria-label="นำภาพปกออก" title="นำภาพปกออก"><Trash2 size={17} aria-hidden="true" /></button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-700 hover:border-blue-400 hover:bg-blue-50">
          <span className="font-medium">เลือกภาพปกจากอุปกรณ์</span>
          <span className="text-xs text-slate-500">JPG, PNG, WebP หรือ AVIF · ไม่เกิน 5 MB</span>
        </button>
      )}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={selectCover} disabled={uploading} className="sr-only" aria-label="เลือกไฟล์ภาพปก" />
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {!altText && imageUrl && <p className="text-sm text-amber-800">ก่อนเผยแพร่ ให้เพิ่มคำอธิบายภาพ หรือเอาภาพปกออก</p>}
    </div>
  );
}
