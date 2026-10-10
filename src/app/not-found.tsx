import Link from "next/link";
import { DoodleStar } from "@/components/doodles";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-6 text-center">
      <div>
        <DoodleStar className="anim-twinkle mx-auto h-8 w-8 text-ochre" />
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-terracotta">a page that isn't written</p>
        <h1 className="mt-3 font-serif text-5xl font-semibold text-forest">404</h1>
        <p className="mx-auto mt-3 max-w-xs text-sm text-ink-soft">
          This page doesn't exist in our little book. Let's go back to the story.
        </p>
        <Link href="/" className="mt-6 inline-block rounded-[6px_10px_7px_11px] bg-forest px-6 py-2.5 text-sm font-medium text-ivory shadow-paper hover:bg-forest-deep">
          Back to our list
        </Link>
      </div>
    </main>
  );
}
