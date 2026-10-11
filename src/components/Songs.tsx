"use client";

import { useState } from "react";
import type { FavoriteSong } from "@/lib/types";
import type { Workspace } from "@/hooks/useWorkspace";
import { SITE } from "@/lib/config";
import { toast } from "@/lib/toast";
import { Button, Confirm, Modal, SectionHeading } from "./ui";
import { DoodleHeart, NoteDoodle, SprigLine } from "./doodles";

/** Only plain web links are allowed — keeps the list safe to click. */
function cleanLink(raw: string): string | null | undefined {
  const v = raw.trim();
  if (!v) return null;
  try {
    const u = new URL(v.startsWith("http") ? v : `https://${v}`);
    if (u.protocol !== "https:" && u.protocol !== "http:") return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}

export function Songs({ ws }: { ws: Workspace }) {
  const songs = ws.data.favoriteSongs;
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FavoriteSong | null>(null);
  const [toDelete, setToDelete] = useState<FavoriteSong | null>(null);
  const [formKey, setFormKey] = useState(0);

  const openForm = (song: FavoriteSong | null) => {
    setEditing(song);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  return (
    <section id="songs" className="wash-sage relative mt-28 scroll-mt-24 py-24">
      <div className="relative mx-auto max-w-4xl px-6">
        <SectionHeading eyebrow="The soundtrack of us" title={SITE.songsHeading} sub={SITE.songsSub} />

        <div className="mb-12 text-center">
          <Button variant="accent" onClick={() => openForm(null)}>
            <NoteDoodle className="h-4 w-4" /> Add a song
          </Button>
        </div>

        {songs.length === 0 ? (
          <div className="paper-card-deep mx-auto max-w-lg px-8 py-12 text-center">
            <NoteDoodle className="mx-auto h-7 w-7 text-terracotta" />
            <p className="mt-4 font-serif text-3xl italic text-forest">The playlist is still quiet.</p>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
              Every song that makes you think of the other one belongs here. Add the first one and tell the other why.
            </p>
            <SprigLine className="mx-auto mt-6 h-5 w-36 text-sage" />
          </div>
        ) : (
          <div className="songbook relative px-6 py-10 md:px-14 md:py-14">
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-ochre">Our favourites</p>
              <p className="mt-2 font-serif text-2xl italic text-forest">
                {songs.length} {songs.length === 1 ? "song" : "songs"} we keep coming back to
              </p>
              <SprigLine className="mx-auto mt-4 h-4 w-32 text-sage" />
            </div>

            <ol className="songlist mt-10">
              {songs.map((s, i) => {
                const mine = s.created_by === ws.me?.id;
                return (
                  <li key={s.id} className="group grid grid-cols-[2.5rem_1fr] gap-x-3 py-6 md:grid-cols-[3.5rem_1fr] md:gap-x-5">
                    <span className="pt-1 text-right font-serif text-3xl italic leading-none text-terracotta/80 md:text-4xl" aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="font-serif text-2xl font-semibold leading-tight text-forest md:text-[1.7rem]">{s.title}</h3>
                        {s.artist && <span className="text-sm text-ink-soft">— {s.artist}</span>}
                      </div>

                      {s.note && <p className="hand-note mt-2 text-[1.2rem] leading-snug text-ink">“{s.note}”</p>}

                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-ink-faint">
                        <span className="flex items-center gap-1.5">
                          <DoodleHeart className={`h-3 w-3 ${mine ? "text-terracotta" : "text-rose"}`} />
                          picked by {ws.authorOf(s.created_by)}
                        </span>
                        {s.link && (
                          <a
                            href={s.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium uppercase tracking-[0.18em] text-forest underline decoration-sage underline-offset-4 hover:text-terracotta-deep"
                          >
                            listen ↗
                          </a>
                        )}
                        {mine && (
                          <span className="ml-auto flex gap-3 opacity-80 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                            <button type="button" className="underline decoration-sage underline-offset-4 hover:text-forest" onClick={() => openForm(s)}>
                              edit
                            </button>
                            <button type="button" className="underline decoration-sage underline-offset-4 hover:text-terracotta-deep" onClick={() => setToDelete(s)}>
                              remove
                            </button>
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>

      <SongForm
        key={formKey}
        ws={ws}
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
      />

      <Confirm
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Take this song off our list?"
        body={`“${toDelete?.title ?? ""}” will be removed for both of us.`}
        confirmLabel="Remove song"
        onConfirm={() => toDelete && ws.actions.deleteSong(toDelete.id)}
      />
    </section>
  );
}

function SongForm({
  ws,
  open,
  editing,
  onClose,
}: {
  ws: Workspace;
  open: boolean;
  editing: FavoriteSong | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [artist, setArtist] = useState(editing?.artist ?? "");
  const [link, setLink] = useState(editing?.link ?? "");
  const [note, setNote] = useState(editing?.note ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) {
      toast("Every song needs a title, love.", "error");
      return;
    }
    const url = cleanLink(link);
    if (url === undefined) {
      toast("That link doesn't look right — try a full web address.", "error");
      return;
    }
    const payload = {
      title: title.trim(),
      artist: artist.trim() || null,
      link: url,
      note: note.trim() || null,
    };
    setSaving(true);
    const ok = editing ? await ws.actions.updateSong(editing.id, payload) : await ws.actions.addSong(payload);
    setSaving(false);
    if (ok !== false) onClose();
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="song-form-title">
      <div className="p-7 md:p-9">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-terracotta">
          {editing ? "Retune this one" : "A new song for our list"}
        </p>
        <h3 id="song-form-title" className="mt-2 font-serif text-3xl font-semibold text-forest md:text-4xl">
          What are you playing for me?
        </h3>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="field-label" htmlFor="song-title">Song title *</label>
            <input id="song-title" className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Something soft, something slow…" />
          </div>
          <div>
            <label className="field-label" htmlFor="song-artist">Artist</label>
            <input id="song-artist" className="field-input" value={artist} onChange={(e) => setArtist(e.target.value)} maxLength={200} />
          </div>
          <div>
            <label className="field-label" htmlFor="song-link">A link to listen, optional</label>
            <input id="song-link" type="url" className="field-input" value={link} onChange={(e) => setLink(e.target.value)} maxLength={500} placeholder="https://…" />
          </div>
          <div className="md:col-span-2">
            <label className="field-label" htmlFor="song-note">Why this one?</label>
            <textarea
              id="song-note"
              className="field-input min-h-20"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder="It reminds me of the rooftop, the rain, your laugh…"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Button variant="soft" onClick={onClose}>Maybe later</Button>
          <Button variant="accent" onClick={save} disabled={saving}>
            {saving ? "Tuning…" : editing ? "Save the song" : "Add to our list"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
