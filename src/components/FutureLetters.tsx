"use client";

import { useState } from "react";
import type { FutureLetter } from "@/lib/types";
import type { Workspace } from "@/hooks/useWorkspace";
import { fmtDate } from "@/lib/format";
import { toast } from "@/lib/toast";
import { Button, Confirm, Modal, SectionHeading } from "./ui";
import { DoodleStar, DoodleHeart, EnvelopeDoodle } from "./doodles";

export function FutureLetters({ ws }: { ws: Workspace }) {
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<FutureLetter | null>(null);
  const [reading, setReading] = useState<FutureLetter | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [years, setYears] = useState<number>(1);
  const [customDate, setCustomDate] = useState("");
  const [saving, setSaving] = useState(false);

  const calculateRevealDate = (selectedYears: number) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + selectedYears);
    return d.toISOString();
  };

  const handleOpenForm = () => {
    setTitle("");
    setContent("");
    setYears(1);
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    setCustomDate(d.toISOString().slice(0, 10));
    setFormOpen(true);
  };

  const save = async () => {
    if (!title.trim()) {
      toast("Give your future letter a title.", "error");
      return;
    }
    if (!content.trim()) {
      toast("Write something for your future selves.", "error");
      return;
    }

    setSaving(true);
    const revealDate = years === 0 && customDate
      ? new Date(`${customDate}T09:00:00Z`).toISOString()
      : calculateRevealDate(years);

    const ok = await ws.actions.addFutureLetter({
      title: title.trim(),
      content: content.trim(),
      reveal_at: revealDate,
      delivery_years: years,
    });
    setSaving(false);
    if (ok !== false) setFormOpen(false);
  };

  const letters = ws.data.futureLetters;

  return (
    <section id="future-letters" className="wash-ochre relative mt-28 scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Time Capsule"
          title="Letters to our future selves"
          sub="Letters securely stored in our vault and sealed by real database rules until their day arrives."
        />

        <div className="mb-10 text-center">
          <Button variant="accent" onClick={handleOpenForm}>
            <DoodleStar className="h-4 w-4 text-ochre" /> Seal a letter to the future
          </Button>
        </div>

        {letters.length === 0 ? (
          <div className="mx-auto max-w-md rounded-[10px] border-2 border-dashed border-ochre/70 bg-ivory/80 px-8 py-12 text-center shadow-paper">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ochre-soft text-2xl">⏳</span>
            <p className="mt-4 font-serif text-2xl text-forest">No time capsules sealed yet.</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Write a letter to who you two will be one, three, or five years from today. The database physically protects sealed letters until their reveal date.
            </p>
          </div>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {letters.map((l, i) => {
              const isAuthor = l.created_by === ws.me?.id;
              const isRevealed = new Date(l.reveal_at).getTime() <= Date.now();
              const daysLeft = Math.ceil((new Date(l.reveal_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

              return (
                <article
                  key={l.id}
                  className={`paper-card relative px-6 py-6 shadow-lift transition-transform hover:-translate-y-0.5 ${
                    i % 2 ? "rotate-[0.6deg]" : "rotate-[-0.6deg]"
                  }`}
                >
                  <span aria-hidden className="washi -top-2.5 left-8" />
                  
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-serif text-xl font-semibold leading-snug text-forest">{l.title}</h3>
                    <span className="shrink-0" title={isRevealed ? "Unlocked" : "Sealed"}>
                      {isRevealed ? <DoodleStar className="h-5 w-5 text-ochre" /> : <EnvelopeDoodle sealed className="h-6 w-8 text-ink-soft" />}
                    </span>
                  </div>

                  {isRevealed ? (
                    <div className="mt-3">
                      <span className="inline-block rounded-full bg-sage-soft/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-forest-deep">
                        Unlocked & Revealed
                      </span>
                      <p className="hand-note mt-3 line-clamp-3 whitespace-pre-wrap text-lg leading-snug text-ink">
                        {l.content}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-md border border-dashed border-ochre/60 bg-paper/60 p-3.5">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-terracotta-deep">
                        <span className="h-2 w-2 rounded-full bg-terracotta animate-pulse" />
                        Sealed · {daysLeft > 0 ? `${daysLeft} days remaining` : "Opening soon"}
                      </div>
                      <p className="mt-2 text-xs text-ink-soft">
                        {isAuthor
                          ? "You are the author. Sealed from your partner at the database level until the date passes."
                          : "Sealed surprise for the future. Unlocks automatically when the reveal date arrives."}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between text-[11px] text-ink-faint">
                    <span>— by {ws.authorOf(l.created_by)}</span>
                    <span>opens {fmtDate(l.reveal_at)}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-dashed border-ink/15 pt-3">
                    <Button variant="ghost" size="sm" onClick={() => setReading(l)}>
                      {isRevealed || isAuthor ? "Read letter" : "View seal info"}
                    </Button>
                    {isAuthor && (
                      <Button variant="danger" size="sm" onClick={() => setToDelete(l)}>
                        Remove
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Write Letter Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} labelledBy="future-letter-title">
        <div className="p-7 md:p-8">
          <div className="flex items-center gap-2 text-ochre">
            <DoodleStar className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-widest text-ink-soft">Time Capsule Vault</span>
          </div>
          <h3 id="future-letter-title" className="mt-2 font-serif text-3xl font-semibold text-forest">
            A letter to our future selves.
          </h3>
          <p className="mt-1 text-xs text-ink-soft">
            Visibility rules are enforced in Supabase. Your partner cannot read this until the reveal date.
          </p>

          <div className="mt-5 grid gap-4">
            <div>
              <label className="field-label" htmlFor="fl-title">Title *</label>
              <input
                id="fl-title"
                className="field-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="To Razal & Julian on our milestone…"
                maxLength={140}
              />
            </div>

            <div>
              <label className="field-label">Reveal date / time capsule timeline</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "1 Year", val: 1 },
                  { label: "3 Years", val: 3 },
                  { label: "5 Years", val: 5 },
                  { label: "Custom", val: 0 },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setYears(opt.val)}
                    className={`rounded-md border py-2 text-xs font-medium transition-all ${
                      years === opt.val
                        ? "border-forest bg-forest text-ivory shadow-sm"
                        : "border-ink/20 bg-paper text-ink hover:border-sage"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {years === 0 && (
              <div>
                <label className="field-label" htmlFor="fl-custom-date">Choose custom unlock date</label>
                <input
                  id="fl-custom-date"
                  type="date"
                  className="field-input"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>
            )}

            <div>
              <label className="field-label" htmlFor="fl-content">The letter itself *</label>
              <textarea
                id="fl-content"
                className="field-input min-h-36 resize-y"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Dear future us, today we are dreaming of..."
              />
            </div>
          </div>

          <div className="mt-7 flex justify-end gap-3">
            <Button variant="soft" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="accent" onClick={save} disabled={saving}>
              {saving ? "Sealing into vault…" : "Seal with wax"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Read Letter Modal */}
      <Modal open={Boolean(reading)} onClose={() => setReading(null)} labelledBy="read-letter-title">
        {reading && (
          <div className="p-7 md:p-8">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{new Date(reading.reveal_at).getTime() <= Date.now() ? "📜" : "🔒"}</span>
              <span className="text-xs text-ink-faint">Opens {fmtDate(reading.reveal_at)}</span>
            </div>

            <h3 id="read-letter-title" className="mt-3 font-serif text-3xl font-semibold text-forest">
              {reading.title}
            </h3>
            <p className="text-xs text-ink-soft">Penned by {ws.authorOf(reading.created_by)} on {fmtDate(reading.created_at)}</p>

            {new Date(reading.reveal_at).getTime() <= Date.now() || reading.created_by === ws.me?.id ? (
              <div className="mt-6 rounded-md bg-paper/80 p-5 shadow-inner">
                <p className="hand-note whitespace-pre-wrap text-xl leading-relaxed text-ink">
                  {reading.content}
                </p>
              </div>
            ) : (
              <div className="mt-6 rounded-md border border-dashed border-terracotta/40 bg-rose-soft/40 p-6 text-center">
                <p className="font-serif text-xl text-terracotta-deep">Sealed in time</p>
                <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                  This letter was sealed for your future. The content is locked at the database level and will reveal on <strong>{fmtDate(reading.reveal_at)}</strong>.
                </p>
              </div>
            )}

            <div className="mt-7 flex justify-end">
              <Button variant="soft" onClick={() => setReading(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      <Confirm
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Remove this future letter?"
        body={`“${toDelete?.title}” will be removed from our time capsule.`}
        confirmLabel="Remove letter"
        onConfirm={() => toDelete && ws.actions.deleteFutureLetter(toDelete.id)}
      />
    </section>
  );
}
