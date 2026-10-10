"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase, isConfigured } from "@/lib/supabase";
import { SITE } from "@/lib/config";
import { Button } from "@/components/ui";
import { DoodleStar, DoodleHeart } from "@/components/doodles";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase().auth.signInWithPassword({ email, password });
    if (error) {
      setError("That key doesn't fit this little door. Check the email and password.");
      setBusy(false);
      return;
    }
    router.push("/");
    router.refresh();
  };

  if (!isConfigured)
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <p className="paper-card max-w-md p-8 text-sm text-ink-soft">
          The app isn't connected to Supabase yet — see the setup notes on the home path.
        </p>
      </main>
    );

  return (
    <main className="relative min-h-screen overflow-hidden">
      <Image
        src="/art/hero-landscape.jpg"
        alt=""
        fill
        priority
        className="object-cover object-[center_40%] opacity-60"
        sizes="100vw"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-paper/70 via-paper/40 to-paper/90" />
      <DoodleStar className="anim-twinkle absolute left-[10%] top-[12%] h-4 w-4 text-ochre" />
      <DoodleStar className="anim-twinkle absolute right-[14%] top-[20%] h-3 w-3 text-terracotta" style={{ animationDelay: "1.3s" }} />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-14">
        <div className="grid w-full overflow-hidden rounded-[10px_16px_11px_17px] shadow-lift md:grid-cols-[1.05fr_1fr]">
          {/* left — the painted side */}
          <div className="relative hidden bg-forest p-10 md:block">
            <Image src="/art/hero-landscape.jpg" alt="A hand-painted landscape of two paths leading to one cottage" fill className="object-cover opacity-90" sizes="50vw" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-forest-deep/85 via-forest-deep/20 to-transparent" />
            <div className="relative flex h-full flex-col justify-end">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-rose">{SITE.eyebrow}</p>
              <p className="mt-3 font-serif text-3xl font-semibold leading-tight text-ivory">
                Two paths,
                <br />
                one cottage,
                <br />
                <em className="text-ochre">one list.</em>
              </p>
              <p className="hand-note mt-4 text-lg text-sage-soft">{SITE.heroAnnotation}</p>
            </div>
          </div>

          {/* right — the door */}
          <div className="bg-ivory/95 p-9 md:p-11">
            <div className="flex items-center gap-2">
              <DoodleHeart className="h-4 w-4 text-terracotta" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-terracotta">{SITE.partnerLine}</p>
            </div>
            <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-forest">{SITE.loginHeading}</h1>
            <p className="mt-2 text-sm text-ink-soft">{SITE.loginSupport}</p>

            <form onSubmit={submit} className="mt-8 grid gap-4">
              <div>
                <label className="field-label" htmlFor="login-email">Your email</label>
                <input id="login-email" type="email" required autoComplete="email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@ourlittleworld" />
              </div>
              <div>
                <label className="field-label" htmlFor="login-password">Your password</label>
                <input id="login-password" type="password" required autoComplete="current-password" className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              {error && (
                <p role="alert" className="rounded-md border border-terracotta/50 bg-rose-soft/60 px-3 py-2 text-xs text-terracotta-deep">
                  {error}
                </p>
              )}
              <Button type="submit" variant="accent" size="lg" disabled={busy} className="mt-1 w-full">
                {busy ? "Unlocking…" : "Open our book"}
              </Button>
            </form>

            <p className="mt-6 text-[11px] leading-relaxed text-ink-faint">
              This door only opens for the two of us. If you don't have an account, ask your partner — strangers can't
              wander into this garden.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
