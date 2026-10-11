"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Dream, Priority } from "@/lib/types";
import { CATEGORY_ART, PRIORITY_META } from "@/lib/config";
import type { Workspace } from "@/hooks/useWorkspace";
import { toast } from "@/lib/toast";
import { Button, Modal } from "./ui";
import { DoodleHeart, HeartOutline } from "./doodles";

export type DreamFormState = { open: boolean; editing: Dream | null };

export function DreamForm({ ws, state, onClose }: { ws: Workspace; state: DreamFormState; onClose: () => void }) {
  const editing = state.editing;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState<Priority>("whenever");
  const [locationName, setLocationName] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [tags, setTags] = useState("");
  const [privateNote, setPrivateNote] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state.open) return;
    setTitle(editing?.title ?? "");
    setDescription(editing?.description ?? "");
    setCategoryId(editing?.category_id ?? "");
    setPriority(editing?.priority ?? "whenever");
    setLocationName(editing?.location_name ?? "");
    setTargetDate(editing?.target_date ?? "");
    setTags((editing?.tags ?? []).join(", "));
    setPrivateNote(editing?.private_note ?? "");
    setFavorite(editing ? ws.myFavorite(editing.id) : false);
    setFile(null);
    setPreview(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.open, editing?.id]);

  const pickFile = (f: File | null) => {
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  };

  const save = async () => {
    if (!title.trim()) {
      toast("Every dream needs at least a title, love.", "error");
      return;
    }
    setSaving(true);
    try {
      let imagePath: string | null | undefined = editing?.image_path;
      if (file) imagePath = await ws.uploadImage(file);

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        category_id: categoryId || null,
        priority,
        location_name: locationName.trim() || null,
        target_date: targetDate || null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        private_note: privateNote.trim() || null,
        image_path: imagePath ?? null,
      };

      if (editing) {
        const ok = await ws.actions.updateDream(editing.id, payload);
        if (!ok) return;
        if (favorite !== ws.myFavorite(editing.id)) await ws.actions.toggleFavorite(editing.id);
        toast("The page was updated.", "success");
      } else {
        const created = await ws.actions.addDream(payload);
        if (!created) return;
        if (favorite) await ws.actions.toggleFavorite(created.id);
      }
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Something went wrong.", "error");
    } finally {
      setSaving(false);
    }
  };

  const catIcon = ws.data.categories.find((c) => c.id === categoryId)?.icon;

  return (
    <Modal open={state.open} onClose={onClose} labelledBy="dreamform-title" wide>
      <div className="p-7 md:p-9">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-terracotta">
          {editing ? "Rewrite this page" : "A new page"}
        </p>
        <h3 id="dreamform-title" className="mt-2 font-serif text-3xl font-semibold text-forest md:text-4xl">
          Let's dream of something.
        </h3>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="field-label" htmlFor="df-title">What should we do? *</label>
            <input id="df-title" className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Watch the sunrise from a rooftop…" maxLength={200} />
          </div>

          <div className="md:col-span-2">
            <label className="field-label" htmlFor="df-desc">Tell us a little about it.</label>
            <textarea id="df-desc" className="field-input min-h-20" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Why this, why together…" />
          </div>

          <div>
            <label className="field-label" htmlFor="df-cat">Choose a chapter.</label>
            <select id="df-cat" className="field-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">No chapter yet</option>
              {ws.data.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="field-label">How soon?</legend>
            <div className="flex gap-2">
              {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  aria-pressed={priority === p}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${priority === p ? "border-forest bg-forest text-ivory" : "border-ink/20 text-ink-soft hover:border-sage"}`}
                  title={PRIORITY_META[p].hint}
                >
                  {PRIORITY_META[p].label}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label className="field-label" htmlFor="df-place">Add a place, if applicable.</label>
            <input id="df-place" className="field-input" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="A beach town, her kitchen…" />
          </div>

          <div>
            <label className="field-label" htmlFor="df-date">Choose an optional date.</label>
            <input id="df-date" type="date" className="field-input" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>

          <div>
            <label className="field-label" htmlFor="df-tags">Little tags, comma separated.</label>
            <input id="df-tags" className="field-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="sea, slow morning" />
          </div>

          <div className="md:col-span-2">
            <label className="field-label" htmlFor="df-note">A private note, just for the two of us.</label>
            <textarea id="df-note" className="field-input min-h-16" value={privateNote} onChange={(e) => setPrivateNote(e.target.value)} placeholder="Only we will ever read this." />
          </div>

          <div className="md:col-span-2">
            <span className="field-label">An illustration or photograph, optional.</span>
            <div className="flex items-center gap-4">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview of your upload" className="h-20 w-24 rounded-md object-cover shadow-pin" />
              ) : editing?.image_path ? (
                <span className="text-xs text-ink-soft">Current image will be kept unless you pick a new one.</span>
              ) : catIcon ? (
                <Image src={CATEGORY_ART[catIcon] ?? CATEGORY_ART.other} alt="" width={96} height={80} className="h-20 w-24 rounded-md object-cover opacity-80" />
              ) : null}
              <div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" id="df-file" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
                <Button type="button" variant="soft" size="sm" onClick={() => fileRef.current?.click()}>
                  {preview || editing?.image_path ? "Choose another" : "Choose an image"}
                </Button>
                {preview && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => pickFile(null)}>
                    Remove
                  </Button>
                )}
                <p className="mt-1 text-[11px] text-ink-faint">JPG, PNG, WebP or GIF · under 4 MB · stored privately</p>
              </div>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft md:col-span-2">
            <button
              type="button"
              role="checkbox"
              aria-checked={favorite}
              onClick={() => setFavorite((f) => !f)}
              className="grid h-8 w-8 place-items-center rounded-full border border-ink/20 bg-ivory"
            >
              {favorite ? <DoodleHeart className="h-4 w-4 text-terracotta" /> : <HeartOutline className="h-4 w-4 text-ink-soft" />}
            </button>
            Mark as one of my favorites
          </label>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Button variant="soft" onClick={onClose}>Maybe later</Button>
          <Button variant="accent" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save our dream"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
