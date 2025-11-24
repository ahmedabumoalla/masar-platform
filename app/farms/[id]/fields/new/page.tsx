"use client";

import { FormEvent, useState, ChangeEvent, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function NewFieldPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ id?: string; farmId?: string }>();

  const farmIdFromRoute = (params?.farmId as string) || (params?.id as string);
  const farmIdFromQuery = searchParams?.get("farmId") ?? null;

  const farmId = farmIdFromRoute || farmIdFromQuery || null;

  const [farmName, setFarmName] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [cropType, setCropType] = useState("");
  const [notes, setNotes] = useState("");
  const [lastWatering, setLastWatering] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [lastImageUrls, setLastImageUrls] = useState<string[]>([]);
  const [fieldId, setFieldId] = useState<string | null>(null);

  const [rating, setRating] = useState<number | null>(null);
  const [ratingMessage, setRatingMessage] = useState<string | null>(null);

  // 🟢 جلب اسم المزرعة (اختياري لعرضه في الهيدر)
  useEffect(() => {
    const loadFarmName = async () => {
      try {
        if (!farmId) return;

        const { data, error } = await supabase
          .from("farms")
          .select("name")
          .eq("id", farmId)
          .single();

        if (!error && data) {
          setFarmName(data.name || null);
        }
      } catch (err) {
        console.error("Error loading farm name:", err);
      }
    };

    loadFarmName();
  }, [farmId]);

  const handleFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    setFiles((prev) => [...prev, ...selected]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setAiResult(null);
    setAiError(null);
    setRating(null);
    setRatingMessage(null);

    if (!farmId) {
      setError(
        "تعذر تحديد المزرعة لهذا الحقل. تأكد أن الرابط يحتوي على رقم المزرعة (إما /farms/[id]/fields/new أو ?farmId=...)."
      );
      return;
    }

    if (!name.trim()) {
      setError("فضلاً أدخل اسم الحقل.");
      return;
    }

    if (files.length < 3) {
      setError("يجب رفع 3 صور على الأقل من هذا الحقل.");
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Auth error:", userError);
        throw new Error(
          "تعذر التحقق من هوية المستخدم، حاول تسجيل الدخول مرة أخرى."
        );
      }

      if (!user) {
        throw new Error(
          "لا يوجد مستخدم مسجل دخول. فضلاً قم بتسجيل الدخول أولاً."
        );
      }

      const userId = user.id;

      const { data: fieldInsert, error: fieldError } = await supabase
        .from("fields")
        .insert({
          farm_id: farmId,
          user_id: userId,
          name,
          crop_type: cropType || null,
          notes: notes || null,
          // نخزن التاريخ كما هو (نص) – يكفي اليوم للتوصيات
          last_watering_at: lastWatering || null,
        })
        .select("id")
        .single();

      if (fieldError || !fieldInsert) {
        console.error("Field insert error:", fieldError);
        throw new Error(
          fieldError?.message || "تعذر إنشاء الحقل في قاعدة البيانات."
        );
      }

      const newFieldId = fieldInsert.id as string;
      setFieldId(newFieldId);

      const publicUrls: string[] = [];

      for (const file of files) {
        const fileExt = file.name.split(".").pop() || "jpg";
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${fileExt}`;
        const filePath = `fields/${newFieldId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("masar-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          console.error("Upload error details:", uploadError);
          throw new Error(
            `تعذر رفع إحدى الصور إلى التخزين: ${
              uploadError.message || "تحقق من إعدادات التخزين في Supabase."
            }`
          );
        }

        const { data: publicData } = supabase.storage
          .from("masar-images")
          .getPublicUrl(filePath);

        const publicUrl = publicData.publicUrl;
        publicUrls.push(publicUrl);

        const { error: imgInsertError } = await supabase
          .from("field_images")
          .insert({
            field_id: newFieldId,
            user_id: userId,
            image_url: publicUrl,
          });

        if (imgInsertError) {
          console.error("field_images insert error:", imgInsertError);
          throw new Error(
            `تم رفع الصور لكن تعذر حفظ بياناتها في قاعدة البيانات: ${
              imgInsertError.message || ""
            }`
          );
        }
      }

      setLastImageUrls(publicUrls);

      setAiLoading(true);

      try {
        const res = await fetch("/api/fields/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrls: publicUrls,
            cropType,
            fieldName: name,
            farmName: farmName || null,
            notes: notes || null,
            last_watering_at: lastWatering || null,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("AI error:", data);
          setAiError(
            data.error ||
              "تعذر تحليل الصور بالذكاء الاصطناعي، حاول مرة أخرى لاحقاً."
          );
        } else {
          setAiResult(data.analysis || null);
        }
      } catch (err: any) {
        console.error(err);
        setAiError("حدث خطأ أثناء الاتصال بالمساعد الذكي.");
      } finally {
        setAiLoading(false);
      }

      setSaving(false);
    } catch (err: any) {
      console.error(err);
      setSaving(false);
      setError(err.message || "حدث خطأ غير متوقع أثناء حفظ الحقل.");
    }
  };

  const saveReportAndGoDashboard = async (
    finalReport: string,
    currentRating: number
  ) => {
    try {
      if (!fieldId) {
        console.warn("لا يوجد fieldId لحفظ التقرير.");
        router.replace("/dashboard");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Auth error while saving report:", userError);
        router.replace("/dashboard");
        return;
      }

      const { error: insertError } = await supabase
        .from("plant_inspections")
        .insert({
          field_id: fieldId,
          user_id: user.id,
          report: finalReport,
          rating: currentRating,
        });

      if (insertError) {
        console.error("Error inserting plant_inspections:", insertError);
      }
    } catch (err) {
      console.error("Unexpected error while saving report:", err);
    } finally {
      router.replace("/dashboard");
    }
  };

  const handleRatingConfirm = async () => {
    setRatingMessage(null);

    if (!aiResult) {
      setRatingMessage("لا يوجد تقرير ليتم تقييمه.");
      return;
    }

    if (!lastImageUrls.length) {
      setRatingMessage("لا توجد صور محفوظة للتحليل.");
      return;
    }

    if (!rating) {
      setRatingMessage("فضلاً اختر تقييمًا من 1 إلى 5.");
      return;
    }

    if (rating > 2) {
      setRatingMessage("يتم الآن حفظ التقرير واعتماده...");
      await saveReportAndGoDashboard(aiResult, rating);
      return;
    }

    try {
      setAiLoading(true);
      setAiError(null);
      setRatingMessage("جاري تحسين التقرير بناءً على تقييمك...");

      const res = await fetch("/api/fields/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrls: lastImageUrls,
          cropType,
          fieldName: name,
          farmName: farmName || null,
          notes: notes || null,
          last_watering_at: lastWatering || null,
        }),
      });

      const data = await res.json();

      let finalReport = aiResult;

      if (!res.ok) {
        console.error("AI error (re-analyze):", data);
        setAiError(
          data.error ||
            "تعذر إكمال التحليل المتقدم للصور، سيتم اعتماد التقرير الحالي."
        );
      } else {
        finalReport = data.analysis || aiResult;
        setAiResult(finalReport);
      }

      setRatingMessage("تم تحسين التقرير، وجاري حفظه والانتقال للوحة التحكم...");
      await saveReportAndGoDashboard(finalReport, rating);
    } catch (err: any) {
      console.error(err);
      setAiError("حدث خطأ أثناء إعادة التحليل بالذكاء الاصطناعي.");
      setRatingMessage("سيتم اعتماد التقرير الحالي والانتقال للوحة التحكم...");
      await saveReportAndGoDashboard(aiResult, rating);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-56px)] bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 pt-24 pb-16 space-y-6">
        <section className="rounded-3xl bg-white border border-slate-200 p-6 md:p-7 space-y-5 shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-1 text-slate-900">
              إضافة حقل جديد للمزرعة
            </h1>
            <p className="text-xs md:text-sm text-slate-600">
              المزرعة:{" "}
              <span className="font-semibold text-slate-900">
                {farmName || "لم يتم تحديد اسم المزرعة"}
              </span>
            </p>
            <p className="mt-2 text-xs md:text-sm text-slate-600">
              عرّف الحقل، اختر نوع المحصول، ثم التقط أو ارفع{" "}
              <span className="font-semibold">3 صور على الأقل</span> للنباتات
              ليقوم المساعد الذكي بتحليل حالتها واقتراح حلول عملية.
            </p>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="space-y-1">
              <label className="block text-xs text-slate-700">اسم الحقل</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 focus:outline-none focus:border-[#0058E6]"
                placeholder="مثال: حقل الخضروات الموسمية"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-slate-700">
                نوع المحصول الأساسي في الحقل
              </label>
              <input
                type="text"
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 focus:outline-none focus:border-[#0058E6]"
                placeholder="مثال: بطاطس، طماطم، برسيم، زراعة منزلية..."
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-slate-700">
                ملاحظات إضافية عن حالة الحقل (اختياري)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-[#0058E6]"
                placeholder="مثال: التربة ثقيلة، كان فيه ري غزير قبل أسبوع، ظهرت حشرات مؤخراً..."
              />
            </div>

            {/* آخر مرة تم الري */}            <div className="space-y-1">
              <label className="block text-xs text-slate-700">
                متى آخر مرة تم ري هذا الحقل؟
              </label>
              <input
                type="datetime-local"
                value={lastWatering}
                onChange={(e) => setLastWatering(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-[#4BA3FF]"
              />
              <p className="text-[10px] text-white/40">
                يكفي اختيار اليوم التقريبي لآخر ري، وسيتم استخدامه لتقدير
                احتياج الحقل للري في التحليلات.
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-slate-700">
                صور النباتات في هذا الحقل (3 صور على الأقل)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilesChange}
                className="w-full rounded-xl bg-slate-50 border border-dashed border-slate-300 px-3 py-3 text-xs file:mr-3 file:rounded-lg file:border-none file:bg-[#0058E6] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:border-[#0058E6]"
              />
              <p className="text-[11px] text-slate-600 mt-1">
                يمكنك التصوير مباشرة من الجوال أو اختيار صور من المعرض. كلما كانت
                الصور أوضح ومن زوايا مختلفة، كان التحليل أدق.
              </p>
              {files.length > 0 && (
                <p className="text-[11px] text-emerald-700 mt-1">
                  تم اختيار {files.length} صورة.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-2 w-full rounded-xl bg-[#0058E6] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0058E6]/30 hover:bg-[#1D7AF3] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving
                ? "جارٍ حفظ الحقل ورفع الصور..."
                : "حفظ الحقل وتحليل الصور"}
            </button>
          </form>

          {aiLoading && (
            <div className="mt-4 rounded-2xl bg-slate-100 border border-slate-200 px-4 py-3 text-sm text-slate-700">
              يتم الآن تحليل صور النباتات بالذكاء الاصطناعي... ⏳
            </div>
          )}

          {aiError && (
            <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {aiError}
            </div>
          )}

          {aiResult && (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-900 whitespace-pre-line">
                <p className="font-semibold mb-2">
                  تقرير المساعد الذكي لهذا الحقل:
                </p>
                <p>{aiResult}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs md:text-sm text-slate-800 space-y-2">
                <p className="font-semibold">
                  كيف تقيم دقة هذا التقرير من 5؟
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <select
                    value={rating ?? ""}
                    onChange={(e) =>
                      setRating(
                        e.target.value ? Number(e.target.value) : (null as any)
                      )
                    }
                    className="rounded-xl bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:border-[#0058E6]"
                  >
                    <option value="">اختر التقييم</option>
                    <option value="1">1 - ضعيف جداً</option>
                    <option value="2">2 - ضعيف</option>
                    <option value="3">3 - مقبول</option>
                    <option value="4">4 - جيد</option>
                    <option value="5">5 - ممتاز</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleRatingConfirm}
                    className="rounded-xl bg-[#0058E6] px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-[#0058E6]/30 hover:bg-[#1D7AF3] transition"
                  >
                    تأكيد التقييم وحفظ التقرير
                  </button>
                </div>

                {ratingMessage && (
                  <p className="text-[11px] text-slate-600 mt-1">
                    {ratingMessage}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
