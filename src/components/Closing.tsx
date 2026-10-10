"use client";

import { SITE } from "@/lib/config";
import { Button } from "./ui";
import { DoodleStar, DoodleHeart } from "./doodles";

export function Closing({ onAdd, onSignOut }: { onAdd: () => void; onSignOut: () => void }) {
  return (
    <footer className="relative mt-28 overflow-hidden bg-forest pb-10 pt-20 text-paper">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70">
        <DoodleStar className="anim-twinkle absolute left-[12%] top-10 h-3 w-3 text-ochre" />
        <DoodleStar className="anim-twinkle absolute left-[30%] top-24 h-2.5 w-2.5 text-rose" style={{ animationDelay: "1.1s" }} />
        <DoodleStar className="anim-twinkle absolute right-[18%] top-14 h-4 w-4 text-ochre" style={{ animationDelay: "0.6s" }} />
        <DoodleStar className="anim-twinkle absolute right-[36%] top-32 h-2.5 w-2.5 text-sage-soft" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative mx-auto max-w-2xl px-6 text-center">
        <svg viewBox="0 0 220 40" className="mx-auto h-9 w-52 text-sage" aria-hidden>
          <path d="M8 30 C 60 6, 110 34, 160 12 S 200 10, 212 18" fill="none" stroke="currentColor" strokeWidth="1.5" className="route-draw" />
          <circle cx="8" cy="30" r="3" fill="#D9A9A0" />
          <circle cx="212" cy="18" r="3" fill="#C5A365" />
        </svg>

        <h2 className="mt-6 font-serif text-4xl font-semibold text-ivory md:text-5xl">{SITE.closingHeading}</h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-sage-soft">{SITE.closingSupport}</p>

        <Button variant="accent" className="mt-8" onClick={onAdd}>
          Add another dream
        </Button>

        <p className="hand-note mt-10 text-xl text-rose-soft">{SITE.footer}</p>
        <div className="mt-2 flex items-center justify-center gap-2 text-sage-soft">
          <DoodleHeart className="h-3 w-3 text-rose" />
          <p className="text-[11px]">{SITE.partnerLine} · India & the Philippines · {new Date().getFullYear()}</p>
          <DoodleHeart className="h-3 w-3 text-rose" />
        </div>
        <p className="mx-auto mt-6 max-w-sm text-[10px] leading-relaxed text-sage/70">{SITE.privacyNote}</p>
        <button onClick={onSignOut} className="mt-4 text-[11px] text-sage underline decoration-sage/50 underline-offset-4 hover:text-ivory">
          Close the book (sign out)
        </button>
      </div>
    </footer>
  );
}
