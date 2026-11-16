import Image from 'next/image';

export function Avatar({ name, src, size = 'md' }: { name: string; src: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const classes = size === 'lg' ? 'h-16 w-16 text-xl' : size === 'sm' ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm';
  if (src) return <Image unoptimized width={64} height={64} src={src} alt="" className={`${classes} shrink-0 rounded-full bg-slate-100 object-cover`} />;
  return <span className={`${classes} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 font-semibold text-blue-700`}>{name.slice(0, 1).toUpperCase()}</span>;
}
