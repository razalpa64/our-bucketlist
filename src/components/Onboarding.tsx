"use client";

import { useState } from "react";
import { STARTER_DREAMS } from "@/lib/config";
import type { Workspace } from "@/hooks/useWorkspace";
import { Button } from "./ui";
import { DoodleStar, SprigLine } from "./doodles";

export function Onboarding({ ws, onAdd }: { ws: Workspace; onAdd: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  const [seeding, setSeeding] = useState(false);
  if (dismissed || ws.data.dreams.length > 0) return null;

  return (
    <section className="mx-auto max-w-3xl px-6 pt-16">
      <div className="paper-card-deep relative px-8 py-10 text-center md:px-14">
        <span aria-hidden className="washi -top-2.5 left-1/2 -ml-10" />
        <DoodleStar className="anim-twinkle mx-auto h-6 w-6 text-ochre" />
        <h2 className="mt-4 font-serif text-3xl font-semibold text-forest md:text-4xl">Our book is open at the first page.</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
          Nothing is written yet — and that's the best part. Add the first little dream yourself, or begin with a few
          gentle ideas you can edit or tear out anytime.
        </p>
        <SprigLine className="mx-auto mt-5 h-5 w-40 text-sage" />
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button variant="accent" onClick={onAdd}>Add our first dream</Button>
          <Button
            variant="soft"
            disabled={seeding}
            onClick={async () => {
              setSeeding(true);
              await ws.actions.seedStarters(STARTER_DREAMS);
              setSeeding(false);
            }}
          >
            {seeding ? "Writing…" : "Start with a few ideas"}
          </Button>
        </div>
        <button className="mt-5 text-xs text-ink-faint underline decoration-sage underline-offset-4 hover:text-forest" onClick={() => setDismissed(true)}>
          we'll write it ourselves, slowly
        </button>
      </div>
    </section>
  );
}
