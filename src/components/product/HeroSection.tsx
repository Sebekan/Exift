"use client";

import Link from "next/link";
import { ArrowRight, Landmark, Plus } from "lucide-react";
import siteConfig from "@/data/site-config.json";

/**
 * Ana sayfa hero'su.
 *
 * Hareket tamamen CSS ile (blur'lu gradyan lekeler + giriş animasyonu) yapılır;
 * JavaScript animasyon döngüsü yoktur, bu yüzden ana iş parçacığını meşgul
 * etmez. `prefers-reduced-motion` globals.css'te tüm animasyonları durdurur.
 */
export function HeroSection() {
  return (
    <section className="relative mb-8 overflow-hidden rounded-3xl border border-border bg-[#4a1030] text-white shadow-hover">
      {/* Katman 1: taban gradyanı */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#5c1030] via-[#8a1745] to-[#d62162]" />

      {/* Katman 2: yavaşça süzülen renk lekeleri */}
      <div
        aria-hidden
        className="animate-drift-slow absolute -top-24 -left-16 h-[420px] w-[420px] rounded-full bg-[#ff5fa2]/35 blur-[110px]"
      />
      <div
        aria-hidden
        className="animate-drift-slower absolute -right-20 -bottom-32 h-[460px] w-[460px] rounded-full bg-[#ffbfe4]/30 blur-[120px]"
      />
      <div
        aria-hidden
        className="animate-drift-slow absolute top-1/3 left-1/2 h-[280px] w-[280px] rounded-full bg-[#ff8fc7]/20 blur-[100px]"
      />

      {/* Katman 3: ince ışıltı dokusu */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative grid grid-cols-1 gap-8 px-6 py-12 sm:px-10 sm:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-14 lg:py-16">
        <div className="animate-rise-in">

          <h1 className="mb-4 font-display text-[38px] leading-[1.05] font-bold tracking-[-1px] text-balance sm:text-[52px] lg:text-[60px]">
            Eski sevgilinden kalan o eşyayı
            <br />
            <span className="text-[#ffbfe4] italic">satışa çıkar.</span>
          </h1>

          <p className="mb-8 max-w-[54ch] text-[14.5px] leading-relaxed text-white/80 sm:text-[15.5px]">
            {siteConfig.hero.subtitle}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="#ilanlar"
              className="group inline-flex h-[54px] items-center justify-center gap-2 rounded-full bg-white px-8 font-heading text-[15px] font-bold text-[#5c1030] shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.24)] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#8a1745] focus-visible:outline-none motion-reduce:hover:translate-y-0"
            >
              İlanları Keşfet
              <ArrowRight
                size={17}
                className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                aria-hidden
              />
            </Link>

            <Link
              href="/ilan-ver"
              className="inline-flex h-[54px] items-center justify-center gap-2 rounded-full border-2 border-white/40 px-8 font-heading text-[15px] font-bold text-white backdrop-blur-sm transition-colors duration-200 hover:border-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <Plus size={17} aria-hidden />
              İlan Ver
            </Link>
          </div>
        </div>

        {/* Müze kartı — ürünün ayırt edici özelliğini hero'da tanıtır. */}
        <Link
          href="/muze"
          className="animate-rise-in group relative hidden overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-7 backdrop-blur-md transition-[transform,background-color] duration-300 hover:-translate-y-1 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none lg:block motion-reduce:hover:translate-y-0"
          style={{ animationDelay: "120ms" }}
        >
          <Landmark size={26} className="mb-4 text-[#ffbfe4]" aria-hidden />
          <h2 className="mb-2 font-display text-[26px] leading-tight font-bold italic">
            Exift Müzesi
          </h2>
          <p className="mb-5 text-[13.5px] leading-relaxed text-white/75">
            Satılan anılar burada arşivleniyor. Hikâyeler satılsa bile yaşamaya devam ediyor.
          </p>
          <span className="inline-flex items-center gap-1.5 font-heading text-[13px] font-bold text-[#ffbfe4]">
            Arşivi gez
            <ArrowRight
              size={15}
              className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
              aria-hidden
            />
          </span>
        </Link>
      </div>
    </section>
  );
}
