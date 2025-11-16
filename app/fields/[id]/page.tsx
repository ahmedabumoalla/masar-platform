"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Field = {
  id: string;
  farm_id: string;
  user_id: string | null;
  name: string | null;
  crop_type: string | null;
  notes: string | null;
  created_at: string | null;
  last_watering_at: string | null; // 🆕
};

type Inspection = {
  id: string;
  field_id: string;
  user_id: string | null;
  report: string | null;
  rating: number | null;
  created_at: string | null;
};

type FieldImage = {
  id: string;
  field_id: string;
  user_id: string | null;
  image_url: string;
  created_at: string | null;
};

type Farm = {
  id: string;
  name: string | null;
};

type IrrigationStatus = {
  label: string;
  level: "ok" | "soon" | "urgent";
  daysSince: number | null;
};

function getBaseIntervalDays(cropType?: string | null): number {
  if (!cropType) return 3;
  if (cropType.includes("خضروات")) return 2;
  if (cropType.includes("ورقيات")) return 2;
  if (cropType.includes("زراعة منزلية")) return 3;
  if (cropType.includes("نباتات ظل")) return 3;
  if (cropType.includes("ورد")) return 2;
  if (cropType.includes("بن")) return 3;
  if (cropType.includes("عنب")) return 3;
  if (cropType.includes("أشجار") || cropType.includes("نخل")) return 4;
  return 3;
}

function computeIrrigationStatus(
  last_watering_at: string | null,
  crop_type: string | null
): IrrigationStatus {
  if (!last_watering_at) {
    return {
      label: "لم يتم تسجيل وقت آخر ري، يُنصح بتحديث هذه المعلومة.",
      level: "soon",
      daysSince: null,
    };
  }

  const last = new Date(last_watering_at);
  const now = new Date();

  const diffMs = now.getTime() - last.getTime();
  const days = diffMs < 0 ? 0 : diffMs / (1000 * 60 * 60 * 24);

  const baseInterval = getBaseIntervalDays(crop_type);
  const remaining = baseInterval - days;

  if (remaining <= 0) {
    return {
      label: "🚨 يحتاج ري اليوم (أو متأخر عن موعد الري المعتاد).",
      level: "urgent",
      daysSince: Number(days.toFixed(1)),
    };
  }

  if (remaining <= 1) {
    return {
      label: "💧 سيحتاج ري خلال 24 ساعة تقريباً.",
      level: "soon",
      daysSince: Number(days.toFixed(1)),
    };
  }

  return {
    label: `✅ لا يحتاج ري الآن، متوقّع الحاجة للري بعد حوالي ${Math.round(
      remaining
    )} يوم.`,
    level: "ok",
    daysSince: Number(days.toFixed(1)),
  };
}

export default function FieldDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const fieldId = (params?.id || "") as string;

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);

  const [field, setField] = useState<Field | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [images, setImages] = useState<FieldImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.warn("Auth error:", authError);
          router.replace(`/auth/login?from=/fields/${fieldId}`);
          return;
        }

        if (!user) {
          router.replace(`/auth/login?from=/fields/${fieldId}`);
          return;
        }

        setCheckingAuth(false);

        const { data: fieldData, error: fieldError } = await supabase
          .from("fields")
          .select("*")
          .eq("id", fieldId)
          .eq("user_id", user.id)
          .single();

        if (fieldError || !fieldData) {
          console.warn("Field fetch error:", fieldError);
          setError("تعذر تحميل بيانات هذا الحقل. تأكد أن الرابط صحيح.");
          setLoading(false);
          return;
        }

        setField(fieldData as Field);

        const { data: farmData, error: farmError } = await supabase
          .from("farms")
          .select("id, name")
          .eq("id", fieldData.farm_id)
          .single();

        if (!farmError && farmData) {
          setFarm(farmData as Farm);
        }

        const { data: inspectionsData, error: inspectionsError } =
          await supabase
            .from("plant_inspections")
            .select("*")
            .eq("field_id", fieldId)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (inspectionsError) {
          console.warn("inspections fetch error:", inspectionsError);
        } else {
          setInspections((inspectionsData || []) as Inspection[]);
        }

        const { data: imagesData, error: imagesError } = await supabase
          .from("field_images")
          .select("*")
          .eq("field_id", fieldId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (imagesError) {
          console.warn("field_images fetch error:", imagesError);
        } else {
          setImages((imagesData || []) as FieldImage[]);
        }

        setLoading(false);
      } catch (err) {
        console.warn("Unexpected field details error:", err);
        setError("حدث خطأ غير متوقع أثناء تحميل بيانات الحقل.");
        setLoading(false);
      }
    };

    if (fieldId) {
      init();
    }
  }, [fieldId, router]);

  if (checkingAuth || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white flex items-center justify-center">
        <div className="rounded-3xl bg-black/70 border border-white/10 px-6 py-4 text-sm text-white/70">
          يتم تحميل بيانات الحقل والتقارير المرتبطة به...
        </div>
      </main>
    );
  }

  if (!field) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white flex items-center justify-center">
        <div className="rounded-3xl bg-black/70 border border-white/10 px-6 py-4 text-sm text-red-200">
          تعذر إيجاد هذا الحقل. تأكد من صحة الرابط أو عد إلى لوحة التحكم.
        </div>
      </main>
    );
  }

  const latestInspection = inspections[0] || null;
  const irrigationStatus = computeIrrigationStatus(
    field.last_watering_at,
    field.crop_type
  );

  const statusBg =
    irrigationStatus.level === "urgent"
      ? "bg-red-500/15 border-red-400/60 text-red-100"
      : irrigationStatus.level === "soon"
      ? "bg-amber-500/15 border-amber-400/60 text-amber-100"
      : "bg-emerald-500/15 border-emerald-400/60 text-emerald-100";

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white">
      <div className="mx-auto max-w-5xl px-4 pt-24 pb-16 space-y-8">
        {/* شريط علوي */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] text-white/50">
              تفاصيل الحقل {farm ? `— ${farm.name || "مزرعة بدون اسم"}` : ""}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold">
              {field.name || "حقل بدون اسم"}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {farm && (
              <Link
                href={`/farms/${farm.id}`}
                className="rounded-xl border border-white/25 bg-white/5 px-3 py-1.5 hover:bg-white/10 transition"
              >
                ⬅ العودة للمزرعة
              </Link>
            )}
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/25 bg-white/5 px-3 py-1.5 hover:bg-white/10 transition"
            >
              لوحة التحكم
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* بطاقة بيانات الحقل */}
        <section className="rounded-3xl bg-black/70 border border-white/10 p-5 md:p-6 space-y-4">
          <h2 className="text-sm md:text-base font-semibold mb-1">
            نظرة عامة على الحقل
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm">
            <div className="space-y-1">
              <p className="text-white/60 text-[11px]">اسم الحقل</p>
              <p className="font-medium">
                {field.name || "لم يتم تحديد اسم للحقل"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-white/60 text-[11px]">نوع المحصول</p>
              <p className="font-medium">
                {field.crop_type || "غير محدد"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-white/60 text-[11px]">ملاحظات المزارع</p>
              <p className="font-medium">
                {field.notes || "لا توجد ملاحظات مسجلة لهذا الحقل."}
              </p>
            </div>
            {field.created_at && (
              <div className="space-y-1">
                <p className="text-white/60 text-[11px]">تاريخ إضافة الحقل</p>
                <p className="font-medium">
                  {new Date(field.created_at).toLocaleDateString("ar-SA")}
                </p>
              </div>
            )}
          </div>

          {/* حالة الري الحالية */}
          <div
            className={`mt-3 rounded-2xl border px-4 py-3 text-xs md:text-sm ${statusBg}`}
          >
            <p className="font-semibold mb-1">حالة الري لهذا الحقل</p>
            <p>{irrigationStatus.label}</p>
            {field.last_watering_at && (
              <p className="mt-1 text-[11px] opacity-80">
                آخر ري مسجّل:{" "}
                {new Date(field.last_watering_at).toLocaleString("ar-SA")}
              </p>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <Link
              href={`/fields/${field.id}/edit`}
              className="rounded-xl border border-white/25 bg-white/5 px-3 py-1.5 hover:bg-white/10 transition"
            >
              ✏️ تعديل بيانات الحقل
            </Link>
          </div>
        </section>

        {/* صور الحقل + التقرير تحتها */}
        {images.length > 0 && (
          <section className="rounded-3xl bg-black/70 border border-white/10 p-5 md:p-6 space-y-3">
            <h2 className="text-sm md:text-base font-semibold mb-1">
              صور النباتات في هذا الحقل
            </h2>
            <p className="text-[11px] text-white/60">
              هذه الصور هي التي تم استخدامها لتحليل حالة النباتات وبناء
              توصيات العناية.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/60"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url}
                    alt="صورة من الحقل"
                    className="w-full h-32 md:h-40 object-cover"
                  />
                </div>
              ))}
            </div>

            {latestInspection && latestInspection.report && (
              <div className="mt-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/40 px-4 py-3 text-xs md:text-sm whitespace-pre-line">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-semibold">
                    أحدث تقرير من المساعد الذكي لهذا الحقل
                  </p>
                  {typeof latestInspection.rating === "number" && (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-400/60 px-3 py-0.5 text-[11px] text-emerald-200">
                      تقييمك: {latestInspection.rating} / 5
                    </span>
                  )}
                </div>

                {latestInspection.created_at && (
                  <p className="text-[11px] text-emerald-200/80 mb-1">
                    تاريخ التقرير:{" "}
                    {new Date(
                      latestInspection.created_at
                    ).toLocaleString("ar-SA")}
                  </p>
                )}

                <p className="text-emerald-50">
                  {latestInspection.report}
                </p>
              </div>
            )}
          </section>
        )}

        {latestInspection && latestInspection.report && images.length === 0 && (
          <section className="rounded-3xl bg-emerald-500/5 border border-emerald-500/40 p-5 md:p-6 space-y-3 text-xs md:text-sm whitespace-pre-line">
            <h2 className="text-sm md:text-base font-semibold">
              أحدث تقرير من المساعد الذكي لهذا الحقل
            </h2>
            {latestInspection.created_at && (
              <p className="text-[11px] text-emerald-200/80">
                تاريخ التقرير:{" "}
                {new Date(
                  latestInspection.created_at
                ).toLocaleString("ar-SA")}
              </p>
            )}
            <p className="text-emerald-50">
              {latestInspection.report}
            </p>
          </section>
        )}

        {inspections.length > 1 && (
          <section className="rounded-3xl bg-black/70 border border-white/10 p-5 md:p-6 space-y-3 text-xs md:text-sm">
            <h2 className="text-sm md:text-base font-semibold mb-1">
              أرشيف تقارير الفحص السابقة لهذا الحقل
            </h2>
            <p className="text-[11px] text-white/60">
              يمكنك الرجوع للتقارير السابقة لمعرفة تطور حالة النباتات مع
              الوقت وكيف تغيرت التوصيات.
            </p>

            <div className="space-y-3">
              {inspections.slice(1).map((ins) => (
                <div
                  key={ins.id}
                  className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 whitespace-pre-line"
                >
                  {ins.created_at && (
                    <p className="text-[11px] text-white/60 mb-1">
                      التاريخ:{" "}
                      {new Date(ins.created_at).toLocaleString("ar-SA")}
                    </p>
                  )}
                  <p className="text-white/90">
                    {ins.report || "لا يوجد نص تقرير محفوظ."}
                  </p>
                  {typeof ins.rating === "number" && (
                    <p className="mt-1 text-[11px] text-white/60">
                      تقييمك لهذا الفحص: {ins.rating} / 5
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
