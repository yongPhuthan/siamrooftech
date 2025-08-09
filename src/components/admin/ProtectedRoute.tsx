'use client';

import { useAuth } from '../../contexts/AuthContext';
import { ReactNode, useState } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              ระบบจัดการเนื้อหา
            </h1>
            <p className="text-gray-600 mt-2">
              สยามรูฟเทค
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function LoginForm() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    if (isSignUp) {
      if (password.length < 6) {
        setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        return;
      }
      
      if (password !== confirmPassword) {
        setError('รหัสผ่านไม่ตรงกัน');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Handle Firebase auth errors
      let errorMessage = 'เกิดข้อผิดพลาด';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'อีเมลนี้ถูกใช้งานแล้ว';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'รหัสผ่านไม่ปลอดภัย กรุณาใช้รหัสผ่านที่แข็งแกร่งกว่านี้';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
        <button
          type="button"
          onClick={() => setIsSignUp(false)}
          disabled={loading}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
            !isSignUp
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          เข้าสู่ระบบ
        </button>
        <button
          type="button"
          onClick={() => setIsSignUp(true)}
          disabled={loading}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
            isSignUp
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          สมัครสมาชิก
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            อีเมล
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="admin@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            รหัสผ่าน
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder={isSignUp ? 'อย่างน้อย 6 ตัวอักษร' : 'รหัสผ่าน'}
          />
          {isSignUp && (
            <p className="text-xs text-gray-500 mt-1">รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร</p>
          )}
        </div>

        {isSignUp && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              ยืนยันรหัสผ่าน
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="ยืนยันรหัสผ่าน"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isSignUp ? 'กำลังสมัครสมาชิก...' : 'กำลังเข้าสู่ระบบ...'}
            </>
          ) : (
            isSignUp ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'
          )}
        </button>

        {isSignUp && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              มีบัญชีแล้ว?{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-blue-600 hover:text-blue-700 font-medium"
                disabled={loading}
              >
                เข้าสู่ระบบ
              </button>
            </p>
          </div>
        )}

        {!isSignUp && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              ยังไม่มีบัญชี?{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-blue-600 hover:text-blue-700 font-medium"
                disabled={loading}
              >
                สมัครสมาชิก
              </button>
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

