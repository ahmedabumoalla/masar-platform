"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const CROP_OPTIONS = [
  "أشجار فواكه",
  "خضروات",
  "ورقيات وأعلاف",
  "عنب",
  "نخل",
  "تين",
  "خوخ",
  "مشمش",
  "رمان",
  "بن",
  "ورد طائفي",
  "نباتات الظل",
];

interface NewFieldPageProps {
  params: { id: string }; // farm id
}

export default function NewFieldPage({ params }: NewFieldPageProps) {
  const router = useRouter();
  const farmId = params.id;

  const [checkingUser, setCheckingUser] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [fieldName, setFieldName] = useState("");
  const [mainCropCategory, setMainCropCategory] = useState("");
  const [additionalCrops, setAdditionalCrops] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // التحقق من المستخدم
  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("getUser error in fields/new:", error);
        }

        if (!user) {
          router.replace(`/auth/login?from=/farms/${farmId}/fields/new`);
          return;
        }

        setUserId(user.id);
      } catch (err) {
        console.error(err);
        setError("حدث خطأ أثناء التحقق من حسابك.");
      } finally {
        setCheckingUser(false);
      }
    };

    init();
  }, [router, farmId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId) {
      setError("تعذر التحقق من المستخدم. حاول تسجيل الدخول مرة أخرى.");
      return;
    }

    if (!fieldName.trim()) {
      setError("فضلاً أدخل اسم الحقل.");
      return;
    }

    if (!mainCropCategory) {
      setError("فضلاً اختر نوع المحصول الرئيسي في هذا الحقل.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        user_id: userId,
        farm_id: farmId,
        name: fieldName.trim(),
        main_crop_category: mainCropCategory,
        additional_crops: additionalCrops.trim() || null,
      };

      console.log("📦 insert field payload:", payload);

      const { error: insertError } = await supabase
        .from("fields")
        .insert(payload);

      if (insertError) {
        console.error("❌ insert field error:", insertError);
        setError(
          "تعذر حفظ الحقل، حاول مرة أخرى.\n" +
            (insertError.message || "")
        );
        setSaving(false);
        return;
      }

      // بعد الحفظ نسأل المستخدم
      const addAnother =
        typeof window !== "undefined"
          ? window.confirm(
              "تم حفظ الحقل بنجاح.\nهل تريد إضافة حقل آخر لهذه المزرعة؟"
            )
          : false;

      if (addAnother) {
        // نفرّغ الفورم ونخليه يكمل على نفس المزرعة
        setFieldName("");
        setMainCropCategory("");
        setAdditionalCrops("");
        setSaving(false);
      } else {
        router.replace("/dashboard");
      }
    } catch (err: any) {
      console.error("❌ unexpected field insert error:", err);
      setError("حدث خطأ غير متوقع أثناء حفظ الحقل.");
      setSaving(false);
    }
  };

  if (checkingUser) {
    return (
      <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white flex items-center justify-center px-4">
        <div className="rounded-3xl bg-black/70 border border-white/10 px-6 py-4 text-sm text-white/70">
          يتم التحقق من حسابك...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white">
      <div className="mx-auto max-w-4xl px-4 pt-24 pb-16">
        <div className="rounded-3xl bg-black/70 border border-white/10 p-6 md:p-7 space-y-5">
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-1">
              إضافة حقل جديد للمزرعة
            </h1>
            <p className="text-xs md:text-sm text-white/60">
              عرّف الحقول داخل مزرعتك وحدد نوع المحاصيل المزروعة فيها. سيتم
              استخدام هذه البيانات لاحقًا في المساعد الذكي، والتوصيات، والخريطة
              العامة لمسار.
            </p>
          </div>

          {error && (
            <p className="whitespace-pre-line text-[11px] text-red-300 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {/* اسم الحقل */}
            <div className="space-y-1">
              <label className="block text-xs text-white/70">
                اسم الحقل
              </label>
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
                placeholder="مثال: حقل العنب الشمالي / البيوت المحمية رقم 1"
              />
            </div>

            {/* نوع المحصول الرئيسي */}
            <div className="space-y-1">
              <label className="block text-xs text-white/70">
                نوع المحصول الرئيسي في الحقل
              </label>
              <select
                value={mainCropCategory}
                onChange={(e) => setMainCropCategory(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
              >
                <option value="">اختر...</option>
                {CROP_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-white/50 mt-1">
                بإمكانك لاحقًا ربط هذا الحقل بصور النباتات والمساعد الذكي لتشخيص
                الأمراض وتحديد مواعيد الري والتسميد.
              </p>
            </div>

            {/* محاصيل/تفاصيل إضافية */}
            <div className="space-y-1">
              <label className="block text-xs text-white/70">
                محاصيل أو تفاصيل إضافية (اختياري)
              </label>
              <textarea
                value={additionalCrops}
                onChange={(e) => setAdditionalCrops(e.target.value)}
                rows={3}
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-xs focus:outline-none focus:border-[#4BA3FF]"
                placeholder="مثال: يوجد خلط بسيط مع خضروات موسمية، أو أشجار ظل على أطراف الحقل..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-[#0058E6] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0058E6]/40 hover:bg-[#1D7AF3] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "جاري حفظ الحقل..." : "حفظ الحقل"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
