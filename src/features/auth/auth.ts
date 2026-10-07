import { betterAuth } from 'better-auth';
import { admin, emailOTP } from 'better-auth/plugins';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { allowedAdminEmails, isAllowedAdminEmail, normalizeAdminEmail } from './owner-access';
import { deliverAdminOtp, requireEmailDelivery, reserveOtpDelivery } from './server/otp-delivery';

export interface AuthRuntimeEnv {
  APP_DB: D1Database;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  ADMIN_ALLOWED_EMAILS?: string;
  AUTH_EMAIL?: SendEmail;
  AUTH_EMAIL_FROM?: string;
  AUTH_EMAIL_DELIVERY?: string;
}

export function createAuth(env: AuthRuntimeEnv) {
  const secret = env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters');

  return betterAuth({
    database: env.APP_DB,
    secret,
    baseURL: env.BETTER_AUTH_URL || 'http://localhost:3000',
    trustedOrigins: [env.BETTER_AUTH_URL || 'http://localhost:3000'],
    rateLimit: { enabled: true, storage: 'database', modelName: 'rate_limit', fields: { lastRequest: 'last_request' }, window: 60, max: 60 },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/email-otp/send-verification-otp' && ctx.path !== '/sign-in/email-otp') return;
        if (!allowedAdminEmails(env.ADMIN_ALLOWED_EMAILS).length) {
          throw new APIError('SERVICE_UNAVAILABLE', { code: 'ADMIN_ACCESS_NOT_CONFIGURED', message: 'ยังไม่ได้กำหนดอีเมลเจ้าของระบบ กรุณาติดต่อผู้ดูแล' });
        }
        const email = typeof ctx.body?.email === 'string' ? normalizeAdminEmail(ctx.body.email) : '';
        if (!isAllowedAdminEmail(email, env.ADMIN_ALLOWED_EMAILS)) {
          throw new APIError('FORBIDDEN', { code: 'ADMIN_EMAIL_NOT_ALLOWED', message: 'อีเมลนี้ไม่ได้รับอนุญาตให้เข้าใช้งานหลังบ้าน' });
        }
        ctx.body.email = email;
        if (ctx.path === '/email-otp/send-verification-otp') {
          (ctx.context as typeof ctx.context & { otpDeliveryFailed?: boolean }).otpDeliveryFailed = false;
          if (ctx.body.type !== 'sign-in') throw new APIError('BAD_REQUEST', { message: 'ใช้รหัสสำหรับสมัครหรือเข้าสู่ระบบเท่านั้น' });
          requireEmailDelivery(env);
          await reserveOtpDelivery(env, email);
        }
      }),
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path === '/email-otp/send-verification-otp' && (ctx.context as typeof ctx.context & { otpDeliveryFailed?: boolean }).otpDeliveryFailed) {
          throw new APIError('SERVICE_UNAVAILABLE', { code: 'OTP_DELIVERY_UNAVAILABLE', message: 'ส่งอีเมลไม่สำเร็จ กรุณารอสักครู่แล้วลองใหม่' });
        }
        const session = ctx.context.newSession;
        if (ctx.path === '/sign-in/email-otp' && session?.user.emailVerified && isAllowedAdminEmail(session.user.email, env.ADMIN_ALLOWED_EMAILS)) {
          // Verified ownership of an explicitly approved mailbox is the self-service admin grant.
          await ctx.context.internalAdapter.updateUser(session.user.id, { role: 'admin' });
        }
      }),
    },
    databaseHooks: {
      user: { create: { before: async (user, ctx) => {
        if (ctx?.path === '/sign-in/email-otp' && user.emailVerified && isAllowedAdminEmail(user.email, env.ADMIN_ALLOWED_EMAILS)) {
          return { data: { ...user, role: 'admin' } };
        }
      } } },
    },
    user: {
      fields: {
        emailVerified: 'email_verified',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        banReason: 'ban_reason',
        banExpires: 'ban_expires',
      },
    },
    session: {
      fields: {
        userId: 'user_id',
        expiresAt: 'expires_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        ipAddress: 'ip_address',
        userAgent: 'user_agent',
        impersonatedBy: 'impersonated_by',
      },
      cookieCache: { enabled: false },
    },
    account: {
      fields: {
        accountId: 'account_id',
        providerId: 'provider_id',
        userId: 'user_id',
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        idToken: 'id_token',
        accessTokenExpiresAt: 'access_token_expires_at',
        refreshTokenExpiresAt: 'refresh_token_expires_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },
    verification: {
      fields: {
        expiresAt: 'expires_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },
    emailAndPassword: { enabled: true, disableSignUp: true },
    plugins: [emailOTP({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 5,
      storeOTP: 'hashed',
      disableSignUp: false,
      rateLimit: { window: 60, max: 10 },
      sendVerificationOTP: async ({ email, otp, type }, ctx) => {
        if (type !== 'sign-in' || !isAllowedAdminEmail(email, env.ADMIN_ALLOWED_EMAILS)) throw new APIError('FORBIDDEN');
        try { await deliverAdminOtp(env, email, otp); }
        catch {
          // Better Auth suppresses delivery exceptions. Surface a failure via its
          // per-request after hook so the UI never reports an unsent code as sent.
          if (ctx) (ctx.context as typeof ctx.context & { otpDeliveryFailed?: boolean }).otpDeliveryFailed = true;
        }
      },
    }), admin({
      schema: {
        user: { fields: { banReason: 'ban_reason', banExpires: 'ban_expires' } },
        session: { fields: { impersonatedBy: 'impersonated_by' } },
      },
    })],
    advanced: {
      disableOriginCheck: false,
      ipAddress: {
        // Trust the client address injected by Cloudflare, not a caller's
        // arbitrary x-forwarded-for value.
        ipAddressHeaders: ['cf-connecting-ip'],
      },
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: 'lax',
        // Better Auth derives Secure and its cookie prefix from the actual base URL.
        // This keeps localhost preview usable while HTTPS deployments stay Secure.
      },
    },
  });
}
