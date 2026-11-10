import { cn } from '@/utils/cn';

/**
 * The storefront's default hero artwork (the same studio scene the home page shows when no cover
 * image is uploaded, or after it is removed). Images live in /public/hero.
 */
const SCENE = [
  { src: '/hero/scene-helicopter.webp', style: { left: '22%', top: '4%', width: '24%' } },
  { src: '/hero/scene-jimny.webp', style: { left: '20%', top: '46%', width: '22%' } },
  { src: '/hero/scene-excavator.webp', style: { right: '20%', top: '12%', width: '29%' } },
  { src: '/hero/scene-supra.webp', style: { left: '36%', bottom: '5%', width: '22%' } },
] as const;

export function DefaultCover({ className, badge = true }: { className?: string; badge?: boolean }) {
  return (
    <div className={cn('relative size-full overflow-hidden bg-[#f7f7f5]', className)} aria-label="Default cover image" role="img">
      <div className="absolute left-1/2 top-1/2 aspect-square h-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_30px_60px_-30px_rgb(17_17_17/0.3)]" />
      <div className="absolute left-1/2 top-1/2 aspect-square h-[175%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/[0.06]" />
      {SCENE.map((item) => (
        <img key={item.src} src={item.src} alt="" className="absolute h-auto" style={item.style} loading="lazy" />
      ))}
      {badge && (
        <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-semibold text-ink shadow-sm ring-1 ring-black/5">
          Default image
        </span>
      )}
    </div>
  );
}
