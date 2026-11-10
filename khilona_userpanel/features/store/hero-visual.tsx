"use client";

import Image from "next/image";
import { useState } from "react";
import { resolveImageUrl } from "@/lib/images";
import { SmartImage } from "@/components/ui/smart-image";
import { cn } from "@/utils/cn";

/**
 * Art-directed scene of brand imagery: transparent cut-outs in /public/hero, made from the store's
 * own product photography. It is deliberately independent of the catalogue — no product links,
 * names or prices — so the hero looks the same with 0 or 500 products listed. Items are drawn back
 * to front; positions are percentages of a square stage.
 */
const SCENE = [
  { src: "/hero/scene-helicopter.webp", w: 800, h: 622, style: { left: "3%", top: "5%", width: "46%" }, float: true, fadeRight: true },
  { src: "/hero/scene-jimny.webp", w: 722, h: 464, style: { left: "0%", top: "45%", width: "42%" }, shadow: true },
  { src: "/hero/scene-excavator.webp", w: 912, h: 921, style: { right: "1%", top: "15%", width: "55%" }, shadow: true },
  { src: "/hero/scene-supra.webp", w: 502, h: 239, style: { left: "30%", bottom: "5%", width: "42%" }, shadow: true },
] as const;

function Scene() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[40rem]" aria-hidden="true">
      {/* studio pedestal: a soft white disc and two hairline rings */}
      <div className="absolute left-1/2 top-1/2 aspect-square w-[84%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_50px_100px_-50px_rgb(17_17_17/0.3)]" />
      <div className="absolute left-1/2 top-1/2 aspect-square w-[98%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/[0.06]" />
      <div className="absolute left-1/2 top-1/2 aspect-square w-[112%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-black/[0.05]" />
      {SCENE.map((item, i) => (
        <div
          key={item.src}
          className={cn("absolute animate-rise", "float" in item && item.float && "lg:animate-float")}
          style={{ ...item.style, animationDelay: `${180 + i * 90}ms` }}
        >
          {/* contact shadow grounding the item on the stage */}
          {"shadow" in item && item.shadow && <span className="absolute inset-x-[14%] -bottom-[1%] h-[10%] rounded-[50%] bg-black/15 blur-xl" />}
          <Image
            src={item.src}
            alt=""
            width={item.w}
            height={item.h}
            priority={i < 2}
            sizes="(min-width: 1024px) 22rem, 50vw"
            className={cn("relative h-auto w-full", "fadeRight" in item && item.fadeRight && "[mask-image:linear-gradient(90deg,#000_82%,transparent)]")}
          />
        </div>
      ))}
    </div>
  );
}

/** The store's own cover photo (Admin → Store settings), when one is uploaded. */
function CoverPhoto({ src, alt, onFail }: { src: string; alt: string; onFail: () => void }) {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-[0_40px_80px_-40px_rgb(17_17_17/0.35)] sm:aspect-[5/4] lg:aspect-[4/5]">
      <SmartImage src={src} alt={alt} fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" onError={onFail} />
    </div>
  );
}

/**
 * The hero visual: the store's own cover photo when one is set (Admin → Store settings), otherwise
 * — or when the photo is removed or cannot be loaded — the default studio scene.
 */
export function HeroVisual({ coverUrl, alt }: { coverUrl: string | null; alt: string }) {
  const src = resolveImageUrl(coverUrl);
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) return <Scene />;
  return <CoverPhoto key={src} src={src} alt={alt} onFail={() => setFailed(src)} />;
}
