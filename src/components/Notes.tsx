"use client";

import { useEffect, useState } from "react";
import type { SharedNote } from "@/lib/types";
import { SITE } from "@/lib/config";
import type { Workspace } from "@/hooks/useWorkspace";
import { fmtDate } from "@/lib/format";
import { toast } from "@/lib/toast";
import { Button, Confirm, Modal, SectionHeading } from "./ui";
import { EnvelopeDoodle, DoodleStar } from "./doodles";

export function Notes({ ws }: { ws: Workspace }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SharedNote | null>(null);
  const [toDelete, setToDelete] = useState<SharedNote | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [surprise, setSurprise] = useState(false);
  const [revealAt, setRevealAt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!formOpen) return;
    setTitle(editing?.title ?? "");
    setContent(editing?.content ?? "");
    setSurprise(editing?.is_surprise ?? false);
    setRevealAt(editing?.reveal_at ? editing.reveal_at.slice(0, 10) : "");
  }, [formOpen, editing?.id]);

  const save = async () => {
    if (!title.trim()) {
      toast("Give the note a little title.", "error");
      return;
    }
    setSaving(true);
    const payload = {
      title: title.trim(),
      content: content.trim(),
      is_surprise: surprise,
      reveal_at: surprise && revealAt ? new Date(`${revealAt}T09:00:00`).toISOString() : null,
    };
    const ok = editing ? await ws.actions.updateNote(editing.id, payload) : await ws.actions.addNote(payload);
    setSaving(false);
    if (ok !== false) setFormOpen(false);
  };

  return (
    <section id="notes" className="relative mt-28 scroll-mt-24 bg-rose-soft/30 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading eyebrow="Between the pages" title={SITE.notesHeading} sub={SITE.notesSub} />

        <div className="mb-10 text-center">
          <Button variant="soft" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <EnvelopeDoodle className="h-4 w-6 text-terracotta" /> Write a little note
          </Button>
        </div>

        {ws.data.notes.length === 0 ? (
          <div className="mx-auto max-w-md rounded-[10px] border-2 border-dashed border-rose/70 bg-ivory/70 px-8 py-12 text-center">
            <EnvelopeDoodle className="mx-auto h-8 w-10 text-terracotta/70" />
            <p className="mt-4 font-serif text-2xl text-forest">No letters tucked in yet.</p>
            <p className="mt-2 text-sm text-ink-soft">
              Leave each other small things — a wish, a reminder, a tiny surprise sealed until the right day.
            </p>
          </div>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {ws.data.notes.map((n, i) => {
              const mineNote = n.created_by === ws.me?.id;
              return (
                <article key={n.id} className={`paper-card relative px-6 py-6 shadow-lift ${i % 2 ? "rotate-[0.7deg]" : "rotate-[-0.7deg]"}`}>
                  <span aria-hidden className="washi -top-2.5 left-8" />
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-serif text-xl font-semibold leading-snug text-forest">{n.title}</h3>
                    {n.is_surprise && <EnvelopeDoodle sealed className="h-6 w-8 shrink-0 text-ink-soft" />}
                  </div>
                  <p className="hand-note mt-3 min-h-12 whitespace-pre-wrap text-lg leading-snug text-ink">
                    {n.content || "…"}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-ink-faint">
                    <span>— {ws.authorOf(n.created_by)}, {fmtDate(n.created_at)}</span>
                    {n.is_surprise && n.reveal_at && <span>opens {fmtDate(n.reveal_at)}</span>}
                  </div>
                  {mineNote && (
                    <div className="mt-3 flex gap-2 border-t border-dashed border-ink/15 pt-3">
                      {n.is_surprise && (
                        <Button variant="ghost" size="sm" onClick={() => ws.actions.updateNote(n.id, { is_surprise: false, reveal_at: null })}>
                          Open it now
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(n); setFormOpen(true); }}>Edit</Button>
                      <Button variant="danger" size="sm" onClick={() => setToDelete(n)}>Remove</Button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <p className="mx-auto mt-10 max-w-md text-center text-[11px] leading-relaxed text-ink-faint">
          Sealed surprises stay hidden from your partner until the chosen day arrives, or until you open them early.
          Everything else here is readable by both of you — that's the point of a shared book.
        </p>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} labelledBy="note-title">
        <div className="p-7 md:p-8">
          <DoodleStar className="h-5 w-5 text-ochre" />
          <h3 id="note-title" className="mt-2 font-serif text-3xl font-semibold text-forest">A little note.</h3>
          <div className="mt-5 grid gap-4">
            <div>
              <label className="field-label" htmlFor="nt-title">Title *</label>
              <input id="nt-title" className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Something I want us to try…" maxLength={140} />
            </div>
            <div>
              <label className="field-label" htmlFor="nt-content">The note itself.</label>
              <textarea id="nt-content" className="field-input min-h-28" value={content} onChange={(e) => setContent(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={surprise} onChange={(e) => setSurprise(e.target.checked)} className="h-4 w-4 accent-terracotta" />
              Seal it as a surprise
            </label>
            {surprise && (
              <div>
                <label className="field-label" htmlFor="nt-reveal">Reveal it on (optional — you can also open it early)</label>
                <input id="nt-reveal" type="date" className="field-input" value={revealAt} onChange={(e) => setRevealAt(e.target.value)} />
              </div>
            )}
          </div>
          <div className="mt-7 flex justify-end gap-3">
            <Button variant="soft" onClick={() => setFormOpen(false)}>Maybe later</Button>
            <Button variant="accent" onClick={save} disabled={saving}>{saving ? "Folding…" : "Tuck it in"}</Button>
          </div>
        </div>
      </Modal>

      <Confirm
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Remove this note?"
        body={`“${toDelete?.title}” will be gone for both of us.`}
        confirmLabel="Remove note"
        onConfirm={() => toDelete && ws.actions.deleteNote(toDelete.id)}
      />
    </section>
  );
}
