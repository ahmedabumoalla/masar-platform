// app/farms/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Farm = {
  id: string;
  name: string;
  city: string;
  description: string;
  lat?: number | null;
  lng?: number | null;
};

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const stored = window.localStorage.getItem("masar_farms");
      if (stored) {
        const parsed = JSON.parse(stored) as Farm[];
        setFarms(parsed);
      } else {
        setFarms([]);
      }
    } catch (error) {
      console.error("خطأ في قراءة المزارع من localStorage:", error);
      setFarms([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white" dir="rtl">
      {/* شريط علوي بسيط */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-bold">مسار الزراعي</h1>
          <nav className="flex items-center gap-4 text-sm md:text-base">
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-emerald-400 transition"
            >
              لوحة التحكم
            </Link>
            <Link
              href="/"
              className="text-slate-400 hover:text-emerald-400 transition"
            >
              الصفحة الرئيسية
            </Link>
          </nav>
        </div>
      </header>

      {/* محتوى صفحة المزارع */}
      <section className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 text-right">
            <h2 className="text-2xl font-semibold">مزارعي</h2>
            <p className="text-sm md:text-base text-slate-300">
              هنا تظهر قائمة المزارع التي قمت بإضافتها داخل منصة مسار الزراعي.
            </p>
          </div>

          <Link
            href="/farms/new"
            className="inline-flex items-center justify-center rounded-2xl px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm md:text-base font-semibold transition"
          >
            + إضافة مزرعة جديدة
          </Link>
        </div>

        {/* حالة التحميل */}
        {isLoading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-right text-sm md:text-base text-slate-300">
            جارٍ تحميل المزارع...
          </div>
        )}

        {/* لا توجد مزارع */}
        {!isLoading && farms.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-right space-y-3">
            <p className="text-sm md:text-base text-slate-300">
              لا توجد مزارع مضافة حتى الآن.
            </p>
            <p className="text-xs md:text-sm text-slate-400">
              عند إضافة المزارع، ستظهر هنا مع بياناتها الأساسية (الاسم، الموقع،
              الوصف، والإحداثيات إن وُجدت).
            </p>
            <Link
              href="/farms/new"
              className="inline-flex items-center justify-center rounded-2xl px-4 py-2 border border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 text-xs md:text-sm font-semibold transition"
            >
              أضف أول مزرعة الآن
            </Link>
          </div>
        )}

        {/* قائمة المزارع */}
        {!isLoading && farms.length > 0 && (
          <div className="space-y-4">
            {farms.map((farm) => (
              <div
                key={farm.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:p-5 flex flex-col md:flex-row justify-between gap-3"
              >
                <div className="text-right space-y-1">
                  <h3 className="text-lg md:text-xl font-semibold text-emerald-400">
                    {farm.name}
                  </h3>
                  {farm.city && (
                    <p className="text-sm md:text-base text-slate-300">
                      الموقع: {farm.city}
                    </p>
                  )}
                  {farm.description && (
                    <p className="text-xs md:text-sm text-slate-400">
                      {farm.description}
                    </p>
                  )}
                  {farm.lat && farm.lng && (
                    <p className="text-[11px] md:text-xs text-slate-500">
                      إحداثيات: {farm.lat.toFixed(4)} , {farm.lng.toFixed(4)}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-stretch md:items-end gap-2 text-xs md:text-sm">
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
                    عدد الحقول: 0 (قريباً من لوحة التحكم بالأرقام)
                  </span>

                  <Link
                    href={`/farms/${farm.id}`}
                    className="rounded-2xl border border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 px-4 py-1.5 transition text-center"
                  >
                    عرض تفاصيل المزرعة
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
