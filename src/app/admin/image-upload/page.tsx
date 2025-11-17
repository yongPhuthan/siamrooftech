'use client';

import { useMemo, useState } from 'react';
import ProtectedRoute from '../../../components/admin/ProtectedRoute';
import AdminLayout from '../../../components/admin/AdminLayout';
import { AuthProvider } from '../../../contexts/AuthContext';
import ImageUploadTabs, { LocalImageFile } from '../../../components/admin/ImageUploadTabs';
import { ProjectImage } from '../../../lib/firestore';
import { uploadImageToCloudflare, UploadResult } from '../../lib/cloudflare/uploadImage';

type UploadGroupKey = 'with-watermark' | 'without-watermark';
type UploadHistoryEntry = {
  id: string;
  fileName: string;
  type: 'before' | 'after';
  mode: UploadGroupKey;
  result: UploadResult;
};

type GroupLocalFiles = {
  after: LocalImageFile[];
  before: LocalImageFile[];
};

const createGroupFiles = (): GroupLocalFiles => ({ after: [], before: [] });
const uploadModes: { key: UploadGroupKey; label: string; description: string }[] = [
  {
    key: 'with-watermark',
    label: 'อัปโหลดพร้อมลายน้ำ LINE:@ROOFTECH',
    description: 'ภาพที่ส่งผ่านโหมดนี้จะถูกสอดลายน้ำตัวอักษรไว้ในมุมล่างขวาทุกขนาด',
  },
  {
    key: 'without-watermark',
    label: 'อัปโหลดแบบไม่ใส่ลายน้ำ',
    description: 'สำหรับไฟล์ที่ใช้ในงานภายใน/ไฟล์ต้นฉบับที่ยังไม่ต้องการลายน้ำ',
  },
];

export default function AdminImageUploadPage() {
  const [groupFiles, setGroupFiles] = useState<Record<UploadGroupKey, GroupLocalFiles>>({
    'with-watermark': createGroupFiles(),
    'without-watermark': createGroupFiles(),
  });
  const [activeMode, setActiveMode] = useState<UploadGroupKey>('with-watermark');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryEntry[]>([]);

  const currentGroup = groupFiles[activeMode];
  const totalLocalFiles = currentGroup.after.length + currentGroup.before.length;

  const updateGroupFiles = (mode: UploadGroupKey, updater: (prev: GroupLocalFiles) => GroupLocalFiles) => {
    setGroupFiles((prev) => ({
      ...prev,
      [mode]: updater(prev[mode]),
    }));
  };

  const handleGroupAfterFilesChange = (files: LocalImageFile[]) => {
    updateGroupFiles(activeMode, (prev) => ({ ...prev, after: files }));
  };

  const handleGroupBeforeFilesChange = (files: LocalImageFile[]) => {
    updateGroupFiles(activeMode, (prev) => ({ ...prev, before: files }));
  };

  const revokeFiles = (files: LocalImageFile[]) => {
    files.forEach((file) => URL.revokeObjectURL(file.preview));
  };

  const clearGroupFiles = (mode: UploadGroupKey) => {
    revokeFiles(groupFiles[mode].after);
    revokeFiles(groupFiles[mode].before);
    updateGroupFiles(mode, () => ({ after: [], before: [] }));
  };

  const handleUploadGroup = async (mode: UploadGroupKey) => {
    const files = [...groupFiles[mode].after, ...groupFiles[mode].before];
    if (files.length === 0) {
      alert('กรุณาเลือกไฟล์ก่อนอัปโหลด');
      return;
    }

    setIsUploading(true);
    try {
      const results = await Promise.all(
        files.map((localFile) =>
          uploadImageToCloudflare(localFile.file, {
            watermarkText: mode === 'without-watermark' ? null : undefined,
          })
        )
      );

      const entries: UploadHistoryEntry[] = files.map((localFile, index) => ({
        id: localFile.id,
        fileName: localFile.file.name,
        type: localFile.type,
        mode,
        result: results[index],
      }));

      setUploadHistory((prev) => [...entries, ...prev]);
      clearGroupFiles(mode);
    } catch (error) {
      console.error('Upload error:', error);
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ กรุณาลองใหม่');
    } finally {
      setIsUploading(false);
    }
  };

  const memoizedMode = useMemo(() => uploadModes.find((mode) => mode.key === activeMode), [activeMode]);

  return (
    <AuthProvider>
      <ProtectedRoute>
        <AdminLayout>
          <div className="space-y-10">
            <header className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-500">Watermark</p>
              <h1 className="text-3xl font-semibold text-gray-900">อัปโหลดรูปภาพ (โหมด {memoizedMode?.label.split(' ')[0]})</h1>
              <p className="text-sm text-gray-600 max-w-2xl">
                เลือกโหมดสำหรับภาพที่ต้องการออกแบบการจัดการลายน้ำให้เหมาะกับการใช้งานจริง ทั้งสำหรับงานพร้อมเผยแพร่และงานภายใน
              </p>
            </header>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap gap-3 pb-6">
                {uploadModes.map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => setActiveMode(mode.key)}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                      activeMode === mode.key
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-500 mb-4">{memoizedMode?.description}</p>

              <ImageUploadTabs
                afterImages={[]}
                beforeImages={[]}
                localAfterFiles={currentGroup.after}
                localBeforeFiles={currentGroup.before}
                onAfterImagesChange={() => {}}
                onBeforeImagesChange={() => {}}
                onLocalAfterFilesChange={handleGroupAfterFilesChange}
                onLocalBeforeFilesChange={handleGroupBeforeFilesChange}
                onImageDelete={() => Promise.resolve()}
                onImageReorder={() => Promise.resolve()}
                isUploading={isUploading}
              />

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-500">
                  <p>ไฟล์ที่พร้อมอัปโหลด (โหมดนี้): {totalLocalFiles}</p>
                  <p className="text-xs text-gray-400">ภาพหลัง/ก่อนติดตั้งยังแยกตามแท็บในคอมโพเนนต์ข้างต้น</p>
                </div>
                <button
                  onClick={() => handleUploadGroup(activeMode)}
                  disabled={isUploading || totalLocalFiles === 0}
                  className="w-full sm:w-auto flex items-center justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดโหมดนี้'}
                </button>
              </div>
            </div>

            {uploadHistory.length > 0 && (
              <section className="rounded-3xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">ประวัติการอัปโหลดล่าสุด</h2>
                    <p className="text-xs text-gray-500">สร้างลิงก์ตรงเพื่อใช้งานต่อได้ทันที</p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-500">
                    SiamRooftech
                  </span>
                </div>
                <div className="space-y-4">
                  {uploadHistory.map((entry) => (
                    <article
                      key={`${entry.id}-${entry.result.originalUrl}`}
                      className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{entry.fileName}</p>
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white bg-gray-800 rounded-full px-3 py-1 inline-block mt-1">
                          {entry.mode === 'with-watermark' ? 'พร้อมลายน้ำ' : 'ไม่มีลายน้ำ'} • {entry.type === 'after' ? 'หลังติดตั้ง' : 'ก่อนติดตั้ง'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        {entry.result.originalUrl && (
                          <a href={entry.result.originalUrl} target="_blank" rel="noreferrer" className="underline">
                            Original
                          </a>
                        )}
                        {entry.result.mediumUrl && (
                          <a href={entry.result.mediumUrl} target="_blank" rel="noreferrer" className="underline">
                            Medium
                          </a>
                        )}
                        {entry.result.thumbnailUrl && (
                          <a href={entry.result.thumbnailUrl} target="_blank" rel="noreferrer" className="underline">
                            Thumbnail
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        </AdminLayout>
      </ProtectedRoute>
    </AuthProvider>
  );
}
