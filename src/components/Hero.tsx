"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import { SITE } from "@/lib/config";
import { Button } from "./ui";
import { DoodleStar, DoodleHeart } from "./doodles";

export function Hero({ onAdd }: { onAdd: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const yArt = useTransform(scrollY, [0, 600], [0, reduce ? 0 : 70]);
  const yFlowers = useTransform(scrollY, [0, 600], [0, reduce ? 0 : -46]);
  const yCopy = useTransform(scrollY, [0, 600], [0, reduce ? 0 : 30]);

  return (
    <section ref={ref} className="relative overflow-hidden" aria-label="Welcome">
      {/* painted landscape — the real artwork is the canvas */}
      <motion.div style={{ y: yArt }} className="absolute inset-0">
        <Image
          src="/art/hero-landscape.jpg"
          alt="A hand-painted landscape: two winding paths crossing green hills toward a small cottage with a glowing window at sunset"
          fill
          priority
          className="object-cover object-[center_42%]"
          sizes="100vw"
        />
      </motion.div>

      {/* twinkling stars in the painted sky */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[46%]">
        <DoodleStar className="anim-twinkle absolute left-[12%] top-[16%] h-4 w-4 text-ochre" />
        <DoodleStar className="anim-twinkle absolute left-[38%] top-[8%] h-3 w-3 text-terracotta" style={{ animationDelay: "0.9s" }} />
        <DoodleStar className="anim-twinkle absolute left-[64%] top-[14%] h-5 w-5 text-ochre" style={{ animationDelay: "1.7s" }} />
        <DoodleStar className="anim-twinkle absolute left-[84%] top-[7%] h-3 w-3 text-rose" style={{ animationDelay: "2.4s" }} />
      </div>

      {/* drifting botanicals over the painting */}
      <motion.div style={{ y: yFlowers }} aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0">
        <Image src="/art/corner-flowers.png" alt="" width={560} height={300} className="absolute -left-6 bottom-[-14px] w-[46vw] max-w-[430px] opacity-95" />
        <Image src="/art/corner-flowers.png" alt="" width={560} height={300} className="absolute -right-8 bottom-[-18px] w-[42vw] max-w-[380px] -scale-x-100 opacity-90" />
        <Image src="/art/sprig-olive.png" alt="" width={220} height={160} className="anim-drift absolute right-[6%] top-[30%] hidden w-28 rotate-12 opacity-80 md:block" />
      </motion.div>

      {/* copy in the sky */}
      <motion.div style={{ y: yCopy }} className="relative mx-auto max-w-6xl px-6 pb-[46vw] pt-16 sm:pb-[34vw] md:pb-[26vw] md:pt-24">
        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7 }} className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.3em] text-terracotta-deep uppercase">
          <DoodleStar className="h-3 w-3 text-ochre" /> {SITE.eyebrow}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 font-serif text-6xl font-semibold leading-[0.95] text-forest-deep sm:text-7xl md:text-8xl"
        >
          Our <em className="text-terracotta-deep">Bucket</em>
          <br />
          List
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }} className="mt-5 max-w-md text-[15px] leading-relaxed text-ink/85 md:text-base">
          {SITE.heroSupport}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.68, duration: 0.7 }} className="mt-7 flex flex-wrap items-center gap-3">
          <Button variant="accent" size="lg" onClick={onAdd}>
            Add a little dream
          </Button>
          <Button
            variant="soft"
            size="lg"
            onClick={() => document.getElementById("dreams")?.scrollIntoView({ behavior: "smooth" })}
          >
            Explore our list
          </Button>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.05, duration: 1 }} className="hand-note mt-5 -rotate-2 text-lg">
          <span className="inline-block rounded-md bg-paper/80 px-2.5 py-0.5 shadow-pin backdrop-blur-[1px]">{SITE.heroAnnotation}</span>
        </motion.p>

        {/* two stamps, one route */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.8 }}
          className="mt-10 flex items-end gap-2 sm:gap-4"
          aria-label={`${SITE.partnerLine}, ${SITE.routeLine}`}
        >
          <figure className="stamp tilt-l relative p-1.5 pb-2">
            <Image src="/art/stamp-india.jpg" alt="Painted postage stamp with a marigold, from India" width={76} height={84} className="h-16 w-14 object-cover sm:h-20 sm:w-[70px]" />
            <figcaption className="hand-note mt-1 text-center text-sm leading-none">Razal</figcaption>
          </figure>

          <svg viewBox="0 0 160 44" className="mb-6 h-10 w-24 text-ivory drop-shadow-[0_1px_2px_rgba(38,56,44,0.6)] sm:w-36" aria-hidden>
            <path d="M4 34 C 40 8, 70 40, 96 18 S 140 8, 156 22" fill="none" stroke="currentColor" strokeWidth="2" className="route-draw" />
            <path d="M74 14 c 2.4 -3.4, 6 -3.2, 7.6 0 c 1.6 -3.2, 5.2 -3.4, 7.6 0 c 2.2 3.2, -1 6.2, -7.6 10 c -6.6 -3.8, -9.8 -6.8, -7.6 -10 Z" fill="#D9A9A0" />
          </svg>

          <figure className="stamp tilt-r relative p-1.5 pb-2">
            <Image src="/art/stamp-philippines.jpg" alt="Painted postage stamp with a sampaguita flower, from the Philippines" width={76} height={84} className="h-16 w-14 object-cover sm:h-20 sm:w-[70px]" />
            <figcaption className="hand-note mt-1 text-center text-sm leading-none">Julian</figcaption>
          </figure>
        </motion.div>
      </motion.div>

      {/* soft fade into the paper below */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-paper" />
      <div aria-hidden className="absolute bottom-4 left-1/2 -translate-x-1/2 text-ink-faint">
        <DoodleHeart className="anim-drift h-4 w-4 text-terracotta/70" />
      </div>
    </section>
  );
}
