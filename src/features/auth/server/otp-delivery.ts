import { createHmac } from 'node:crypto';
import { APIError } from 'better-auth/api';
import { z } from 'zod';

export interface OtpDeliveryEnv {
  APP_DB: D1Database;
  BETTER_AUTH_SECRET?: string;
  AUTH_EMAIL?: SendEmail;
  AUTH_EMAIL_FROM?: string;
  AUTH_EMAIL_DELIVERY?: string;
}

export function requireEmailDelivery(env: OtpDeliveryEnv) {
  if (env.AUTH_EMAIL_DELIVERY !== 'live' || !env.AUTH_EMAIL || !z.string().email().safeParse(env.AUTH_EMAIL_FROM).success) {
    throw new APIError('SERVICE_UNAVAILABLE', { code: 'OTP_DELIVERY_UNAVAILABLE', message: 'บริการส่งรหัสยืนยันยังไม่พร้อม กรุณาติดต่อผู้ดูแล' });
  }
}

/** Atomic per-mailbox cooldown persists across Worker instances and IP changes. */
export async function reserveOtpDelivery(env: OtpDeliveryEnv, email: string) {
  const emailKey = createHmac('sha256', env.BETTER_AUTH_SECRET!).update(email).digest('hex');
  const now = Date.now();
  const reserved = await env.APP_DB.prepare(
    'INSERT INTO auth_otp_requests (email_key,retry_at) VALUES (?,?) ON CONFLICT(email_key) DO UPDATE SET retry_at=excluded.retry_at WHERE auth_otp_requests.retry_at<=? RETURNING email_key',
  ).bind(emailKey, now + 60_000, now).first();
  if (!reserved) {
    throw new APIError('TOO_MANY_REQUESTS', { code: 'OTP_RESEND_TOO_SOON', message: 'กรุณารอ 60 วินาทีก่อนขอรหัสใหม่' }, { 'Retry-After': '60' });
  }
}

export async function deliverAdminOtp(env: OtpDeliveryEnv, email: string, otp: string) {
  requireEmailDelivery(env);
  try {
    await env.AUTH_EMAIL!.send({
      from: { email: env.AUTH_EMAIL_FROM!, name: 'Siamrooftech' },
      to: email,
      subject: 'Siamrooftech — รหัสยืนยันเข้าใช้งานหลังบ้าน',
      text: `รหัสยืนยันของคุณคือ ${otp}\nรหัสนี้ใช้ได้ครั้งเดียวภายใน 5 นาที\nหากไม่ได้ขอรหัสนี้ โปรดเพิกเฉยต่ออีเมลนี้`,
      html: `<p>รหัสยืนยันเข้าใช้งานหลังบ้าน Siamrooftech</p><p style="font-size:32px;letter-spacing:6px;font-weight:700">${otp}</p><p>ใช้ได้ครั้งเดียวภายใน 5 นาที หากไม่ได้ขอรหัสนี้ โปรดเพิกเฉยต่ออีเมลนี้</p>`,
    });
  } catch {
    // Never include provider payloads, OTPs or credentials in application logs or API errors.
    throw new APIError('SERVICE_UNAVAILABLE', { code: 'OTP_DELIVERY_UNAVAILABLE', message: 'ส่งอีเมลไม่สำเร็จ กรุณารอสักครู่แล้วลองใหม่' });
  }
}
