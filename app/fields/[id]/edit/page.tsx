"use client";

import { FormEvent, useEffect, useState } from "react";
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
  last_watering_at: string | null;
};

export default function EditFieldPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const fieldId = (params?.id || "") as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [cropType, setCropType] = useState("");
  const [notes, setNotes] = useState("");
  const [lastWatering, setLastWatering] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("Auth error:", authError);
          router.replace(`/auth/login?from=/fields/${fieldId}/edit`);
          return;
        }

        if (!user) {
          router.replace(`/auth/login?from=/fields/${fieldId}/edit`);
          return;
        }

        const { data, error } = await supabase
          .from("fields")
          .select("*")
          .eq("id", fieldId)
          .eq("user_id", user.id)
          .single();

        if (error || !data) {
          console.error("Field fetch error:", error);
          setError("تعذر تحميل بيانات هذا الحقل. تأكد أن الرابط صحيح.");
          setLoading(false);
          return;
        }

        const field = data as Field;

        setName(field.name || "");
        setCropType(field.crop_type || "");
        setNotes(field.notes || "");
        setLastWatering(
          field.last_watering_at
            ? new Date(field.last_watering_at)
                .toISOString()
                .slice(0, 16) // yyyy-MM-ddTHH:mm
            : ""
        );

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("حدث خطأ غير متوقع أثناء تحميل بيانات الحقل.");
        setLoading(false);
      }
    };

    if (fieldId) init();
  }, [fieldId, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("فضلاً أدخل اسم الحقل.");
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("انتهت جلسة تسجيل الدخول، فضلاً سجّل الدخول مرة أخرى.");
      }

      const { error: updateError } = await supabase
        .from("fields")
        .update({
          name,
          crop_type: cropType || null,
          notes: notes || null,
          last_watering_at: lastWatering || null,
        })
        .eq("id", fieldId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Update field error:", updateError);
        throw new Error(updateError.message || "تعذر تحديث بيانات الحقل.");
      }

      // بعد الحفظ نرجع لصفحة تفاصيل الحقل
      router.replace(`/fields/${fieldId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ غير متوقع أثناء حفظ التعديلات.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white flex items-center justify-center">
        <div className="rounded-3xl bg-black/70 border border-white/10 px-6 py-4 text-sm text-white/70">
          يتم تحميل بيانات الحقل للتحرير...
        </div>
      </main>
    );
  }

  if (error && !saving && !name) {
    // خطأ مع عدم وجود بيانات حقل
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white flex items-center justify-center">
        <div className="rounded-3xl bg-black/70 border border-white/10 px-6 py-4 text-sm text-red-200">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white">
      <div className="mx-auto max-w-3xl px-4 pt-24 pb-16 space-y-6">
        <section className="rounded-3xl bg-black/70 border border-white/10 p-6 md:p-7 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold mb-1">
                تعديل بيانات الحقل
              </h1>
              <p className="text-xs md:text-sm text-white/60">
                يمكنك تعديل اسم الحقل، نوع المحصول، الملاحظات، ووقت آخر ري
                مسجّل.
              </p>
            </div>
            <Link
              href={`/fields/${fieldId}`}
              className="text-xs rounded-xl border border-white/25 bg-white/5 px-3 py-1.5 hover:bg-white/10 transition"
            >
              ⬅ العودة لتفاصيل الحقل
            </Link>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/40 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="space-y-1">
              <label className="block text-xs text-white/70">اسم الحقل</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-white/70">
                نوع المحصول الأساسي في الحقل
              </label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
              >
                <option value="">بدون تغيير / غير محدد</option>
                <option value="أشجار فواكه">أشجار فواكه</option>
                <option value="خضروات">خضروات</option>
                <option value="ورقيات وأعلاف">ورقيات وأعلاف</option>
                <option value="عنب">عنب</option>
                <option value="نخل">نخل</option>
                <option value="تين">تين</option>
                <option value="خوخ">خوخ</option>
                <option value="مشمش">مشمش</option>
                <option value="رمان">رمان</option>
                <option value="بن">بن</option>
                <option value="ورد طائفي">ورد طائفي</option>
                <option value="نباتات ظل">نباتات الظل</option>
                <option value="زراعة منزلية">زراعة منزلية</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-white/70">
                ملاحظات المزارع عن الحقل
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-[#4BA3FF]"
                placeholder="مثال: ظهرت حشرات مؤخراً، أو تم التسميد هذا الأسبوع..."
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-white/70">
                متى آخر مرة تم ري هذا الحقل؟
              </label>
              <input
                type="datetime-local"
                value={lastWatering}
                onChange={(e) => setLastWatering(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-[#4BA3FF]"
              />
              <p className="text-[10px] text-white/40">
                هذه المعلومة تُستخدم لحساب حالة الري في صفحة تفاصيل الحقل.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-2 w-full rounded-xl bg-[#0058E6] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0058E6]/40 hover:bg-[#1D7AF3] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "جارٍ حفظ التعديلات..." : "حفظ التعديلات"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
