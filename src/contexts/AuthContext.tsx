'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { authClient } from '@/features/auth/client/auth-client';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  requestOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isPending } = authClient.useSession();
  const user = data?.user ? {
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    role: (data.user as typeof data.user & { role?: string }).role || 'user',
  } : null;

  const signIn = async (email: string, password: string) => {
    const result = await authClient.signIn.email({ email, password });
    if (result.error) throw new Error(result.error.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  };

  const logout = async () => {
    const result = await authClient.signOut();
    if (result.error) throw new Error(result.error.message || 'ออกจากระบบไม่สำเร็จ');
  };

  const requestOtp = async (email: string) => {
    const result = await authClient.emailOtp.sendVerificationOtp({ email, type: 'sign-in' });
    if (result.error) throw new Error(result.error.message || 'ส่งรหัสไม่สำเร็จ กรุณาลองใหม่');
  };

  const verifyOtp = async (email: string, otp: string) => {
    const result = await authClient.signIn.emailOtp({ email, otp });
    if (result.error) {
      const messages: Record<string, string> = {
        INVALID_OTP: 'รหัสยืนยันไม่ถูกต้อง กรุณาลองอีกครั้ง',
        OTP_EXPIRED: 'รหัสหมดอายุแล้ว กรุณาขอรหัสใหม่',
        TOO_MANY_ATTEMPTS: 'ลองรหัสผิดหลายครั้ง กรุณาขอรหัสใหม่',
      };
      throw new Error(messages[result.error.code ?? ''] || result.error.message || 'ยืนยันรหัสไม่สำเร็จ');
    }
  };

  const value: AuthContextType = {
    user,
    loading: isPending,
    isAdmin: user?.role === 'admin',
    signIn,
    requestOtp,
    verifyOtp,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
