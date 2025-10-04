import LoadingSpinner from './components/ui/LoadingSpinner';

/**
 * Root loading.tsx - Next.js App Router loading UI
 *
 * Automatically shown during page transitions
 */
export default function Loading() {
  return <LoadingSpinner fullScreen />;
}
