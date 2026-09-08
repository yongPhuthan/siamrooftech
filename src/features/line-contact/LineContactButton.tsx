import Image from 'next/image';
import { LINE_CONTACT_URL } from './constants';

type LineContactButtonProps = {
  analyticsPosition: string;
  label?: string;
  fullWidth?: boolean;
  compact?: boolean;
};

/** Presentational CTA; the browser owns the direct LINE handoff. */
export default function LineContactButton({
  analyticsPosition,
  label = 'สอบถาม-ประเมินราคาฟรี',
  fullWidth = false,
  compact = false,
}: LineContactButtonProps) {
  return (
    <a
      href={LINE_CONTACT_URL}
      target="_blank"
      rel="noopener noreferrer"
      data-analytics-type="line"
      data-analytics-position={analyticsPosition}
      className={`inline-flex max-w-full min-w-0 items-center justify-center gap-2 rounded-[4px] bg-[#01b202] text-center font-bold text-white transition-colors hover:bg-[#01bd00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#01b202] focus-visible:ring-offset-2 ${compact ? 'min-h-11 px-3 py-2 text-xs' : 'min-h-12 px-5 py-3 text-sm'} ${fullWidth ? 'w-full' : ''}`}
    >
      <Image src="/images/line.png" alt="" aria-hidden="true" width={24} height={24} className="h-6 w-6 shrink-0" />
      <span>{label}</span>
    </a>
  );
}
