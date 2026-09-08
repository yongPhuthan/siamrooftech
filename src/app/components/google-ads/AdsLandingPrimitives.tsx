import { ArrowRight, ChatCircle } from '@phosphor-icons/react/dist/ssr';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import LineContactButton from '@/features/line-contact/LineContactButton';
import { LINE_CONTACT_URL } from '@/features/line-contact/constants';

type AdsTone = 'brand' | 'monochrome';

export type AdsLineCtaProps = {
  analyticsPosition: string;
  label: string;
  inverted?: boolean;
  tone?: AdsTone;
  fullWidth?: boolean;
};

export function AdsLineCta({
  analyticsPosition,
  label,
  inverted = false,
  tone = 'brand',
  fullWidth = false,
}: AdsLineCtaProps) {
  if (tone === 'monochrome') {
    return <LineContactButton analyticsPosition={analyticsPosition} label={label} fullWidth={fullWidth} />;
  }

  return (
    <a
      href={LINE_CONTACT_URL}
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
      <ChatCircle aria-hidden="true" className="h-5 w-5 shrink-0" />
      {label}
      <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
    </a>
  );
}

export type AdsSectionHeadingProps = {
  icon?: PhosphorIcon;
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
      {Icon ? <Icon aria-hidden="true" className={`mb-4 h-7 w-7 ${tone === 'monochrome' ? 'text-neutral-700' : inverted ? 'text-white' : 'text-[#004589]'}`} /> : null}
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
