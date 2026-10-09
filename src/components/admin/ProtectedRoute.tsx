'use client';

import { useAuth } from '../../contexts/AuthContext';
import { type ReactNode, useState } from 'react';
import AdminEmailAccessForm from '@/features/auth/components/AdminEmailAccessForm';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin, logout, requestOtp, verifyOtp } = useAuth();
  const [logoutError, setLogoutError] = useState('');

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center bg-slate-50"><p role="status" className="text-slate-600">กำลังตรวจสอบสิทธิ์…</p></div>;

  if (!user) return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-7 border-b border-slate-200 pb-5"><h1 className="text-2xl font-bold text-slate-900">ระบบจัดการเนื้อหา</h1><p className="mt-2 text-slate-600">สยามรูฟเทค</p></div>
        <AdminEmailAccessForm requestOtp={requestOtp} verifyOtp={verifyOtp} />
      </div>
    </div>
  );

  if (!isAdmin) return (
    <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-xl font-bold">บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานหลังบ้าน</h1>
        <p className="mt-3 text-slate-600">ใช้บัญชีอีเมลที่เจ้าของระบบอนุญาตและยืนยันรหัสทางอีเมลอีกครั้ง</p>
        <button type="button" onClick={() => void logout().catch(() => setLogoutError('ออกจากระบบไม่สำเร็จ กรุณาลองใหม่'))} className="mt-6 rounded bg-blue-700 px-4 py-2 text-white">ออกจากระบบ</button>
        {logoutError && <p role="alert" className="mt-3 text-red-700">{logoutError}</p>}
      </div>
    </div>
  );

  return <>{children}</>;
}
