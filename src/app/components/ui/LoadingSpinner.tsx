/**
 * LoadingSpinner - Simple loading spinner component
 *
 * Usage:
 * - Full page loading
 * - Button loading states
 * - Inline loading indicators
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
  xl: 'w-16 h-16 border-4',
};

export default function LoadingSpinner({
  size = 'md',
  className = '',
  fullScreen = false
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={`${sizeClasses[size]} border-blue-200 border-t-blue-600 rounded-full animate-spin ${className}`}
      role="status"
      aria-label="กำลังโหลด"
    >
      <span className="sr-only">กำลังโหลด...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
        <p className="text-gray-600 text-sm mt-4">กำลังโหลด...</p>
      </div>
    );
  }

  return spinner;
}
