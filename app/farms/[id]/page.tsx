"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";



type Farm = {
  id: string;
  user_id: string | null;
  name: string | null;
  area: string | null;
  main_crops: string | null;
  farming_type: string | null;
  water_source: string | null;
  location_description: string | null;
  location_lat: number | null;
  location_lng: number | null;
  created_at: string | null;
};

type Field = {
  id: string;
  farm_id: string;
  user_id: string | null;
  name: string | null;
  crop_type: string | null;
  notes: string | null;
  created_at: string | null;
};

type FieldWithReport = Field & {
  latest_report: string | null;
  latest_rating: number | null;
};

export default function FarmDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const farmId = (params?.id || "") as string;


  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [fields, setFields] = useState<FieldWithReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // 🔐 التحقق من أن المستخدم مسجل دخول
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("Auth error:", authError);
          router.replace(`/auth/login?from=/farms/${farmId}`);
          return;
        }

        if (!user) {
          router.replace(`/auth/login?from=/farms/${farmId}`);
          return;
        }

        setCheckingAuth(false);

        // 🧊 جلب بيانات المزرعة (بدون شرط user_id)
        const { data: farmData, error: farmError } = await supabase
          .from("farms")
          .select("*")
          .eq("id", farmId)
          .single();

        if (farmError || !farmData) {
          console.warn("Farm fetch error:", farmError);
          setError("تعذر تحميل بيانات هذه المزرعة. تأكد أن الرابط صحيح.");
          setLoading(false);
          return;
        }

        setFarm(farmData as Farm);

        // 🌾 جلب الحقول التابعة لهذه المزرعة
        const { data: fieldsData, error: fieldsError } = await supabase
          .from("fields")
          .select("*")
          .eq("farm_id", farmId)
          .order("created_at", { ascending: false });

        if (fieldsError) {
          console.error("Fields fetch error:", fieldsError);
        }

        // 🤖 جلب تقارير المساعد الذكي لكل الحقول
        const { data: inspectionsData, error: inspectionsError } =
          await supabase
            .from("plant_inspections")
            .select("id, field_id, report, rating, created_at, user_id")
            .eq("user_id", user.id);

        if (inspectionsError) {
          console.error("plant_inspections fetch error:", inspectionsError);
        }

        // ✅ بناء خريطة لأحدث تقرير لكل حقل
        const latestByField: Record<
          string,
          { report: string | null; rating: number | null; created_at: string | null }
        > = {};

        (inspectionsData || []).forEach((ins: any) => {
          const fieldId = ins.field_id as string;
          const createdAt = ins.created_at as string | null;

          if (!latestByField[fieldId]) {
            latestByField[fieldId] = {
              report: ins.report as string | null,
              rating: ins.rating as number | null,
              created_at: createdAt,
            };
          } else if (createdAt && latestByField[fieldId].created_at) {
            if (
              new Date(createdAt).getTime() >
              new Date(latestByField[fieldId].created_at as string).getTime()
            ) {
              latestByField[fieldId] = {
                report: ins.report as string | null,
                rating: ins.rating as number | null,
                created_at: createdAt,
              };
            }
          }
        });

        const mergedFields: FieldWithReport[] = (fieldsData || []).map(
          (f: any) => ({
            id: f.id,
            farm_id: f.farm_id,
            user_id: f.user_id,
            name: f.name,
            crop_type: f.crop_type,
            notes: f.notes,
            created_at: f.created_at,
            latest_report: latestByField[f.id]?.report || null,
            latest_rating:
              typeof latestByField[f.id]?.rating === "number"
                ? latestByField[f.id]?.rating
                : null,
          })
        );

        setFields(mergedFields);
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError("حدث خطأ غير متوقع أثناء تحميل بيانات المزرعة.");
        setLoading(false);
      }
    };

    init();
  }, [farmId, router]);

  const handleDeleteFarm = async () => {
    if (!farm) return;

    const confirmDelete = window.confirm(
      "هل أنت متأكد أنك تريد حذف هذه المزرعة وجميع حقولها وتقاريرها المرتبطة؟ لا يمكن التراجع عن هذا الإجراء."
    );
    if (!confirmDelete) return;

    try {
      setDeleteLoading(true);

      const { error } = await supabase.from("farms").delete().eq("id", farm.id);

      if (error) {
        console.error("Delete farm error:", error);
        setError("تعذر حذف هذه المزرعة، حاول مرة أخرى.");
        setDeleteLoading(false);
        return;
      }

      router.replace("/dashboard");
    } catch (err) {
      console.error("Unexpected delete farm error:", err);
      setError("حدث خطأ غير متوقع أثناء حذف المزرعة.");
      setDeleteLoading(false);
    }
  };

  if (checkingAuth || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white flex items-center justify-center">
        <div className="rounded-3xl bg-black/70 border border-white/10 px-6 py-4 text-sm text-white/70">
          يتم تحميل بيانات المزرعة والحقول المرتبطة بها...
        </div>
      </main>
    );
  }

  if (!farm) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white flex items-center justify-center">
        <div className="rounded-3xl bg-black/70 border border-white/10 px-6 py-4 text-sm text-red-200">
          تعذر إيجاد هذه المزرعة. تأكد من صحة الرابط أو عد إلى لوحة التحكم.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white">
      <div className="mx-auto max-w-6xl px-4 pt-24 pb-16 space-y-8">
        {/* 🔙 شريط أعلى بسيط */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] text-white/50">تفاصيل المزرعة</p>
            <h1 className="text-2xl md:text-3xl font-bold">
              {farm.name || "مزرعة بدون اسم"}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/25 bg-white/5 px-3 py-1.5 hover:bg-white/10 transition"
            >
              ⬅ العودة للوحة التحكم
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* 🧱 بطاقة بيانات المزرعة */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl bg-black/70 border border-white/10 p-5 md:p-6 space-y-4">
            <h2 className="text-sm md:text-base font-semibold mb-1">
              نظرة عامة على المزرعة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm">
              <div className="space-y-1">
                <p className="text-white/60 text-[11px]">اسم المزرعة</p>
                <p className="font-medium">
                  {farm.name || "لم يتم تحديد اسم للمزرعة"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-white/60 text-[11px]">المساحة التقديرية</p>
                <p className="font-medium">
                  {farm.area || "غير محددة"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-white/60 text-[11px]">المحاصيل الرئيسية</p>
                <p className="font-medium">
                  {farm.main_crops || "لم تُحدد بعد"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-white/60 text-[11px]">نوع الزراعة</p>
                <p className="font-medium">
                  {farm.farming_type || "غير محدد (مفتوحة / محمية / زراعة منزلية)"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-white/60 text-[11px]">مصدر المياه</p>
                <p className="font-medium">
                  {farm.water_source || "غير محدد (بئر / شبكة / تحلية ...)"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-white/60 text-[11px]">وصف الموقع</p>
                <p className="font-medium">
                  {farm.location_description || "لم تتم إضافة وصف نصي للموقع بعد."}
                </p>
              </div>
            </div>

            {farm.created_at && (
              <p className="mt-2 text-[11px] text-white/50">
                تاريخ إضافة المزرعة إلى المنصة:{" "}
                {new Date(farm.created_at).toLocaleDateString("ar-SA")}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <Link
                href={`/farms/${farmId}/edit`}
                className="rounded-xl border border-white/25 bg-white/5 px-3 py-1.5 hover:bg-white/10 transition"
              >
                ✏️ تعديل بيانات المزرعة
              </Link>

              {/* إضافة حقل جديد مربوط بـ farmId في الـ URL */}
              <Link
                href={`/farms/${farmId}/fields/new`}
                className="rounded-xl bg-[#0058E6] px-3 py-1.5 font-semibold text-white shadow-md shadow-[#0058E6]/40 hover:bg-[#1D7AF3] transition"
              >
                ➕ إضافة حقل جديد لهذه المزرعة
              </Link>

              {/* زر حذف المزرعة */}
              <button
                type="button"
                onClick={handleDeleteFarm}
                disabled={deleteLoading}
                className="rounded-xl border border-red-400/60 bg-red-500/10 px-3 py-1.5 text-red-200 hover:bg-red-500/20 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleteLoading ? "جاري حذف المزرعة..." : "🗑️ حذف هذه المزرعة"}
              </button>
            </div>
          </div>

          {/* 📍 معلومات الموقع الجغرافي */}
          <div className="rounded-3xl bg-black/70 border border-white/10 p-5 space-y-3 text-xs">
            <h2 className="text-sm font-semibold mb-1">موقع المزرعة</h2>
            <p className="text-white/60">
              يتم استخدام هذه الإحداثيات في الخريطة العامة لإظهار الأنماط
              الزراعية ومصادر المياه بشكل إحصائي، دون الكشف عن موقع البئر أو
              التفاصيل الحساسة.
            </p>
            <div className="mt-2 space-y-1">
              <p className="text-white/60 text-[11px]">خط العرض</p>
              <p className="font-mono text-[12px]">
                {farm.location_lat ?? "غير مسجل"}
              </p>
              <p className="text-white/60 text-[11px]">خط الطول</p>
              <p className="font-mono text-[12px]">
                {farm.location_lng ?? "غير مسجل"}
              </p>
            </div>
            <Link
              href="/map"
              className="inline-flex mt-3 text-[11px] rounded-xl border border-white/25 bg-white/5 px-3 py-1.5 hover:bg-white/10 transition"
            >
              🗺️ عرض في الخريطة العامة
            </Link>
          </div>
        </section>

        {/* 🌾 جدول الحقول التابعة للمزرعة + تقارير الذكاء الاصطناعي */}
        <section className="rounded-3xl bg-black/70 border border-white/10 p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm md:text-base font-semibold mb-1">
                الحقول المسجلة في هذه المزرعة
              </h2>
              <p className="text-[11px] text-white/60">
                يمكنك إضافة أكثر من حقل لكل مزرعة، وتصوير النباتات في كل حقل
                ليقوم المساعد الذكي بتحليلها واقتراح جدول ري وعناية.
              </p>
            </div>

            <Link
              href={`/farms/${farmId}/fields/new`}
              className="text-xs rounded-xl bg-[#0058E6] px-3 py-1.5 font-semibold text-white shadow-md shadow-[#0058E6]/40 hover:bg-[#1D7AF3] transition"
            >
              ➕ إضافة حقل جديد
            </Link>
          </div>

          {fields.length === 0 && (
            <p className="mt-2 text-[11px] text-white/60 bg-white/5 border border-white/10 rounded-2xl px-3 py-3">
              لا توجد حقول مسجلة حتى الآن لهذه المزرعة. ابدأ بإضافة حقل جديد
              وتسجيل صور النباتات ليتم تحليلها.
            </p>
          )}

          {fields.length > 0 && (
            <>
              <div className="overflow-x-auto text-xs md:text-sm">
                <table className="w-full border-separate border-spacing-y-2">
                  <thead className="text-[11px] md:text-xs text-white/60">
                    <tr>
                      <th className="text-right px-3 py-2">اسم الحقل</th>
                      <th className="text-right px-3 py-2">نوع المحصول</th>
                      <th className="text-right px-3 py-2">ملاحظات</th>
                      <th className="text-right px-3 py-2">تاريخ الإضافة</th>
                      <th className="text-right px-3 py-2">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field) => (
                      <tr key={field.id} className="bg-white/5">
                        <td className="px-3 py-2 rounded-r-2xl">
                          {field.name || "حقل بدون اسم"}
                        </td>
                        <td className="px-3 py-2">
                          {field.crop_type || "غير محدد"}
                        </td>
                        <td className="px-3 py-2">
                          {field.notes || "لا توجد ملاحظات مسجلة"}
                        </td>
                        <td className="px-3 py-2">
                          {field.created_at
                            ? new Date(field.created_at).toLocaleDateString(
                                "ar-SA"
                              )
                            : "—"}
                        </td>
                        <td className="px-3 py-2 rounded-l-2xl">
                          <div className="flex flex-wrap gap-2 justify-end">
                            <Link
                              href={`/fields/${field.id}`}
                              className="text-[11px] rounded-lg border border-white/25 bg-white/10 px-2.5 py-1 hover:bg-white/20 transition"
                            >
                              عرض التفاصيل
                            </Link>
                            <Link
                              href={`/fields/${field.id}/edit`}
                              className="text-[11px] rounded-lg border border-white/25 bg-white/10 px-2.5 py-1 hover:bg-white/20 transition"
                            >
                              تعديل
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 🤖 تقارير المساعد الذكي وجداول الري لكل حقل */}
              {fields.some((f) => f.latest_report) && (
                <div className="mt-6 space-y-3">
                  <h3 className="text-sm font-semibold">
                    تقارير المساعد الذكي وجداول الري المقترحة
                  </h3>
                  <p className="text-[11px] text-white/60">
                    هذه التقارير ناتجة عن تحليل الصور لكل حقل باستخدام الذكاء
                    الاصطناعي، وتشمل تشخيص حالة النباتات، وجداول ري وتسميد
                    مقترحة بناءً على الواقع الفعلي في الصور.
                  </p>

                  {fields.map(
                    (field) =>
                      field.latest_report && (
                        <div
                          key={field.id}
                          className="rounded-2xl bg-emerald-500/5 border border-emerald-500/40 px-4 py-3 text-xs md:text-sm whitespace-pre-line"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="font-semibold">
                              {field.name || "حقل بدون اسم"}
                            </p>
                            {typeof field.latest_rating === "number" && (
                              <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-400/60 px-3 py-0.5 text-[11px] text-emerald-200">
                                تقييم المزارع لدقة التقرير: {field.latest_rating} / 5
                              </span>
                            )}
                          </div>
                          <p>{field.latest_report}</p>
                        </div>
                      )
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
