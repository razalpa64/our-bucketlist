"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase, isConfigured } from "@/lib/supabase";
import { SITE } from "@/lib/config";
import type { Dream } from "@/lib/types";
import { Hero } from "@/components/Hero";
import { Summary } from "@/components/Summary";
import { Dreams } from "@/components/Dreams";
import { DreamDetail, CompleteDialog, Celebration } from "@/components/DreamDetail";
import { DreamForm, type DreamFormState } from "@/components/DreamForm";
import { Done } from "@/components/Done";
import { Photos } from "@/components/Photos";
import { Songs } from "@/components/Songs";
import { CalendarSection } from "@/components/Calendar";
import { FutureLetters } from "@/components/FutureLetters";
import { Places } from "@/components/Places";
import { Notes } from "@/components/Notes";
import { Onboarding } from "@/components/Onboarding";
import { Closing } from "@/components/Closing";
import { Toasts, Button } from "@/components/ui";
import { DoodleStar } from "@/components/doodles";

export default function Home() {
  const ws = useWorkspace();
  const router = useRouter();
  const [form, setForm] = useState<DreamFormState>({ open: false, editing: null });
  const [detail, setDetail] = useState<Dream | null>(null);
  const [completing, setCompleting] = useState<Dream | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  if (!isConfigured) return <SetupScreen />;
  if (ws.fatal === "no-workspace")
    return (
      <CenterNote title="No shared space yet.">
        This account isn't part of a relationship workspace. Run the setup script or check with your partner.
      </CenterNote>
    );
  if (ws.fatal)
    return (
      <CenterNote title="The book wouldn't open.">
        {ws.fatal} — check your connection and refresh.
        <div className="mt-5"><Button variant="soft" onClick={() => ws.reload()}>Try again</Button></div>
      </CenterNote>
    );
  if (ws.loading) return <Loader />;

  const openAdd = () => setForm({ open: true, editing: null });

  return (
    <main className="min-h-screen">
      {/* top bar */}
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/85 backdrop-blur-sm print:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
          <a href="#top" className="font-serif text-xl font-semibold italic text-forest">
            Our Bucket List
          </a>
          <span className="hand-note hidden text-base text-ink-faint sm:block">· {SITE.partnerLine}</span>
          <nav className="ml-auto hidden items-center gap-4 text-xs font-medium tracking-wide text-ink-soft md:flex" aria-label="Chapters">
            <a className="hover:text-forest" href="#dreams">Dreams</a>
            <a className="hover:text-forest" href="#done">Keepsake</a>
            <a className="hover:text-forest" href="#album">Album</a>
            <a className="hover:text-forest" href="#songs">Songs</a>
            <a className="hover:text-forest" href="#calendar">Calendar</a>
            <a className="hover:text-forest" href="#future-letters">Time Capsule</a>
            <a className="hover:text-forest" href="#places">Places</a>
            <a className="hover:text-forest" href="#notes">Notes</a>
          </nav>
          <span
            className="ml-auto flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-faint md:ml-4"
            title={ws.connection === "live" ? "Live — changes sync between you two" : "Reconnecting…"}
          >
            <span className={`h-2 w-2 rounded-full ${ws.connection === "live" ? "bg-sage" : "bg-terracotta animate-pulse"}`} />
            {ws.connection === "live" ? "together, live" : "reconnecting"}
          </span>
          <Button variant="accent" size="sm" onClick={openAdd}>+ dream</Button>
        </div>
      </header>

      <div id="top" />
      <Hero onAdd={openAdd} />
      <Summary ws={ws} />
      <Onboarding ws={ws} onAdd={openAdd} />

      <Dreams ws={ws} onAdd={openAdd} onOpen={setDetail} />
      <Done ws={ws} onOpen={setDetail} />
      <Photos ws={ws} />
      <Songs ws={ws} />
      <CalendarSection ws={ws} />
      <FutureLetters ws={ws} />
      <Places
        ws={ws}
        onOpenDreamTitle={(title) => {
          const d = ws.data.dreams.find((x) => x.title === title);
          if (d) setDetail(d);
        }}
      />
      <Notes ws={ws} />
      <Closing
        onAdd={openAdd}
        onSignOut={async () => {
          await supabase().auth.signOut();
          router.push("/login");
          router.refresh();
        }}
      />

      {/* overlays */}
      <DreamForm ws={ws} state={form} onClose={() => setForm((f) => ({ ...f, open: false }))} />
      <DreamDetail
        ws={ws}
        dream={detail}
        onClose={() => setDetail(null)}
        onEdit={(d) => {
          setDetail(null);
          setForm({ open: true, editing: d });
        }}
        onComplete={(d) => {
          setDetail(null);
          setCompleting(d);
        }}
      />
      <CompleteDialog
        ws={ws}
        dream={completing}
        onClose={() => setCompleting(null)}
        onDone={() => {
          setCelebrate(true);
          setTimeout(() => setCelebrate(false), 2600);
        }}
      />
      <Celebration show={celebrate} />
      <Toasts />
    </main>
  );
}

function Loader() {
  return (
    <div className="grid min-h-screen place-items-center bg-paper">
      <div className="text-center">
        <DoodleStar className="anim-twinkle mx-auto h-8 w-8 text-ochre" />
        <p className="hand-note mt-4 text-2xl text-ink-soft">opening our book…</p>
      </div>
    </div>
  );
}

function CenterNote({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-6">
      <div className="paper-card-deep max-w-md p-9 text-center">
        <h1 className="font-serif text-3xl font-semibold text-forest">{title}</h1>
        <div className="mt-3 text-sm leading-relaxed text-ink-soft">{children}</div>
      </div>
    </div>
  );
}

function SetupScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-6">
      <div className="paper-card-deep max-w-lg p-9">
        <h1 className="font-serif text-3xl font-semibold text-forest">Connect the little world.</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Supabase environment variables are missing, so the book can't open yet. Create a{" "}
          <code className="rounded bg-sage-mist px-1">.env.local</code> file in the project root:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-md bg-forest-deep p-4 text-xs leading-relaxed text-sage-soft">
{`NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY`}
        </pre>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          Then apply <code className="rounded bg-sage-mist px-1">supabase/migrations/*.sql</code> in the Supabase SQL
          editor and run <code className="rounded bg-sage-mist px-1">node scripts/setup.mjs</code> once to create the
          two partner accounts and the shared workspace. Full steps live in README.md.
        </p>
      </div>
    </div>
  );
}
