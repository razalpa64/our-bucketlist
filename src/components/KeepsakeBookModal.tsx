"use client";

import { useState } from "react";
import Image from "next/image";
import type { Dream } from "@/lib/types";
import { CATEGORY_ART } from "@/lib/config";
import type { Workspace } from "@/hooks/useWorkspace";
import { fmtDate } from "@/lib/format";
import { Button, Modal, SignedImg } from "./ui";
import { DoodleStar, DoodleHeart, FlowerDoodle, SunDoodle, MoonDoodle, Flourish, SprigLine } from "./doodles";

const DOODLE_MAP: Record<string, { label: string; component: React.ComponentType<{ className?: string }> }> = {
  flower: { label: "Flower", component: FlowerDoodle },
  star: { label: "Star", component: DoodleStar },
  heart: { label: "Heart", component: DoodleHeart },
  sun: { label: "Sun", component: SunDoodle },
  moon: { label: "Moon", component: MoonDoodle },
};

export function KeepsakeBookModal({
  open,
  onClose,
  ws,
}: {
  open: boolean;
  onClose: () => void;
  ws: Workspace;
}) {
  const completedDreams = ws.data.dreams.filter((d) => d.status === "completed");
  const [pageIndex, setPageIndex] = useState(0);

  const current = completedDreams[pageIndex];

  const handlePrint = () => {
    window.print();
  };

  const handleSelectDoodle = async (dreamId: string, doodleKey: string) => {
    await ws.actions.updateDreamDoodle(dreamId, doodleKey);
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} wide labelledBy="keepsake-book-title">
      <div className="p-6 md:p-8">
        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <FlowerDoodle className="h-7 w-7 text-terracotta" />
            <div>
              <h2 id="keepsake-book-title" className="font-serif text-2xl font-bold text-forest sm:text-3xl">
                The Book We Write Together
              </h2>
              <p className="text-xs text-ink-soft">
                Our illustrated keepsake album · {completedDreams.length} {completedDreams.length === 1 ? "page" : "pages"} written
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="accent" size="sm" onClick={handlePrint}>
              Print / save as PDF
            </Button>
            <Button variant="soft" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {completedDreams.length === 0 ? (
          <div className="py-16 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-sage-mist"><FlowerDoodle className="h-7 w-7 text-forest" /></span>
            <p className="mt-4 font-serif text-2xl text-forest">Our storybook pages are still waiting.</p>
            <p className="mt-2 text-sm text-ink-soft">
              When dreams are marked completed, their memories, actual photos, dates, and drawings become chapters in this keepsake.
            </p>
          </div>
        ) : (
          <div className="mt-6">
            {/* Storybook Single / Printable Page View */}
            <div className="print-keepsake-container mx-auto max-w-2xl rounded-lg border border-ink/15 bg-paper p-6 shadow-lift sm:p-9">
              {current && (
                <article className="space-y-6">
                  {/* Page Header */}
                  <div className="flex items-start justify-between border-b border-dashed border-ink/15 pb-4">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-terracotta-deep">
                        Memory Chapter · {fmtDate(current.completed_at)}
                      </span>
                      <h3 className="mt-1 font-serif text-3xl font-bold text-forest sm:text-4xl">
                        {current.title}
                      </h3>
                      {current.location_name && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
                          <span>📍</span> {current.location_name}
                        </p>
                      )}
                    </div>

                    {/* Stamped Doodle */}
                    <div className="text-right">
                      {(() => {
                        const DoodleComp = DOODLE_MAP[current.doodle ?? "flower"]?.component ?? FlowerDoodle;
                        return (
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ivory text-terracotta shadow-pin">
                            <DoodleComp className="h-7 w-7" />
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Photo or Illustration */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md border border-ink/20 shadow-paper">
                    {current.completion_image_path ? (
                      <SignedImg
                        path={current.completion_image_path}
                        alt={`Photo of ${current.title}`}
                        className="h-full w-full object-cover"
                      />
                    ) : current.image_path ? (
                      <SignedImg
                        path={current.image_path}
                        alt={`Illustration of ${current.title}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={CATEGORY_ART[ws.categoryOf(current)?.icon ?? "other"] ?? CATEGORY_ART.other}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>

                  {/* Handwritten Memory Words */}
                  <div className="rounded-md border border-dashed border-sage/60 bg-ivory/80 p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-sage">In our own words</p>
                    <p className="hand-note mt-2 text-2xl leading-relaxed text-ink">
                      {current.completion_note ? `“${current.completion_note}”` : "A beautiful dream turned into real life together."}
                    </p>
                  </div>

                  {/* Interactive Doodle Picker (Hidden in print) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-ink/15 pt-4 print:hidden">
                    <div className="flex items-center gap-2 text-xs text-ink-soft">
                      <span className="font-medium">Stamp a drawing:</span>
                      <div className="flex items-center gap-1.5">
                        {Object.entries(DOODLE_MAP).map(([key, item]) => {
                          const Icon = item.component;
                          const active = (current.doodle ?? "flower") === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleSelectDoodle(current.id, key)}
                              className={`rounded p-1.5 transition-all ${
                                active ? "bg-terracotta text-ivory shadow-sm" : "bg-paper text-ink-soft hover:bg-ivory"
                              }`}
                              title={item.label}
                            >
                              <Icon className="h-4 w-4" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <p className="text-[11px] text-ink-faint">
                      Dreamed by {ws.authorOf(current.created_by)} · Kept by Razal & Julian
                    </p>
                  </div>

                  <Flourish className="mx-auto h-4 w-32 text-sage/70" />
                </article>
              )}
            </div>

            {/* Pagination between storybook pages */}
            <div className="mt-6 flex items-center justify-between print:hidden">
              <Button
                variant="soft"
                size="sm"
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={pageIndex === 0}
              >
                ← Previous page
              </Button>

              <span className="text-xs text-ink-soft">
                Page {pageIndex + 1} of {completedDreams.length}
              </span>

              <Button
                variant="soft"
                size="sm"
                onClick={() => setPageIndex((p) => Math.min(completedDreams.length - 1, p + 1))}
                disabled={pageIndex === completedDreams.length - 1}
              >
                Next page →
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
