import { ArrowRight, MessageCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import LineContactButton from '../LineContactButton';

const DEFAULT_LINE_URL = 'https://lin.ee/pPz1ZqN';

type AdsTone = 'brand' | 'monochrome';

export type AdsLineCtaProps = {
  analyticsPosition: string;
  label: string;
  inverted?: boolean;
  href?: string;
  tone?: AdsTone;
  fullWidth?: boolean;
};

export function AdsLineCta({
  analyticsPosition,
  label,
  inverted = false,
  href = DEFAULT_LINE_URL,
  tone = 'brand',
  fullWidth = false,
}: AdsLineCtaProps) {
  if (tone === 'monochrome') {
    return <LineContactButton analyticsPosition={analyticsPosition} label={label} href={href} fullWidth={fullWidth} />;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-analytics-type="line"
      data-analytics-position={analyticsPosition}
      className={`inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-center text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${fullWidth ? 'w-full' : ''} ${
        inverted
          ? 'rounded-md bg-white text-[#004589] hover:bg-blue-50 focus-visible:ring-white'
          : 'rounded-md bg-[#027DFF] text-white shadow-lg shadow-blue-600/20 hover:bg-[#006ee5] focus-visible:ring-[#027DFF]'
      }`}
    >
      <MessageCircle aria-hidden="true" className="h-5 w-5 shrink-0" />
      {label}
      <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
    </a>
  );
}

export type AdsSectionHeadingProps = {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  copy?: string;
  inverted?: boolean;
  tone?: AdsTone;
};

export function AdsSectionHeading({
  icon: Icon,
  eyebrow,
  title,
  copy,
  inverted = false,
  tone = 'brand',
}: AdsSectionHeadingProps) {
  return (
    <div className="max-w-3xl">
      {Icon ? <Icon aria-hidden="true" className={`mb-4 h-7 w-7 ${tone === 'monochrome' ? 'text-neutral-700' : inverted ? 'text-white' : 'text-[#004589]'}`} strokeWidth={1.8} /> : null}
      {eyebrow ? <p className={`text-sm tracking-wide ${tone === 'monochrome' ? 'font-semibold text-neutral-600' : inverted ? 'font-bold text-sky-300' : 'font-bold text-[#027DFF]'}`}>
        {eyebrow}
      </p> : null}
      <h2 className={`${eyebrow ? 'mt-3' : ''} text-3xl font-bold leading-tight sm:text-4xl ${tone === 'monochrome' ? 'text-neutral-900' : inverted ? 'text-white' : 'text-slate-950'}`}>
        {title}
      </h2>
      {copy ? (
        <p className={`mt-4 text-base leading-8 sm:text-lg ${tone === 'monochrome' ? 'text-neutral-600' : inverted ? 'text-slate-300' : 'text-slate-600'}`}>
          {copy}
        </p>
      ) : null}
    </div>
  );
}
