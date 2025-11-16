"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Farm = {
  id: string;
  name: string | null;
  location_description: string | null;
  area: string | null;
  main_crops: string | null;
  farming_type: string | null;
  water_source: string | null;
};

type Field = {
  id: string;
  name: string | null;
  crop_type: string | null;
  area: string | null;
  irrigation_method: string | null;
};

export default function EditFarmPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  // 🔹 استخراج رقم المزرعة من الرابط
  const farmId = params?.id;

  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [fields, setFields] = useState<Field[]>([]);

  // تحميل المزرعة + الحقول
  useEffect(() => {
    const load = async () => {
      try {
        if (!farmId) {
          setError("تعذر تحديد رقم المزرعة من الرابط.");
          setChecking(false);
          return;
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("auth error:", userError);
        }

        if (!user) {
          router.replace(`/auth/login?from=/farms/${farmId}/edit`);
          return;
        }

        setUserId(user.id);

        const { data: farmData, error: farmError } = await supabase
          .from("farms")
          .select(
            "id, name, location_description, area, main_crops, farming_type, water_source, user_id"
          )
          .eq("id", farmId)
          .eq("user_id", user.id)
          .single();

        if (farmError) {
          console.error("farm error:", farmError);
        }

        if (!farmData) {
          setError(
            "تعذر تحميل بيانات المزرعة. تأكد أن المزرعة موجودة وأنك صاحبها."
          );
          setChecking(false);
          return;
        }

        setFarm({
          id: farmData.id,
          name: farmData.name,
          location_description: farmData.location_description,
          area: farmData.area,
          main_crops: farmData.main_crops,
          farming_type: farmData.farming_type,
          water_source: farmData.water_source,
        });

        setChecking(false);

        // تحميل الحقول
        setLoadingFields(true);
        const { data: fieldsData, error: fieldsError } = await supabase
          .from("fields")
          .select("id, name, crop_type, area, irrigation_method")
          .eq("farm_id", farmId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (fieldsError) {
          console.error("fields error:", fieldsError);
        } else {
          setFields(fieldsData || []);
        }
      } catch (err) {
        console.error(err);
        setError("حدث خطأ غير متوقع أثناء تحميل البيانات.");
      } finally {
        setLoadingFields(false);
      }
    };

    load();
  }, [farmId, router]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!farm || !userId) return;

    if (!farm.name || farm.name.trim() === "") {
      setError("فضلاً أدخل اسم المزرعة.");
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase
        .from("farms")
        .update({
          name: farm.name.trim(),
          location_description: farm.location_description || null,
          area: farm.area || null,
          main_crops: farm.main_crops || null,
          farming_type: farm.farming_type || null,
          water_source: farm.water_source || null,
        })
        .eq("id", farm.id)
        .eq("user_id", userId);

      if (updateError) {
        console.error("update farm error:", updateError);
        setError("تعذر حفظ التعديلات، حاول مرة أخرى.");
        setSaving(false);
        return;
      }

      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      setError("حدث خطأ غير متوقع أثناء حفظ التعديلات.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!userId) return;

    const confirmDelete = window.confirm(
      "هل أنت متأكد من حذف هذا الحقل؟ لا يمكن التراجع."
    );
    if (!confirmDelete) return;

    try {
      const { error: deleteError } = await supabase
        .from("fields")
        .delete()
        .eq("id", fieldId)
        .eq("user_id", userId);

      if (deleteError) {
        console.error("delete field error:", deleteError);
        alert("تعذر حذف الحقل، حاول مرة أخرى.");
        return;
      }

      setFields((prev) => prev.filter((f) => f.id !== fieldId));
    } catch (err) {
      console.error(err);
      alert("حدث خطأ غير متوقع أثناء حذف الحقل.");
    }
  };

  if (checking) {
    return (
      <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white flex items-center justify-center px-4">
        <div className="rounded-3xl bg-black/70 border border-white/10 px-6 py-4 text-sm text-white/70">
          يتم تحميل بيانات المزرعة...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white flex items-center justify-center px-4">
        <div className="max-w-md rounded-3xl bg-black/70 border border-red-500/40 px-6 py-4 text-sm text-red-200">
          {error}
        </div>
      </main>
    );
  }

  if (!farm) return null;

  return (
    <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white">
      <div className="mx-auto max-w-4xl px-4 pt-24 pb-16 space-y-8">
        {/* نموذج المزرعة */}
        <section className="rounded-3xl bg-black/70 border border-white/10 p-6 md:p-7 space-y-5">
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-1">
              تعديل بيانات المزرعة
            </h1>
            <p className="text-xs md:text-sm text-white/60">
              يمكنك تعديل بيانات المزرعة الأساسية. يمكن تعديل الموقع لاحقًا من خلال
              خريطة خاصة بتحديث الإحداثيات.
            </p>
          </div>

          {error && (
            <p className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <form onSubmit={handleSave} className="space-y-4 text-sm">
            <div className="space-y-1">
              <label className="block text-xs text-white/70">اسم المزرعة</label>
              <input
                type="text"
                value={farm.name || ""}
                onChange={(e) =>
                  setFarm((prev) =>
                    prev ? { ...prev, name: e.target.value } : prev
                  )
                }
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-white/70">
                وصف عام للموقع
              </label>
              <textarea
                value={farm.location_description || ""}
                onChange={(e) =>
                  setFarm((prev) =>
                    prev
                      ? { ...prev, location_description: e.target.value }
                      : prev
                  )
                }
                rows={2}
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-xs focus:outline-none focus:border-[#4BA3FF]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs text-white/70">
                  المساحة التقريبية
                </label>
                <input
                  type="text"
                  value={farm.area || ""}
                  onChange={(e) =>
                    setFarm((prev) =>
                      prev ? { ...prev, area: e.target.value } : prev
                    )
                  }
                  className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-white/70">
                  نوع الزراعة
                </label>
                <select
                  value={farm.farming_type || ""}
                  onChange={(e) =>
                    setFarm((prev) =>
                      prev ? { ...prev, farming_type: e.target.value } : prev
                    )
                  }
                  className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
                >
                  <option value="">اختر...</option>
                  <option value="open">زراعة مكشوفة</option>
                  <option value="greenhouse">بيوت محمية</option>
                  <option value="mixed">مختلطة</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs text-white/70">
                  المحاصيل الرئيسية
                </label>
                <input
                  type="text"
                  value={farm.main_crops || ""}
                  onChange={(e) =>
                    setFarm((prev) =>
                      prev ? { ...prev, main_crops: e.target.value } : prev
                    )
                  }
                  className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-white/70">
                  مصدر المياه
                </label>
                <select
                  value={farm.water_source || ""}
                  onChange={(e) =>
                    setFarm((prev) =>
                      prev ? { ...prev, water_source: e.target.value } : prev
                    )
                  }
                  className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
                >
                  <option value="">اختر...</option>
                  <option value="well">بئر</option>
                  <option value="network">شبكة</option>
                  <option value="dam">سد</option>
                  <option value="rain">أمطار</option>
                  <option value="mixed">أكثر من مصدر</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-[#0058E6] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0058E6]/40 hover:bg-[#1D7AF3] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving
                ? "جاري حفظ التعديلات..."
                : "حفظ التعديلات والعودة للوحة التحكم"}
            </button>
          </form>
        </section>

        {/* الحقول التابعة للمزرعة */}
        <section className="rounded-3xl bg-black/70 border border-white/10 p-6 md:p-7 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm md:text-base font-semibold mb-1">
                الحقول التابعة لهذه المزرعة
              </h2>
              <p className="text-[11px] text-white/60">
                يمكنك إضافة أكثر من حقل، وكل حقل له محصول ومساحة وطريقة ري مختلفة.
              </p>
            </div>
            <Link
              href={`/farms/${farm.id}/fields/new`}
              className="text-xs rounded-xl bg-emerald-500/15 border border-emerald-400/60 px-3 py-1.5 text-emerald-200 hover:bg-emerald-500/25 transition"
            >
              + إضافة حقل جديد
            </Link>
          </div>

          {loadingFields && (
            <p className="text-[11px] text-white/60 bg-white/5 border border-white/10 rounded-2xl px-3 py-2">
              جاري تحميل الحقول...
            </p>
          )}

          {!loadingFields && fields.length === 0 && (
            <p className="text-[11px] text-white/60 bg-white/5 border border-white/10 rounded-2xl px-3 py-3">
              لا توجد حقول مسجلة حتى الآن. ابدأ بإضافة أول حقل عبر الزر أعلاه.
            </p>
          )}

          {!loadingFields && fields.length > 0 && (
            <div className="space-y-2 text-xs md:text-sm">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-start justify-between gap-3 rounded-2xl bg-white/5 border border-white/10 px-3 py-2"
                >
                  <div>
                    <p className="font-semibold">
                      {field.name || "حقل بدون اسم"}
                    </p>
                    <p className="text-[11px] text-white/60">
                      المحصول:{" "}
                      {field.crop_type ? field.crop_type : "غير محدد"}
                    </p>
                    {field.area && (
                      <p className="text-[11px] text-white/60">
                        المساحة: {field.area}
                      </p>
                    )}
                    {field.irrigation_method && (
                      <p className="text-[11px] text-white/60">
                        طريقة الري: {field.irrigation_method}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteField(field.id)}
                    className="text-[11px] rounded-lg border border-red-400/60 bg-red-500/10 px-2.5 py-1 text-red-200 hover:bg-red-500/20 transition"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
