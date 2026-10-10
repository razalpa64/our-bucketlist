"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { Dream } from "@/lib/types";
import { CATEGORY_ART, PRIORITY_META, SITE } from "@/lib/config";
import type { Workspace } from "@/hooks/useWorkspace";
import { timeAgo } from "@/lib/format";
import { Button, Chip, Modal, SignedImg } from "./ui";
import { DoodleStar, HeartOutline, DoodleHeart, SprigLine } from "./doodles";
import { CategoriesModal } from "./Categories";

type View = "all" | "favorites" | "planned" | "completed";

const PRIORITY_ORDER: Record<string, number> = { soon: 0, whenever: 1, someday: 2 };

export function Dreams({
  ws,
  onAdd,
  onOpen,
}: {
  ws: Workspace;
  onAdd: () => void;
  onOpen: (d: Dream) => void;
}) {
  const [view, setView] = useState<View>("all");
  const [cat, setCat] = useState<string>("");
  const [prio, setPrio] = useState<string>("");
  const [sort, setSort] = useState<string>("oldest");
  const [q, setQ] = useState("");
  const [surprise, setSurprise] = useState<Dream | null>(null);
  const [catsOpen, setCatsOpen] = useState(false);

  const { data } = ws;

  const filtered = useMemo(() => {
    let rows = data.dreams.slice();
    if (view === "completed") rows = rows.filter((d) => d.status === "completed");
    else rows = rows.filter((d) => d.status !== "completed");
    if (view === "favorites") rows = rows.filter((d) => ws.favoritesOf(d.id).length > 0);
    if (view === "planned") rows = rows.filter((d) => d.status === "planned");
    if (cat) rows = rows.filter((d) => d.category_id === cat);
    if (prio) rows = rows.filter((d) => d.priority === prio);
    const needle = q.trim().toLowerCase();
    if (needle)
      rows = rows.filter((d) =>
        [d.title, d.description ?? "", d.location_name ?? "", ...d.tags].join(" ").toLowerCase().includes(needle)
      );
    if (sort === "newest") rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (sort === "oldest") rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
    if (sort === "priority") rows.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    return rows;
  }, [data.dreams, view, cat, prio, q, sort, ws]);

  const featured = data.relationship?.featured_item_id
    ? data.dreams.find((d) => d.id === data.relationship!.featured_item_id && d.status !== "completed")
    : null;

  const surpriseMe = () => {
    const pool = data.dreams.filter((d) => d.status !== "completed");
    if (!pool.length) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setSurprise(pick);
  };

  const anyFilter = view !== "all" || cat || prio || q || sort !== "oldest";

  return (
    <section id="dreams" className="mx-auto max-w-6xl scroll-mt-24 px-6 pt-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="mb-0 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-terracotta">Chapter one</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold text-forest md:text-5xl">{SITE.dreamsHeading}</h2>
          <p className="mt-3 max-w-xl text-[15px] text-ink-soft">{SITE.dreamsSub}</p>
        </div>
        <Button variant="soft" onClick={surpriseMe} className="mb-1">
          <DoodleStar className="h-3.5 w-3.5 text-ochre" /> Surprise us
        </Button>
      </div>

      {/* featured dream of the day */}
      {featured && (
        <button
          onClick={() => onOpen(featured)}
          className="paper-card tilt-r group mt-10 flex w-full items-center gap-5 border-2 !border-ochre/70 px-6 py-5 text-left"
        >
          <DoodleStar className="anim-twinkle h-8 w-8 shrink-0 text-ochre" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-ochre">Today's featured dream</p>
            <p className="truncate font-serif text-2xl text-forest group-hover:text-terracotta-deep">{featured.title}</p>
          </div>
          <span className="hand-note ml-auto hidden shrink-0 text-base sm:block">← maybe this one?</span>
        </button>
      )}

      {/* controls */}
      <div className="mt-10 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["all", "All dreams"],
              ["favorites", "Favorites"],
              ["planned", "Planned"],
              ["completed", "Completed"],
            ] as [View, string][]
          ).map(([v, label]) => (
            <Chip key={v} active={view === v} onClick={() => setView(v)}>
              {label}
            </Chip>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <label className="sr-only" htmlFor="dream-search">Search our dreams</label>
            <input
              id="dream-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search our dreams…"
              className="field-input !w-44 !py-1.5 text-sm sm:!w-56"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-soft">
          <label className="flex items-center gap-1.5">
            <span className="uppercase tracking-wider">Chapter</span>
            <select value={cat} onChange={(e) => setCat(e.target.value)} className="field-input !w-auto !py-1 text-xs">
              <option value="">All</option>
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            <span className="uppercase tracking-wider">When</span>
            <select value={prio} onChange={(e) => setPrio(e.target.value)} className="field-input !w-auto !py-1 text-xs">
              <option value="">Any</option>
              <option value="soon">Soon</option>
              <option value="whenever">Whenever</option>
              <option value="someday">Someday</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            <span className="uppercase tracking-wider">Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="field-input !w-auto !py-1 text-xs">
              <option value="oldest">Old to new</option>
              <option value="newest">New to old</option>
              <option value="priority">By priority</option>
            </select>
          </label>
          {anyFilter && (
            <button
              className="underline decoration-sage underline-offset-4 hover:text-forest"
              onClick={() => {
                setView("all"); setCat(""); setPrio(""); setQ(""); setSort("oldest");
              }}
            >
              clear
            </button>
          )}
          <button className="ml-auto underline decoration-sage underline-offset-4 hover:text-forest" onClick={() => setCatsOpen(true)}>
            manage chapters
          </button>
        </div>
      </div>

      {/* the collection */}
      {filtered.length === 0 ? (
        <div className="mt-10 rounded-[10px] border-2 border-dashed border-sage/70 bg-ivory/60 px-8 py-14 text-center">
          <SprigLine className="mx-auto h-5 w-40 text-sage" />
          <p className="mt-4 font-serif text-2xl text-forest">
            {anyFilter ? "Nothing under this leaf…" : "The page is blank, for now."}
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            {anyFilter ? "Try loosening a filter or two." : "Every great book starts with a single line."}
          </p>
          {anyFilter ? (
            <Button variant="soft" size="sm" className="mt-5" onClick={() => { setView("all"); setCat(""); setPrio(""); setQ(""); }}>
              Clear filters
            </Button>
          ) : (
            <Button variant="accent" size="sm" className="mt-5" onClick={onAdd}>Add a little dream</Button>
          )}
        </div>
      ) : (
        <div className="mt-10 columns-1 gap-6 sm:columns-2 xl:columns-3">
          {filtered.map((d, i) => (
            <DreamCard key={d.id} d={d} i={i} ws={ws} onOpen={() => onOpen(d)} />
          ))}
        </div>
      )}

      <CategoriesModal ws={ws} open={catsOpen} onClose={() => setCatsOpen(false)} />

      {/* surprise overlay */}
      <Modal open={Boolean(surprise)} onClose={() => setSurprise(null)} labelledBy="surprise-title">
        {surprise && (
          <div className="relative p-8 text-center">
            <DoodleStar className="anim-star-pop mx-auto h-8 w-8 text-ochre" />
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-terracotta">The book points to…</p>
            <h3 id="surprise-title" className="mt-3 font-serif text-3xl font-semibold text-forest">{surprise.title}</h3>
            {surprise.description && <p className="mx-auto mt-3 max-w-sm text-sm text-ink-soft">{surprise.description}</p>}
            <p className="hand-note mt-4 text-lg">no pressure — just a little nudge ✳</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="soft" onClick={surpriseMe}>Pick another</Button>
              <Button
                variant="primary"
                onClick={async () => {
                  await ws.actions.updateDream(surprise.id, { status: "planned" });
                  setSurprise(null);
                }}
              >
                Let's plan this one
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

/* ------------------------------------------------------------------ card */

export function DreamCard({ d, i, ws, onOpen }: { d: Dream; i: number; ws: Workspace; onOpen: () => void }) {
  const cat = ws.categoryOf(d);
  const art = d.image_path ? null : CATEGORY_ART[cat?.icon ?? "other"] ?? CATEGORY_ART.other;
  const favs = ws.favoritesOf(d.id);
  const mine = ws.myFavorite(d.id);
  const partnerFav = favs.some((f) => f.user_id !== ws.me?.id);
  const variant = d.image_path ? "photo" : i % 4 === 0 ? "tall" : i % 4 === 2 ? "plain" : "std";

  return (
    <article
      className={`paper-card group relative mb-6 break-inside-avoid overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-lift ${i % 2 ? "tilt-r" : "tilt-l"}`}
    >
      <button onClick={onOpen} className="block w-full text-left" aria-label={`Open dream: ${d.title}`}>
        {d.image_path ? (
          <SignedImg path={d.image_path} alt={`Illustration for “${d.title}”`} className="h-44 w-full object-cover" />
        ) : variant === "tall" && art ? (
          <Image src={art} alt="" width={480} height={480} loading="lazy" className="h-52 w-full object-cover" />
        ) : variant === "std" && art ? (
          <Image src={art} alt="" width={480} height={480} loading="lazy" className="h-36 w-full object-cover" />
        ) : null}

        <div className="p-5">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]">
            {cat && <span className="rounded-full bg-sage-mist px-2 py-0.5 text-forest">{cat.name}</span>}
            <span className="text-ink-faint">{PRIORITY_META[d.priority]?.label}</span>
            {d.status === "planned" && (
              <span className="ml-auto -rotate-3 rounded-sm border border-ochre px-1.5 py-0.5 text-ochre">planned</span>
            )}
          </div>
          <h3 className="mt-2.5 font-serif text-[1.35rem] font-semibold leading-snug text-forest group-hover:text-terracotta-deep">
            {d.title}
          </h3>
          {d.description && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-soft">{d.description}</p>}
          {variant === "plain" && !d.description && (
            <p className="hand-note mt-1 text-base">a little something for us…</p>
          )}
          <div className="mt-4 flex items-center justify-between text-[11px] text-ink-faint">
            <span>
              added by <span className="text-ink-soft">{ws.authorOf(d.created_by)}</span> · {timeAgo(d.created_at)}
            </span>
            <span className="flex items-center gap-1" aria-label={`${favs.length} favorites`}>
              {mine && <DoodleHeart className="h-3.5 w-3.5 text-terracotta" />}
              {partnerFav && <DoodleHeart className="h-3.5 w-3.5 text-rose" />}
            </span>
          </div>
        </div>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          ws.actions.toggleFavorite(d.id);
        }}
        aria-pressed={mine}
        aria-label={mine ? "Remove from my favorites" : "Add to my favorites"}
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-ivory/90 shadow-pin transition-transform hover:scale-110"
      >
        {mine ? <DoodleHeart className="h-4.5 w-4.5 text-terracotta" /> : <HeartOutline className="h-4.5 w-4.5 text-ink-soft" />}
      </button>
    </article>
  );
}
