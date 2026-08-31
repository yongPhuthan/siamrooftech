import Image from 'next/image';

type LineContactButtonProps = {
  analyticsPosition: string;
  label?: string;
  href?: string;
  fullWidth?: boolean;
  compact?: boolean;
};

/** Presentational CTA; AttributionCapture owns click tracking and the paid survey. */
export default function LineContactButton({
  analyticsPosition,
  label = 'สอบถาม-ประเมินราคาฟรี',
  href = 'https://lin.ee/pPz1ZqN',
  fullWidth = false,
  compact = false,
}: LineContactButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-analytics-type="line"
      data-analytics-position={analyticsPosition}
      className={`inline-flex max-w-full min-w-0 items-center justify-center gap-2 rounded-[4px] bg-[#00802B] text-center font-bold text-white transition-colors hover:bg-[#006B24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00802B] focus-visible:ring-offset-2 ${compact ? 'min-h-11 px-3 py-2 text-xs' : 'min-h-12 px-5 py-3 text-sm'} ${fullWidth ? 'w-full' : ''}`}
    >
      <Image src="/images/line.png" alt="" aria-hidden="true" width={24} height={24} className="h-6 w-6 shrink-0" />
      <span>{label}</span>
    </a>
  );
}
