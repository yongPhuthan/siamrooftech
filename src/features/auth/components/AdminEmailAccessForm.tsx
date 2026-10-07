'use client';

import { type FormEvent, useEffect, useState } from 'react';

interface AdminEmailAccessFormProps {
  requestOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
}

/** One form on every admin entry route; the server owns invitation and verification policy. */
export default function AdminEmailAccessForm({ requestOtp, verifyOtp }: AdminEmailAccessFormProps) {
  const [email, setEmail] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [retryAt, setRetryAt] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!retryAt) return;
    const update = () => setSeconds(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);

  const sendCode = async (recipient: string) => {
    setPending(true);
    setError('');
    try {
      await requestOtp(recipient);
      setVerificationEmail(recipient);
      setOtp('');
      setSeconds(60);
      setRetryAt(Date.now() + 60_000);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'ส่งรหัสไม่สำเร็จ กรุณาลองใหม่');
    } finally { setPending(false); }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!verificationEmail) { await sendCode(email.trim().toLowerCase()); return; }
    if (!/^\d{6}$/.test(otp)) { setError('กรอกรหัสยืนยัน 6 หลัก'); return; }
    setPending(true);
    setError('');
    try { await verifyOtp(verificationEmail, otp); }
    catch (verifyError) { setError(verifyError instanceof Error ? verifyError.message : 'ยืนยันรหัสไม่สำเร็จ'); }
    finally { setPending(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-5" aria-label="สมัครและเข้าสู่ระบบด้วยอีเมล">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">สมัครหรือเข้าสู่ระบบด้วยอีเมล</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">ยืนยันด้วยรหัสจากอีเมลของคุณ สมัครครั้งแรกได้ทันทีเมื่อยืนยันสำเร็จ</p>
      </div>
      {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {!verificationEmail ? (
        <div>
          <label htmlFor="admin-access-email" className="mb-2 block text-sm font-medium text-slate-700">อีเมลที่ได้รับอนุญาต</label>
          <input id="admin-access-email" type="email" autoComplete="email" autoCapitalize="none" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={pending} className="article-admin-input" placeholder="you@example.com" />
        </div>
      ) : (
        <div>
          <p role="status" className="mb-4 text-sm leading-6 text-slate-600">ส่งรหัสไปที่ <strong className="break-all text-slate-900">{verificationEmail}</strong> แล้ว หากไม่พบ โปรดตรวจโฟลเดอร์สแปม</p>
          <label htmlFor="admin-access-otp" className="mb-2 block text-sm font-medium text-slate-700">รหัสยืนยัน 6 หลัก</label>
          <input id="admin-access-otp" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} required disabled={pending} autoFocus aria-describedby="admin-otp-expiry" className="article-admin-input text-center text-2xl tracking-[0.4em]" />
          <p id="admin-otp-expiry" className="mt-2 text-sm text-slate-500">รหัสใช้ได้ครั้งเดียวภายใน 5 นาที</p>
        </div>
      )}
      <button type="submit" disabled={pending} className="w-full rounded bg-blue-700 px-4 py-3 font-medium text-white hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60">
        {pending ? 'กำลังดำเนินการ…' : verificationEmail ? 'ยืนยันและเข้าใช้งาน' : 'ส่งรหัสยืนยันทางอีเมล'}
      </button>
      {verificationEmail && <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <button type="button" onClick={() => void sendCode(verificationEmail)} disabled={pending || seconds > 0} className="text-blue-700 underline disabled:text-slate-500 disabled:no-underline">{seconds > 0 ? `ส่งรหัสใหม่ได้ใน ${seconds} วินาที` : 'ส่งรหัสใหม่'}</button>
        <button type="button" onClick={() => { setVerificationEmail(''); setOtp(''); setError(''); }} disabled={pending} className="text-slate-600 underline">เปลี่ยนอีเมล</button>
      </div>}
      <p className="text-xs leading-5 text-slate-500">สำหรับอีเมลที่เจ้าของระบบอนุญาตเท่านั้น</p>
    </form>
  );
}
