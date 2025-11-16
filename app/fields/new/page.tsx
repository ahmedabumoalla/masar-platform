"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Farm = {
  id: string;
  name: string | null;
};

export default function NewFieldPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const farmId = params.id;

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);

  // بيانات الحقل
  const [name, setName] = useState("");
  const [cropType, setCropType] = useState("");
  const [area, setArea] = useState("");
  const [irrigationMethod, setIrrigationMethod] = useState("");
  const [notes, setNotes] = useState("");

  // التحقق من المستخدم + التأكد أن المزرعة له
  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace(`/auth/login?from=/farms/${farmId}/fields/new`);
          return;
        }

        setUserId(user.id);

        const { data: farmData, error: farmError } = await supabase
          .from("farms")
          .select("id, name, user_id")
          .eq("id", farmId)
          .single();

        if (farmError || !farmData) {
          console.error("farm error:", farmError);
          setError("تعذر تحميل بيانات المزرعة أو لا تملك صلاحية الوصول لها.");
          setChecking(false);
          return;
        }

        // تأكد أن المزرعة للمستخدم نفسه
        if (farmData.user_id !== user.id) {
          setError("لا تملك صلاحية إضافة حقول لهذه المزرعة.");
          setChecking(false);
          return;
        }

        setFarm({ id: farmData.id, name: farmData.name });
        setChecking(false);
      } catch (err) {
        console.error(err);
        setError("حدث خطأ غير متوقع أثناء تحميل البيانات.");
        setChecking(false);
      }
    };

    load();
  }, [farmId, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId || !farm) {
      setError("تعذر التحقق من المستخدم أو المزرعة.");
      return;
    }

    if (!name.trim()) {
      setError("فضلاً أدخل اسم الحقل.");
      return;
    }

    setLoading(true);

    try {
      const { error: insertError } = await supabase.from("fields").insert({
        user_id: userId,
        farm_id: farm.id,
        name: name.trim(),
        crop_type: cropType.trim() || null,
        area: area.trim() || null,
        irrigation_method: irrigationMethod.trim() || null,
        notes: notes.trim() || null,
      });

      if (insertError) {
        console.error("insert field error:", insertError);
        setError("تعذر حفظ الحقل، حاول مرة أخرى.");
        setLoading(false);
        return;
      }

      const addAnother =
        typeof window !== "undefined"
          ? window.confirm("تم حفظ الحقل، هل تريد إضافة حقل آخر؟")
          : false;

      if (addAnother) {
        // نفضي النموذج
        setName("");
        setCropType("");
        setArea("");
        setIrrigationMethod("");
        setNotes("");
      } else {
        router.replace(`/farms/${farm.id}/edit`);
      }
    } catch (err) {
      console.error(err);
      setError("حدث خطأ غير متوقع أثناء حفظ الحقل.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white flex items-center justify-center px-4">
        <div className="rounded-3xl bg-black/70 border border-white/10 px-6 py-4 text-sm text-white/70">
          يتم التحقق من الحساب وتحميل بيانات المزرعة...
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

  return (
    <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white">
      <div className="mx-auto max-w-3xl px-4 pt-24 pb-16">
        <div className="rounded-3xl bg-black/70 border border-white/10 p-6 md:p-7 space-y-5">
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-1">
              إضافة حقل جديد للمزرعة
            </h1>
            <p className="text-xs md:text-sm text-white/60">
              المزرعة:{" "}
              <span className="font-semibold">
                {farm?.name || "بدون اسم"}
              </span>
            </p>
          </div>

          {error && (
            <p className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="space-y-1">
              <label className="block text-xs text-white/70">اسم الحقل</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
                placeholder="مثال: حقل البطاطس 1"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-white/70">
                نوع المحصول الرئيسي في الحقل
              </label>
              <input
                type="text"
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
                placeholder="مثال: بطاطس / طماطم / برسيم..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs text-white/70">
                  مساحة الحقل (اختياري)
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
                  placeholder="مثال: 2 هكتار / 5 دونم"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-white/70">
                  طريقة الري في الحقل
                </label>
                <input
                  type="text"
                  value={irrigationMethod}
                  onChange={(e) => setIrrigationMethod(e.target.value)}
                  className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
                  placeholder="مثال: تنقيط / رشاش محوري / غمر..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-white/70">
                ملاحظات إضافية (اختياري)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-xs focus:outline-none focus:border-[#4BA3FF]"
                placeholder="مثال: نوع التربة، ملاحظات عن حالة النباتات، مشاكل سابقة..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0058E6] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0058E6]/40 hover:bg-[#1D7AF3] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "جاري حفظ الحقل..." : "حفظ الحقل"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
