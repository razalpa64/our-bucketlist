"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import type { Dream } from "@/lib/types";
import { CATEGORY_ART, PRIORITY_META, STATUS_META } from "@/lib/config";
import type { Workspace } from "@/hooks/useWorkspace";
import { fmtDate, todayInputValue } from "@/lib/format";
import { Button, Confirm, Modal, SignedImg } from "./ui";
import { DoodleHeart, DoodleStar, HeartOutline, SprigLine } from "./doodles";

/* ------------------------------------------------------------- celebration */

export function Celebration({ show }: { show: boolean }) {
  const reduce = useReducedMotion();
  const bits = Array.from({ length: 18 });
  return (
    <AnimatePresence>
      {show && !reduce && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[90] overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-hidden
        >
          {bits.map((_, i) => (
            <span
              key={i}
              className="absolute top-0"
              style={{
                left: `${(i * 53) % 100}%`,
                animation: `petal-fall ${2 + (i % 5) * 0.35}s linear ${(i % 7) * 0.18}s forwards`,
                opacity: 0,
              }}
            >
              {i % 3 === 0 ? (
                <DoodleStar className="h-4 w-4 text-ochre" />
              ) : i % 3 === 1 ? (
                <DoodleHeart className="h-3.5 w-3.5 text-rose" />
              ) : (
                <span className="block h-2.5 w-2.5 rounded-full bg-sage" />
              )}
            </span>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------- complete dialog */

export function CompleteDialog({
  ws,
  dream,
  onClose,
  onDone,
}: {
  ws: Workspace;
  dream: Dream | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [when, setWhen] = useState(todayInputValue());
  const [memory, setMemory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dream) {
      setWhen(todayInputValue());
      setMemory("");
      setFile(null);
      setPreview(null);
    }
  }, [dream?.id]);

  return (
    <Modal open={Boolean(dream)} onClose={onClose} labelledBy="complete-title">
      {dream && (
        <div className="p-7 md:p-8">
          <DoodleStar className="anim-star-pop h-7 w-7 text-ochre" />
          <h3 id="complete-title" className="mt-3 font-serif text-3xl font-semibold text-forest">
            We really did this one.
          </h3>
          <p className="mt-1 font-serif text-lg italic text-terracotta-deep">“{dream.title}”</p>
          <p className="mt-3 text-sm text-ink-soft">
            Tell the book a little about it — or don't. The memory is yours either way.
          </p>

          <div className="mt-6 grid gap-4">
            <div>
              <label className="field-label" htmlFor="cd-when">When did it happen?</label>
              <input id="cd-when" type="date" className="field-input" value={when} onChange={(e) => setWhen(e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="cd-memory">What would we like to remember?</label>
              <textarea id="cd-memory" className="field-input min-h-20" value={memory} onChange={(e) => setMemory(e.target.value)} placeholder="The way the light looked, what we laughed about…" />
            </div>
            <div>
              <span className="field-label">A photo, if we have one.</span>
              <div className="flex items-center gap-3">
                {preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Preview" className="h-16 w-20 rounded-md object-cover shadow-pin" />
                )}
                <input ref={fileRef} id="cd-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(e) => { const f = e.target.files?.[0] ?? null; setFile(f); setPreview(f ? URL.createObjectURL(f) : null); }} />
                <Button type="button" variant="soft" size="sm" onClick={() => fileRef.current?.click()}>Choose photo</Button>
              </div>
            </div>
          </div>

          <div className="mt-7 flex justify-end gap-3">
            <Button variant="soft" onClick={onClose}>Not yet</Button>
            <Button
              variant="accent"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  let path: string | null = null;
                  if (file) path = await ws.uploadImage(file);
                  const ok = await ws.actions.completeDream(dream.id, {
                    completed_at: new Date(`${when}T12:00:00`).toISOString(),
                    completion_note: memory.trim() || null,
                    completion_image_path: path,
                  });
                  if (ok) {
                    onClose();
                    onDone();
                  }
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Pressing the flower…" : "Mark it as done"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------- detail */

export function DreamDetail({
  ws,
  dream,
  onClose,
  onEdit,
  onComplete,
}: {
  ws: Workspace;
  dream: Dream | null;
  onClose: () => void;
  onEdit: (d: Dream) => void;
  onComplete: (d: Dream) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!dream) return null;
  const live = ws.data.dreams.find((d) => d.id === dream.id) ?? dream;
  const cat = ws.categoryOf(live);
  const art = live.image_path ? null : CATEGORY_ART[cat?.icon ?? "other"] ?? CATEGORY_ART.other;
  const favs = ws.favoritesOf(live.id);
  const mine = ws.myFavorite(live.id);
  const isFeatured = ws.data.relationship?.featured_item_id === live.id;

  return (
    <>
      <Modal open={Boolean(dream)} onClose={onClose} labelledBy="detail-title" wide>
        <div>
          <div className="relative">
            {live.image_path ? (
              <SignedImg path={live.image_path} alt={`Illustration for “${live.title}”`} className="h-60 w-full rounded-t-[8px] object-cover" eager />
            ) : art ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={art} alt="" className="h-52 w-full rounded-t-[8px] object-cover" />
            ) : null}
            <button
              onClick={() => ws.actions.toggleFavorite(live.id)}
              aria-pressed={mine}
              aria-label={mine ? "Remove from my favorites" : "Add to my favorites"}
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-ivory/95 shadow-pin transition-transform hover:scale-110"
            >
              {mine ? <DoodleHeart className="h-5 w-5 text-terracotta" /> : <HeartOutline className="h-5 w-5 text-ink-soft" />}
            </button>
          </div>

          <div className="p-7 md:p-9">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]">
              {cat && <span className="rounded-full bg-sage-mist px-2.5 py-1 text-forest">{cat.name}</span>}
              <span className="rounded-full bg-rose-soft px-2.5 py-1 text-terracotta-deep">{STATUS_META[live.status].label}</span>
              <span className="text-ink-faint">{PRIORITY_META[live.priority].label} · {PRIORITY_META[live.priority].hint}</span>
            </div>

            <h3 id="detail-title" className="mt-4 font-serif text-3xl font-semibold leading-tight text-forest md:text-4xl">
              {live.title}
            </h3>
            {live.description && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{live.description}</p>}

            <dl className="mt-6 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <div className="flex gap-2"><dt className="w-24 shrink-0 text-ink-faint">Dreamed by</dt><dd className="text-ink">{ws.authorOf(live.created_by)}, {fmtDate(live.created_at)}</dd></div>
              {live.target_date && <div className="flex gap-2"><dt className="w-24 shrink-0 text-ink-faint">Someday around</dt><dd className="text-ink">{fmtDate(live.target_date)}</dd></div>}
              {live.location_name && <div className="flex gap-2"><dt className="w-24 shrink-0 text-ink-faint">Where</dt><dd className="text-ink">{live.location_name}</dd></div>}
              {live.tags.length > 0 && (
                <div className="flex gap-2 sm:col-span-2"><dt className="w-24 shrink-0 text-ink-faint">Tags</dt><dd className="flex flex-wrap gap-1.5">{live.tags.map((t) => <span key={t} className="rounded-full border border-sage/60 px-2 py-0.5 text-xs text-forest">{t}</span>)}</dd></div>
              )}
              {favs.length > 0 && (
                <div className="flex gap-2 sm:col-span-2">
                  <dt className="w-24 shrink-0 text-ink-faint">Favorited by</dt>
                  <dd className="flex items-center gap-1.5 text-ink">
                    {favs.map((f) => (
                      <span key={f.user_id} className="flex items-center gap-1"><DoodleHeart className="h-3.5 w-3.5 text-terracotta" />{ws.authorOf(f.user_id)}</span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>

            {live.private_note && (
              <div className="hand-note mt-6 rotate-[-0.5deg] rounded-md border border-dashed border-ochre/60 bg-ochre-soft/40 px-5 py-4 text-lg leading-snug">
                {live.private_note}
                <span className="mt-1 block text-sm text-ink-faint">— just for us two</span>
              </div>
            )}

            {live.status === "completed" && (
              <div className="mt-6 rounded-lg border border-sage/60 bg-sage-mist/60 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-forest">Completed {fmtDate(live.completed_at)}</p>
                {live.completion_note && <p className="mt-2 font-serif text-lg italic text-forest-deep">“{live.completion_note}”</p>}
                {live.completion_image_path && (
                  <SignedImg path={live.completion_image_path} alt="A memory we kept" className="mt-3 h-40 w-52 rounded-md object-cover shadow-pin" />
                )}
              </div>
            )}

            <SprigLine className="mt-7 h-5 w-44 text-sage" />

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {live.status !== "completed" ? (
                <>
                  {live.status === "dreaming" && (
                    <Button variant="soft" size="sm" onClick={() => ws.actions.updateDream(live.id, { status: "planned" })}>
                      Mark as planned
                    </Button>
                  )}
                  <Button variant="accent" size="sm" onClick={() => onComplete(live)}>
                    <DoodleStar className="h-3.5 w-3.5" /> We did this one
                  </Button>
                </>
              ) : (
                <Button variant="soft" size="sm" onClick={() => ws.actions.reopenDream(live.id)}>
                  Reopen this dream
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => ws.actions.setFeatured(isFeatured ? null : live.id)}
                aria-pressed={isFeatured}
              >
                <DoodleStar className={`h-3.5 w-3.5 ${isFeatured ? "text-ochre" : "text-ink-faint"}`} />
                {isFeatured ? "Featured today" : "Feature for today"}
              </Button>
              <div className="ml-auto flex gap-2">
                <Button variant="soft" size="sm" onClick={() => onEdit(live)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>Tear out</Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Confirm
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Tear this page out?"
        body={`“${live.title}” will be gone from our book, for both of us. There's no undo.`}
        confirmLabel="Tear it out"
        onConfirm={() => {
          ws.actions.deleteDream(live.id);
          onClose();
        }}
      />
    </>
  );
}
