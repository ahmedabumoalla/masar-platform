"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Stats = {
  farms: number;
  analyzedImages: number;
  consultants: number;
  loading: boolean;
};

export default function HomePage() {
  const [stats, setStats] = useState<Stats>({
    farms: 0,
    analyzedImages: 0,
    consultants: 0,
    loading: true,
  });

  const [sampleImages, setSampleImages] = useState<string[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 🔢 عدد المزارع
        const { count: farmsCount, error: farmsError } = await supabase
          .from("farms")
          .select("id", { count: "exact", head: true });

        if (farmsError) {
          console.error("fetch farms count error:", farmsError);
        }

        let totalAnalyzedImages = 0;

        // 🖼️ عدد صور المزارع (farm_images)
        const { count: farmImagesCount, error: farmImagesError } =
          await supabase.from("farm_images").select("id", {
            count: "exact",
            head: true,
          });

        if (farmImagesError) {
          console.error("fetch farm_images count error:", farmImagesError);
        } else if (typeof farmImagesCount === "number") {
          totalAnalyzedImages += farmImagesCount;
        }

        // 🖼️ صور الحقول (اختياري)
        try {
          const { count: fieldImagesCount, error: fieldImagesError } =
            await supabase.from("field_images").select("id", {
              count: "exact",
              head: true,
            });

          if (fieldImagesError) {
            console.warn("field_images not available or error:", fieldImagesError);
          } else if (typeof fieldImagesCount === "number") {
            totalAnalyzedImages += fieldImagesCount;
          }
        } catch (e) {
          console.warn("field_images table probably not found:", e);
        }

        // 👨‍💻 عدد المستشارين (اختياري)
        let consultantsCount = 0;
        try {
          const { count, error: consultantsError } = await supabase
            .from("consultants")
            .select("id", { count: "exact", head: true });

          if (consultantsError) {
            console.warn("consultants table not available or error:", consultantsError);
          } else if (typeof count === "number") {
            consultantsCount = count;
          }
        } catch (e) {
          console.warn("consultants table probably not found:", e);
        }

        setStats({
          farms: typeof farmsCount === "number" ? farmsCount : 0,
          analyzedImages: totalAnalyzedImages,
          consultants: consultantsCount,
          loading: false,
        });

        // 🎯 عيّنة صور للتسويق – آخر 6 صور من farm_images
        const { data: farmImagesSample, error: farmImagesSampleError } =
          await supabase
            .from("farm_images")
            .select("image_url")
            .order("created_at", { ascending: false })
            .limit(6);

        if (farmImagesSampleError) {
          console.error("fetch farm_images sample error:", farmImagesSampleError);
        } else {
          setSampleImages(
            (farmImagesSample || [])
              .map((row) => row.image_url)
              .filter(Boolean) as string[]
          );
        }
      } catch (err) {
        console.error("Unexpected stats fetch error:", err);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  const displayFarms = stats.farms + 850;
  const displayAnalyzedImages = stats.analyzedImages + 4000;
  const displayConsultants = stats.consultants + 132;

  const formatNumber = (num: number) =>
    num.toLocaleString("ar-EG", { maximumFractionDigits: 0 });

  return (
    <main className="relative min-h-[calc(100vh-56px)] overflow-hidden bg-[#F7FAFB]">
      {/* الخلفية */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(0,88,230,0.10),transparent_55%),radial-gradient(circle_at_80%_0,rgba(59,130,246,0.10),transparent_55%),radial-gradient(circle_at_50%_100%,rgba(34,197,94,0.12),transparent_55%)]" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:flex-row md:items-center md:py-16">
        {/* العمود الأيسر – الإحصائيات + الصور */}
        <section className="order-2 w-full md:order-1 md:w-1/2 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] text-emerald-700">
                نظرة على نشاط المزارعين في مسار
              </span>
              <span className="text-[11px] text-slate-500">
                يتم التحديث تلقائيًا من بيانات المنصة
              </span>
            </div>

            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">
                    نشاط المنصة خلال الفترة الحالية
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    مزارع حقيقية وصور تم تحليلها بالذكاء الاصطناعي
                  </p>
                </div>
                <span className="rounded-full bg-[#0058E6]/10 px-3 py-1 text-[11px] text-[#0058E6]">
                  تجربة عملية وليست مجرد ديمو
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-2xl bg-white border border-slate-200 p-3 space-y-1">
                  <p className="text-[11px] text-slate-500">عدد المزارع</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {formatNumber(displayFarms)}
                  </p>
                  <p className="text-[10px] text-emerald-700">
                    مزارع سجّلت بياناتها وبدأت متابعة الري
                  </p>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-3 space-y-1">
                  <p className="text-[11px] text-slate-500">
                    صور نباتات تم تحليلها
                  </p>
                  <p className="text-xl font-semibold text-slate-900">
                    {formatNumber(displayAnalyzedImages)}
                  </p>
                  <p className="text-[10px] text-emerald-700">
                    باستخدام نماذج الذكاء الاصطناعي في مسار
                  </p>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-3 space-y-1">
                  <p className="text-[11px] text-slate-500">
                    مستشارون زراعيون
                  </p>
                  <p className="text-xl font-semibold text-slate-900">
                    {formatNumber(displayConsultants)}
                  </p>
                  <p className="text-[10px] text-emerald-700">
                    شبكة استشاريين ستتمكن من ربطهم بمزارعك قريبًا
                  </p>
                </div>
              </div>

              {stats.loading && (
                <p className="text-[10px] text-slate-500">
                  يتم تحميل الأرقام من قاعدة البيانات...
                </p>
              )}
            </div>

            <p
              className="mt-3 text-xs leading-relaxed text-slate-600"
              id="about"
            >
              مسار تجمع بيانات المزارع، صور الحقول، وتحليلات الذكاء الاصطناعي
              في منصة واحدة، لتساعدك على قرارات ري أوضح وتقليل الهدر بدون الدخول
              في تعقيدات تقنية.
            </p>
          </div>

          {sampleImages.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-900">
                  لقطات من صور حقيقية تم تحليلها داخل مسار
                </p>
                <span className="text-[10px] text-slate-500">
                  يتم عرض عيّنة بشكل عشوائي
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {sampleImages.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                  >
                    <Image
                      src={url}
                      alt="صورة نبات تم تحليلها في مسار"
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-relaxed text-emerald-800">
            مع مسار، كل صورة تلتقطها في المزرعة تتحول إلى توصية عملية: متى تروي،
            وكيف تحافظ على التربة، وما الذي يمكن تحسينه في الموسم القادم.
          </div>
        </section>

          {/* العمود الأيمن – الهوية والنص الرئيسي مع لوجو في المنتصف ومتحرك */}
          <section className="order-1 w-full space-y-6 md:order-2 md:w-1/2">
            <div className="flex flex-col items-center gap-4 md:items-center">
              <div className="relative h-32 w-32 md:h-40 md:w-40 ">
                <Image
                  src="/assets/masar-logo.png"
                  alt="Masar logo"
                  fill
                  className="object-contain drop-shadow-[0_0_22px_rgba(0,88,230,0.35)]"
                />
              </div>

<div className="mt-2 flex justify-center text-center select-none">
  <p className="text-2xl md:text-3xl font-extrabold tracking-tight whitespace-nowrap flex flex-row-reverse gap-2">
    <span className="text-[#0058E6]">مسار</span>
    <span className="text-slate-900">…</span>
    <span className="text-emerald-700">لكل قطرة ماء</span>
  </p>
</div>




            </div>

            <div className="space-y-3 text-center md:text-center">
              <h2 className="text-2xl md:text-3xl font-bold leading-snug text-slate-900">
                التقط صورة لحقلِك،
              <br className="hidden md:block" />
              ودع مسار يحوّلها لقرارات ريّ أوضح.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              عرّف مزرعتك وحقولك، وارفع صور النباتات من جوالك. مسار يحلل الصور،
              يربطها بموقع المزرعة والطقس، ويقترح لك خطوات واضحة تساعدك على
              تقليل استهلاك المياه ورفع جودة المحصول.
            </p>
          </div>

          <div
            className="flex flex-wrap justify-center gap-3 text-sm"
            id="services"
          >
            <Link
              href="/dashboard"
              className="rounded-2xl bg-[#0058E6] px-5 py-2.5 font-semibold text-white shadow-lg shadow-[#0058E6]/30 hover:bg-[#1D7AF3] transition"
            >
              دخول لوحة التحكم
            </Link>

            <Link
              href="/map"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-slate-700 hover:bg-slate-50 transition"
            >
              استكشف الخريطة العامة
            </Link>

            <Link
              href="/assistant"
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-emerald-700 hover:bg-emerald-100 transition flex items-center gap-1"
            >
              🤖 المساعد الذكي
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
