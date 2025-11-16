"use client";

import Link from "next/link";
import { consultants } from "../../lib/mockData";

export default function ConsultantsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#050814] via-[#02040b] to-black text-white">
      <div className="mx-auto max-w-6xl px-4 pt-24 pb-16 space-y-8">
        <section className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            ربط مع مستشار زراعي
          </h1>
          <p className="text-sm text-white/70 max-w-3xl">
            اختر مستشارك بناءً على خبرته، المنطقة التي يغطيها، ونوع الخدمة (استشارة عن
            بعد أو زيارة ميدانية). الأسعار والخيارات هنا تجريبية ويمكن تعديلها لاحقًا.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {consultants.map((c) => (
            <div
              key={c.id}
              className="rounded-3xl bg-black/60 border border-white/10 p-5 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-lg">
                  🌿
                </div>
                <div>
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-[11px] text-white/60">
                    {c.experienceYears}+ سنوات خبرة • {c.region}
                  </p>
                </div>
              </div>

              <p className="text-xs text-white/70">{c.bio}</p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-black/50 border border-white/10 p-3">
                  <p className="text-[11px] text-white/60 mb-1">استشارة عن بعد</p>
                  <p className="font-semibold mb-1">
                    {c.remotePrice} ريال / 30 دقيقة
                  </p>
                  <p className="text-[11px] text-white/50">
                    عبر مكالمة مرئية أو صوتية، مع تقرير مختصر.
                  </p>
                </div>
                <div className="rounded-2xl bg-black/50 border border-white/10 p-3">
                  <p className="text-[11px] text-white/60 mb-1">زيارة ميدانية</p>
                  <p className="font-semibold mb-1">
                    {c.onSitePrice} ريال للزيارة
                  </p>
                  <p className="text-[11px] text-white/50">
                    تشمل فحصًا ميدانيًا وتقويمًا مكتوبًا (حسب اتفاقك معه).
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] text-white/60">
                {c.services.map((s, idx) => (
                  <span
                    key={idx}
                    className="rounded-full border border-white/20 px-2 py-0.5"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 text-xs mt-1">
                <Link
                  href="#"
                  className="flex-1 rounded-xl bg-[#0058E6] px-4 py-2 text-center font-semibold text-white shadow-lg shadow-[#0058E6]/40 hover:bg-[#1D7AF3] transition"
                >
                  طلب استشارة عن بعد
                </Link>
                <Link
                  href="#"
                  className="flex-1 rounded-xl border border-white/25 bg-white/5 px-4 py-2 text-center text-white/90 hover:bg-white/10 transition"
                >
                  طلب زيارة ميدانية
                </Link>
              </div>

              <p className="text-[11px] text-white/45 mt-1">
                عند اختيار الخدمة سيتم نقلك لاحقًا إلى صفحة الدفع وتأكيد موعد التنفيذ خلال
                72 ساعة (تُفعّل عند ربط بوابة الدفع).
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
