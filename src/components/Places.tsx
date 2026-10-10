"use client";

import { useEffect, useRef, useState } from "react";
import type { Place, PlaceStatus } from "@/lib/types";
import { PLACE_STATUS_META, POSTCARD_ART, SITE } from "@/lib/config";
import type { Workspace } from "@/hooks/useWorkspace";
import { fmtMonthYear } from "@/lib/format";
import { toast } from "@/lib/toast";
import { Button, Confirm, Modal, SectionHeading, SignedImg } from "./ui";
import { PinDoodle } from "./doodles";

function postcardFor(p: Place): string {
  let h = 0;
  for (const ch of p.id) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return POSTCARD_ART[h % POSTCARD_ART.length];
}

export function Places({ ws, onOpenDreamTitle }: { ws: Workspace; onOpenDreamTitle: (title: string) => void }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Place | null>(null);
  const [toDelete, setToDelete] = useState<Place | null>(null);

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [description, setDescription] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState<PlaceStatus>("dreaming");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!formOpen) return;
    setName(editing?.name ?? "");
    setCountry(editing?.country ?? "");
    setDescription(editing?.description ?? "");
    setMapUrl(editing?.map_url ?? "");
    setLat(editing?.latitude != null ? String(editing.latitude) : "");
    setLng(editing?.longitude != null ? String(editing.longitude) : "");
    setTargetDate(editing?.target_date ?? "");
    setStatus(editing?.status ?? "dreaming");
    setFile(null);
    setPreview(null);
  }, [formOpen, editing?.id]);

  const save = async () => {
    if (!name.trim()) {
      toast("A pin needs a place name.", "error");
      return;
    }
    setSaving(true);
    try {
      let imagePath: string | null | undefined = editing?.image_path;
      if (file) imagePath = await ws.uploadImage(file);
      const payload = {
        name: name.trim(),
        country: country.trim() || null,
        description: description.trim() || null,
        map_url: mapUrl.trim() || null,
        latitude: lat.trim() === "" ? null : Number(lat),
        longitude: lng.trim() === "" ? null : Number(lng),
        target_date: targetDate || null,
        status,
        image_path: imagePath ?? null,
      };
      if (editing) await ws.actions.updatePlace(editing.id, payload);
      else await ws.actions.addPlace(payload);
      setFormOpen(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Something went wrong.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="places" className="mx-auto max-w-6xl scroll-mt-24 px-6 pt-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-terracotta">Chapter three</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold text-forest md:text-5xl">{SITE.placesHeading}</h2>
          <p className="mt-3 max-w-xl text-[15px] text-ink-soft">{SITE.placesSub}</p>
        </div>
        <Button variant="soft" onClick={() => { setEditing(null); setFormOpen(true); }} className="mb-1">
          <PinDoodle className="h-4 w-4 text-terracotta" /> Add a pin
        </Button>
      </div>

      {ws.data.places.length === 0 ? (
        <div className="mt-12 rounded-[10px] border-2 border-dashed border-sage/70 bg-ivory/60 px-8 py-14 text-center">
          <PinDoodle className="mx-auto h-7 w-7 text-terracotta/70" />
          <p className="mt-4 font-serif text-2xl text-forest">The map is still blank.</p>
          <p className="mt-2 text-sm text-ink-soft">Pin the first place the two of us want to find together.</p>
        </div>
      ) : (
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {ws.data.places.map((p, i) => {
            const related = ws.data.dreams.filter((d) => d.location_name?.toLowerCase() === p.name.toLowerCase());
            return (
              <article key={p.id} className={`paper-card relative p-3 pb-5 shadow-lift transition-transform hover:-translate-y-1 ${i % 2 ? "rotate-[0.9deg]" : "rotate-[-0.8deg]"}`}>
                <span aria-hidden className="washi -top-2.5 right-6 rotate-6" />
                <div className="relative">
                  {p.image_path ? (
                    <SignedImg path={p.image_path} alt={`Postcard from ${p.name}`} className="h-40 w-full rounded-sm border border-ink/10 object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={postcardFor(p)} alt="" loading="lazy" className="h-40 w-full rounded-sm border border-ink/10 object-cover" />
                  )}
                  <span className="absolute right-2 top-2 -rotate-6 rounded-sm border-2 border-terracotta/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-terracotta-deep">
                    {PLACE_STATUS_META[p.status].label}
                  </span>
                </div>
                <div className="px-2 pt-4">
                  <h3 className="font-serif text-2xl font-semibold text-forest">{p.name}</h3>
                  {p.country && <p className="hand-note text-lg leading-none text-terracotta-deep">{p.country}</p>}
                  {p.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{p.description}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-faint">
                    {p.target_date && <span>someday around {fmtMonthYear(p.target_date)}</span>}
                    {p.map_url && (
                      <a href={p.map_url} target="_blank" rel="noopener noreferrer" className="underline decoration-sage underline-offset-4 hover:text-forest">
                        open map ↗
                      </a>
                    )}
                  </div>
                  {related.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {related.map((d) => (
                        <button key={d.id} onClick={() => onOpenDreamTitle(d.title)} className="rounded-full border border-sage/70 bg-sage-mist/70 px-2 py-0.5 text-[11px] text-forest hover:bg-sage-mist">
                          ✳ {d.title.length > 34 ? d.title.slice(0, 34) + "…" : d.title}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex justify-end gap-2 border-t border-dashed border-ink/15 pt-3">
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(p); setFormOpen(true); }}>Edit</Button>
                    <Button variant="danger" size="sm" onClick={() => setToDelete(p)}>Remove</Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} labelledBy="place-title" wide>
        <div className="p-7 md:p-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-terracotta">{editing ? "Move the pin" : "A new pin"}</p>
          <h3 id="place-title" className="mt-2 font-serif text-3xl font-semibold text-forest">Where are we going, love?</h3>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="pl-name">Place name *</label>
              <input id="pl-name" className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kyoto, Camiguin, the Alps…" maxLength={140} />
            </div>
            <div>
              <label className="field-label" htmlFor="pl-country">Country</label>
              <input id="pl-country" className="field-input" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="field-label" htmlFor="pl-why">Why we want to go there.</label>
              <textarea id="pl-why" className="field-input min-h-20" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="pl-status">How it's going</label>
              <select id="pl-status" className="field-input" value={status} onChange={(e) => setStatus(e.target.value as PlaceStatus)}>
                <option value="dreaming">Someday</option>
                <option value="planned">Planning</option>
                <option value="visited">Been together</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="pl-when">Optional target date</label>
              <input id="pl-when" type="date" className="field-input" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="pl-map">Map link, optional</label>
              <input id="pl-map" type="url" className="field-input" value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} placeholder="https://…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label" htmlFor="pl-lat">Latitude</label>
                <input id="pl-lat" type="number" step="any" className="field-input" value={lat} onChange={(e) => setLat(e.target.value)} />
              </div>
              <div>
                <label className="field-label" htmlFor="pl-lng">Longitude</label>
                <input id="pl-lng" type="number" step="any" className="field-input" value={lng} onChange={(e) => setLng(e.target.value)} />
              </div>
            </div>
            <div className="md:col-span-2">
              <span className="field-label">A postcard image, optional.</span>
              <div className="flex items-center gap-3">
                {preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Preview" className="h-16 w-20 rounded-md object-cover shadow-pin" />
                )}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" id="pl-file" onChange={(e) => { const f = e.target.files?.[0] ?? null; setFile(f); setPreview(f ? URL.createObjectURL(f) : null); }} />
                <Button type="button" variant="soft" size="sm" onClick={() => fileRef.current?.click()}>Choose image</Button>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <Button variant="soft" onClick={() => setFormOpen(false)}>Maybe later</Button>
            <Button variant="accent" onClick={save} disabled={saving}>{saving ? "Pinning…" : "Pin it to our map"}</Button>
          </div>
        </div>
      </Modal>

      <Confirm
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Remove this pin?"
        body={`“${toDelete?.name}” will be removed from our map for both of us.`}
        confirmLabel="Remove pin"
        onConfirm={() => toDelete && ws.actions.deletePlace(toDelete.id)}
      />
    </section>
  );
}
