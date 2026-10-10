"use client";

import Image from "next/image";
import type { Dream } from "@/lib/types";
import { CATEGORY_ART, SITE } from "@/lib/config";
import type { Workspace } from "@/hooks/useWorkspace";
import { fmtDate } from "@/lib/format";
import { SectionHeading, SignedImg } from "./ui";
import { DoodleStar } from "./doodles";

export function Done({ ws, onOpen }: { ws: Workspace; onOpen: (d: Dream) => void }) {
  const done = ws.data.dreams.filter((d) => d.status === "completed");

  return (
    <section id="done" className="relative mt-28 scroll-mt-24 bg-sage-mist/50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading eyebrow="Chapter two" title={SITE.doneHeading} sub={SITE.doneSub} />

        {done.length === 0 ? (
          <div className="mx-auto max-w-md rounded-[10px] border-2 border-dashed border-sage/70 bg-ivory/70 px-8 py-12 text-center">
            <DoodleStar className="mx-auto h-6 w-6 text-ochre" />
            <p className="mt-4 font-serif text-2xl text-forest">No pressed flowers yet.</p>
            <p className="mt-2 text-sm text-ink-soft">
              When a dream makes it into real life, it moves here — kept forever like a flower pressed in a book.
            </p>
          </div>
        ) : (
          <div className="columns-1 gap-7 sm:columns-2 lg:columns-3">
            {done.map((d, i) => {
              const cat = ws.categoryOf(d);
              return (
                <article key={d.id} className={`paper-card relative mb-7 break-inside-avoid p-4 pb-5 shadow-lift ${i % 2 ? "rotate-[0.8deg]" : "rotate-[-0.9deg]"}`}>
                  <span aria-hidden className="washi -top-2.5 left-1/2 -ml-10" />
                  <button onClick={() => onOpen(d)} className="block w-full text-left" aria-label={`Open memory: ${d.title}`}>
                    {d.completion_image_path ? (
                      <SignedImg path={d.completion_image_path} alt={`Memory of “${d.title}”`} className="h-44 w-full rounded-sm object-cover" />
                    ) : d.image_path ? (
                      <SignedImg path={d.image_path} alt={`Illustration for “${d.title}”`} className="h-36 w-full rounded-sm object-cover" />
                    ) : (
                      <Image
                        src={CATEGORY_ART[cat?.icon ?? "other"] ?? CATEGORY_ART.other}
                        alt=""
                        width={480}
                        height={360}
                        loading="lazy"
                        className="h-36 w-full rounded-sm object-cover"
                      />
                    )}
                    <div className="px-1.5 pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ochre">
                        done · {fmtDate(d.completed_at)}
                      </p>
                      <h3 className="mt-1 font-serif text-xl font-semibold leading-snug text-forest">{d.title}</h3>
                      {d.completion_note && (
                        <p className="hand-note mt-2 line-clamp-3 text-base leading-snug">“{d.completion_note}”</p>
                      )}
                      <p className="mt-3 text-[11px] text-ink-faint">
                        dreamed by {ws.authorOf(d.created_by)} · kept by both of us
                      </p>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
