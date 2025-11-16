// app/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-[calc(100vh-56px)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(255,204,51,0.18),transparent_50%),radial-gradient(circle_at_70%_10%,rgba(0,88,230,0.35),transparent_55%),radial-gradient(circle_at_50%_80%,rgba(15,118,110,0.35),transparent_55%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:flex-row md:items-center md:py-16">
        <section className="order-2 w-full md:order-1 md:w-1/2">
          <div className="rounded-3xl border border-white/10 bg-black/60 p-4 shadow-[0_0_40px_rgba(15,23,42,0.8)] backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] text-emerald-300">
                نموذج لوحة تحكم حقيقية
              </span>
              <span className="text-[11px] text-white/40">
                بيانات افتراضية توضيحية
              </span>
            </div>
            <div className="mb-4 rounded-2xl border border-white/10 bg-gradient-to-br from-[#020617] via-[#020b18] to-black p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-white/50">نظرة سريعة على المزرعة</p>
                  <p className="text-sm font-semibold">مزرعة وادي مسار – عسير</p>
                </div>
                <span className="rounded-full bg-[#0058E6]/20 px-3 py-1 text-[11px] text-[#4BA3FF]">
                  جاهزة للتوسّع
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-black/60 border border-white/10 p-3 space-y-1">
                  <p className="text-[11px] text-white/60">استهلاك المياه</p>
                  <p className="text-xl font-semibold">32٪–</p>
                  <p className="text-[10px] text-emerald-300">
                    مقارنة بالموسم السابق
                  </p>
                </div>
                <div className="rounded-2xl bg-black/60 border border-white/10 p-3 space-y-1">
                  <p className="text-[11px] text-white/60">رطوبة التربة</p>
                  <p className="text-xl font-semibold">64٪</p>
                  <p className="text-[10px] text-emerald-300">
                    ضمن النطاق المثالي للمحصول
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/70" id="about">
              مسار تربط المزارع والحقول وبيانات الطقس والذكاء الاصطناعي في منصة
              واحدة تساعدك على اتخاذ قرار الري والتسميد ومتابعة صحة المحصول بلا
              تعقيد.
            </p>
          </div>

          <div className="mt-5 rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-xs leading-relaxed text-emerald-100">
            مع مسار، بيانات المزارعين الفعليين تتحول إلى خريطة ذكية توضح لك أفضل
            ما يُزرع في منطقتك ونمط استهلاك المياه في دائرة 100 كم حولك.
          </div>
        </section>

        <section className="order-1 w-full space-y-6 md:order-2 md:w-1/2">
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 md:h-16 md:w-16">
              <Image
                src="/assets/masar-logo.png"
                alt="Masar logo"
                fill
                className="object-contain drop-shadow-[0_0_20px_rgba(255,204,51,0.6)]"
              />
            </div>
            <div>
              <p className="text-[12px] text-emerald-300">
                منصة ذكية لإدارة الري والمزارع
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
                مسار
              </h1>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold leading-snug text-[#A5F3FC]">
              من صورة وحقل واحد،
              <br className="hidden md:block" />
              إلى خريطة ذكية لقطاعك الزراعي.
            </h2>
            <p className="text-sm text-white/70 leading-relaxed">
              سجّل مزرعتك، أضف الحقول، ارفع صور النباتات، ودع مسار يساعدك في
              تنظيم الري، فهم الأمراض، واكتشاف أفضل فرص الزراعة في منطقتك.
            </p>
          </div>

          {/* 🔥 الأزرار مع الزر الجديد هنا */}
          <div className="flex flex-wrap gap-3 text-sm" id="services">
            <Link
              href="/dashboard"
              className="rounded-2xl bg-[#0058E6] px-5 py-2.5 font-semibold text-white shadow-lg shadow-[#0058E6]/40 hover:bg-[#1D7AF3] transition"
            >
              دخول لوحة التحكم
            </Link>
            <Link
              href="/map"
              className="rounded-2xl border border-white/25 bg-white/5 px-5 py-2.5 text-white/90 hover:bg-white/10 transition"
            >
              استكشف الخريطة العامة
            </Link>
            <Link
              href="/assistant"
              className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-5 py-2.5 text-emerald-200 hover:bg-emerald-400/20 transition flex items-center gap-1"
            >
              🤖 المساعد الذكي
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
