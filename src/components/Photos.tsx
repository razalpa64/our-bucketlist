"use client";

import { useRef, useState } from "react";
import type { MemoryPhoto } from "@/lib/types";
import type { Workspace } from "@/hooks/useWorkspace";
import { SITE } from "@/lib/config";
import { fmtDate, todayInputValue } from "@/lib/format";
import { Button, Confirm, Modal, SectionHeading, SignedImg } from "./ui";
import { DoodleHeart, DoodleStar, SprigLine } from "./doodles";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function Photos({ ws }: { ws: Workspace }) {
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<MemoryPhoto | null>(null);
  const [toDelete, setToDelete] = useState<MemoryPhoto | null>(null);
  const photos = ws.data.memoryPhotos;

  return (
    <section id="album" className="wash-rose relative mt-28 scroll-mt-24 py-24">
      <div className="relative mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Our little album"
          title={SITE.photosHeading}
          sub={SITE.photosSub}
        />

        <div className="mb-12 text-center">
          <Button variant="accent" onClick={() => setFormOpen(true)}>
            <DoodleHeart className="h-3.5 w-3.5" /> Add a photograph
          </Button>
        </div>

        {photos.length === 0 ? (
          <div className="paper-card-deep mx-auto max-w-lg px-8 py-12 text-center">
            <DoodleStar className="mx-auto h-6 w-6 text-ochre" />
            <p className="mt-4 font-serif text-3xl italic text-forest">Not a single picture yet.</p>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
              Add the photos you love most of us, the screenshots from our calls, the places we&apos;ve been in our hearts.
              Each one is kept privately, just for the two of you.
            </p>
            <SprigLine className="mx-auto mt-6 h-5 w-36 text-sage" />
          </div>
        ) : (
          <div className="columns-1 gap-7 sm:columns-2 lg:columns-3">
            {photos.map((p, i) => (
              <figure
                key={p.id}
                className={`mb-7 break-inside-avoid ${i % 3 === 1 ? "mt-4" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => setViewing(p)}
                  className={`picture-mat group block w-full text-left transition-transform duration-500 hover:-translate-y-1 ${
                    i % 2 ? "tilt-r" : "tilt-l"
                  }`}
                  aria-label={`Open photo${p.caption ? `: ${p.caption}` : ""}`}
                >
                  <div className="overflow-hidden rounded-[2px] bg-sage-mist">
                    <SignedImg
                      path={p.image_path}
                      alt={p.caption ?? "A photograph of us"}
                      className="block h-auto min-h-40 w-full transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                  </div>
                  <span className="block px-1 pt-3">
                    {p.caption && <span className="hand-note block text-[1.15rem] leading-snug text-ink">{p.caption}</span>}
                    <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-faint">
                      {p.taken_on ? fmtDate(p.taken_on) : fmtDate(p.created_at)} · {ws.authorOf(p.created_by)}
                    </span>
                  </span>
                </button>
              </figure>
            ))}
          </div>
        )}
      </div>

      {/* add a photograph */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} labelledBy="photo-form-title">
        <PhotoForm ws={ws} onDone={() => setFormOpen(false)} />
      </Modal>

      {/* lightbox */}
      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} labelledBy="photo-view-title" wide>
        {viewing && (
          <PhotoView
            ws={ws}
            photo={ws.data.memoryPhotos.find((p) => p.id === viewing.id) ?? viewing}
            onRemove={(p) => setToDelete(p)}
          />
        )}
      </Modal>

      <Confirm
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Take this photograph out of the album?"
        body="It will be removed for both of us. There's no undo."
        confirmLabel="Remove photo"
        onConfirm={() => {
          if (toDelete) {
            ws.actions.deletePhoto(toDelete);
            setViewing(null);
          }
        }}
      />
    </section>
  );
}

/* ------------------------------------------------------------- upload form */

function PhotoForm({ ws, onDone }: { ws: Workspace; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [takenOn, setTakenOn] = useState(todayInputValue());
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = (f: File | null) => {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const save = async () => {
    if (!file) return;
    setSaving(true);
    const ok = await ws.actions.addPhoto(file, {
      caption: caption.trim() || null,
      taken_on: takenOn || null,
    });
    setSaving(false);
    if (ok) onDone();
  };

  return (
    <div className="p-7 md:p-9">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-terracotta">A new print</p>
      <h3 id="photo-form-title" className="mt-2 font-serif text-3xl font-semibold text-forest md:text-4xl">
        Keep this moment.
      </h3>

      <div className="mt-7 grid gap-5 md:grid-cols-[1fr_1.1fr]">
        <div>
          <span className="field-label">The photograph</span>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="picture-mat group grid aspect-[4/3] w-full place-items-center overflow-hidden text-center"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Preview of the photograph" className="h-full w-full rounded-[2px] object-cover" />
            ) : (
              <span className="px-6 text-sm leading-relaxed text-ink-soft">
                <DoodleStar className="mx-auto mb-3 h-5 w-5 text-ochre" />
                Choose a photograph
                <span className="mt-1 block text-[11px] text-ink-faint">JPG, PNG, WebP or GIF · under 10 MB</span>
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            id="photo-file"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />
          {preview && (
            <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => pick(null)}>
              Choose a different one
            </Button>
          )}
        </div>

        <div className="grid content-start gap-5">
          <div>
            <label className="field-label" htmlFor="photo-caption">A little caption</label>
            <textarea
              id="photo-caption"
              className="field-input min-h-24"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={300}
              placeholder="The night we couldn't stop laughing…"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="photo-date">When was it taken?</label>
            <input id="photo-date" type="date" className="field-input" value={takenOn} onChange={(e) => setTakenOn(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <Button variant="soft" onClick={onDone}>Maybe later</Button>
        <Button variant="accent" onClick={save} disabled={saving || !file}>
          {saving ? "Developing…" : "Add to our album"}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- lightbox */

function PhotoView({
  ws,
  photo,
  onRemove,
}: {
  ws: Workspace;
  photo: MemoryPhoto;
  onRemove: (p: MemoryPhoto) => void;
}) {
  const mine = photo.created_by === ws.me?.id;
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [takenOn, setTakenOn] = useState(photo.taken_on ?? "");

  return (
    <div className="p-5 md:p-7">
      <div className="picture-mat p-3 md:p-4">
        <SignedImg
          path={photo.image_path}
          alt={photo.caption ?? "A photograph of us"}
          className="mx-auto block max-h-[68vh] w-auto max-w-full rounded-[2px] object-contain"
          eager
        />
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        {editing ? (
          <div className="grid w-full gap-3 md:max-w-xl">
            <textarea
              aria-label="Caption"
              className="field-input min-h-16"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={300}
            />
            <input
              aria-label="Date taken"
              type="date"
              className="field-input !w-auto"
              value={takenOn}
              onChange={(e) => setTakenOn(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="accent"
                size="sm"
                onClick={async () => {
                  const ok = await ws.actions.updatePhoto(photo.id, {
                    caption: caption.trim() || null,
                    taken_on: takenOn || null,
                  });
                  if (ok !== false) setEditing(false);
                }}
              >
                Save caption
              </Button>
              <Button variant="soft" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="min-w-0">
            {photo.caption ? (
              <p className="hand-note text-2xl leading-snug text-ink">{photo.caption}</p>
            ) : (
              <p className="hand-note text-xl text-ink-faint">no words yet — just the picture</p>
            )}
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-faint">
              {photo.taken_on ? `taken ${fmtDate(photo.taken_on)}` : `added ${fmtDate(photo.created_at)}`} · by {ws.authorOf(photo.created_by)}
            </p>
          </div>
        )}

        {mine && !editing && (
          <div className="flex gap-2">
            <Button
              variant="soft"
              size="sm"
              onClick={() => {
                setCaption(photo.caption ?? "");
                setTakenOn(photo.taken_on ?? "");
                setEditing(true);
              }}
            >
              Edit caption
            </Button>
            <Button variant="danger" size="sm" onClick={() => onRemove(photo)}>Remove</Button>
          </div>
        )}
      </div>
    </div>
  );
}
