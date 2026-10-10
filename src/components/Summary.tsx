"use client";

import type { Workspace } from "@/hooks/useWorkspace";
import { DoodleStar, DoodleHeart, MoonDoodle } from "./doodles";

export function Summary({ ws }: { ws: Workspace }) {
  const active = ws.data.dreams.filter((d) => d.status !== "completed");
  const done = ws.data.dreams.filter((d) => d.status === "completed");
  const planned = active.filter((d) => d.status === "planned");

  const stats = [
    { n: active.length, label: "dreams on our list", icon: <MoonDoodle className="h-5 w-5 text-forest" />, tilt: "tilt-l" },
    { n: done.length, label: "dreams we've completed", icon: <DoodleStar className="h-5 w-5 text-ochre" />, tilt: "tilt-r" },
    { n: planned.length, label: "little plans we're working toward", icon: <DoodleHeart className="h-5 w-5 text-terracotta" />, tilt: "tilt-l" },
  ];

  return (
    <section aria-label="Our list so far" className="relative z-10 mx-auto -mt-2 max-w-5xl px-6">
      <div className="grid gap-5 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className={`paper-card ${s.tilt} flex items-center gap-4 px-6 py-5`}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sage-mist">{s.icon}</span>
            <div>
              <p className="font-serif text-4xl font-semibold leading-none text-forest">{s.n}</p>
              <p className="mt-1 text-xs leading-snug text-ink-soft">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      {ws.data.dreams.length === 0 && (
        <p className="hand-note mt-4 text-center text-lg">…our first page is waiting for us.</p>
      )}
    </section>
  );
}
