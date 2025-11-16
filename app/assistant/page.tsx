"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

type Farm = {
  id: string;
  name: string | null;
};

type Field = {
  id: string;
  name: string | null;
};

type InspectionResult = {
  diagnosis_ar: string;
  diagnosis_en: string;
  confidence: number | null;
  recommendations_ar: string;
  recommendations_en: string;
  image_url: string;
  crop_category: string;
  created_at: string;
};

const CROP_CATEGORIES = [
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
  "نباتات ظل",
];

export default function AssistantPage() {
  const router = useRouter();

  const [checkingUser, setCheckingUser] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [farms, setFarms] = useState<Farm[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>("");
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");

  const [cropCategory, setCropCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [lastInspection, setLastInspection] = useState<InspectionResult | null>(
    null
  );

  // ✅ التحقق من المستخدم وجلب مزارعه
  useEffect(() => {
    const loadUserAndFarms = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("assistant getUser error:", error);
        }

        if (!user) {
          router.replace("/auth/login?from=/assistant");
          return;
        }

        setUserId(user.id);

        // جلب المزارع المرتبطة بالمستخدم
        const { data: farmsData, error: farmsError } = await supabase
          .from("farms")
          .select("id, name, user_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (farmsError) {
          console.error("farms error:", farmsError);
          setError("تعذر تحميل مزارعك، حاول تحديث الصفحة.");
        } else {
          setFarms(
            (farmsData || []).map((f: any) => ({
              id: f.id,
              name: f.name,
            }))
          );
        }
      } catch (err) {
        console.error(err);
        setError("حدث خطأ غير متوقع أثناء تحميل البيانات.");
      } finally {
        setCheckingUser(false);
      }
    };

    loadUserAndFarms();
  }, [router]);

  // ✅ جلب الحقول عند اختيار مزرعة
  useEffect(() => {
    const loadFields = async () => {
      if (!userId || !selectedFarmId) {
        setFields([]);
        setSelectedFieldId("");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("fields")
          .select("id, name")
          .eq("farm_id", selectedFarmId)
          .eq("user_id", userId)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("fields error:", error);
          setFields([]);
        } else {
          setFields(
            (data || []).map((fld: any) => ({
              id: fld.id,
              name: fld.name,
            }))
          );
        }
      } catch (err) {
        console.error(err);
        setFields([]);
      }
    };

    loadFields();
  }, [selectedFarmId, userId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setFilePreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);
    setLastInspection(null);

    if (!userId) {
      setError("تعذر التحقق من المستخدم.");
      return;
    }

    if (!selectedFarmId) {
      setError("فضلاً اختر المزرعة التي ينتمي لها هذا الحقل.");
      return;
    }

    if (!cropCategory) {
      setError("فضلاً اختر نوع المحصول الذي تريد فحصه.");
      return;
    }

    if (!file) {
      setError("فضلاً اختر صورة واضحة للنبات.");
      return;
    }

    setLoading(true);

    try {
      // 1) رفع الصورة إلى Supabase Storage (masar-images)
      setStatusMessage("جاري رفع الصورة إلى خادم مسار...");

      const fileExt = file.name.split(".").pop();
      const filePath = `inspections/${userId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("masar-images")
        .upload(filePath, file);

      if (uploadError) {
        console.error("upload error:", uploadError);
        setError("تعذر رفع الصورة، حاول مرة أخرى.");
        setLoading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("masar-images").getPublicUrl(filePath);

      // 2) 🔁 هنا مستقبلاً نستدعي Azure / نموذج الذكاء الاصطناعي
      // حالياً بنسجل تحليل تجريبي (Placeholder) بالعربي والإنجليزي
      setStatusMessage("جاري تحليل الصورة (وضع تجريبي)...");

      const diagnosis_ar =
        "تحليل تجريبي: سيتم ربط مساعد مسار الذكي قريبًا بنموذج ذكاء اصطناعي متخصص للكشف عن أمراض وآفات المحاصيل في السعودية.";
      const diagnosis_en =
        "Preview analysis: Masar Smart Assistant will soon be connected to a specialized AI model for detecting crop diseases and stresses in Saudi farms.";
      const recommendations_ar =
        "هذا فحص تجريبي. في النسخة القادمة سيتم عرض اسم المرض، نسبة الاحتمال، أعراض النقص، وأسماء المواد الفعالة والعلاجات المقترحة مع أماكن شرائها محليًا.";
      const recommendations_en =
        "This is a preview inspection. In the next release, you will see the disease name, confidence, nutrient deficiency indicators, and recommended treatments with active ingredients and local suppliers.";
      const confidence = null; // لاحقاً نملأها من الموديل (0–1)

      // 3) حفظ نتيجة الفحص في جدول plant_inspections
      const { data: insertData, error: insertError } = await supabase
        .from("plant_inspections")
        .insert({
          user_id: userId,
          farm_id: selectedFarmId,
          field_id: selectedFieldId || null,
          crop_category: cropCategory,
          image_url: publicUrl,
          diagnosis_ar,
          diagnosis_en,
          confidence,
          recommendations_ar,
          recommendations_en,
          raw_model: null, // لاحقاً نخزن رد الموديل كما هو
        })
        .select("*")
        .single();

      if (insertError) {
        console.error("insert inspection error:", insertError);
        setError("تم رفع الصورة لكن تعذر حفظ نتيجة الفحص في قاعدة البيانات.");
        setLoading(false);
        return;
      }

      // تجهيز النتيجة للعرض في الواجهة
      const createdAt = insertData.created_at as string;

      const result: InspectionResult = {
        diagnosis_ar,
        diagnosis_en,
        confidence,
        recommendations_ar,
        recommendations_en,
        image_url: publicUrl,
        crop_category: cropCategory,
        created_at: createdAt,
      };

      setLastInspection(result);
      setStatusMessage("تم حفظ الفحص بنجاح (وضع تجريبي).");
    } catch (err) {
      console.error(err);
      setError("حدث خطأ غير متوقع أثناء تنفيذ الفحص.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingUser) {
    return (
      <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white flex items-center justify-center px-4">
        <div className="rounded-3xl bg-black/70 border border-white/10 px-6 py-4 text-sm text-white/70">
          يتم التحقق من حسابك وتحميل بيانات مزارعك...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white">
      <div className="mx-auto max-w-4xl px-4 pt-24 pb-16 space-y-6">
        {/* عنوان الصفحة */}
        <section className="rounded-3xl bg-black/70 border border-white/10 p-6 md:p-7 space-y-4">
          <div className="flex items-start gap-3">
            <div className="relative h-10 w-10">
              <Image
                src="/assets/masar-logo.png"
                alt="Masar"
                fill
                className="object-contain rounded-xl"
              />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold mb-1">
                مساعد مسار الذكي
                <span className="block text-xs text-white/50">
                  Masar Smart Assistant
                </span>
              </h1>
              <p className="text-xs md:text-sm text-white/60">
                هنا ترفع صورة لنبات من أحد حقولك، ليتم تحليلها وربط النتيجة بمزرعتك
                وسجلاتك. حالياً هذا الإصدار تجريبي ويجهز لربط نموذج ذكاء اصطناعي
                متخصص بمحاصيل السعودية.
              </p>
            </div>
          </div>

          {error && (
            <p className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {statusMessage && (
            <p className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/40 rounded-xl px-3 py-2">
              {statusMessage}
            </p>
          )}

          {farms.length === 0 && (
            <p className="text-[11px] text-white/60 bg-white/5 border border-white/10 rounded-2xl px-3 py-3">
              لا توجد مزارع مسجلة في حسابك حتى الآن. ابدأ بإضافة مزرعة جديدة من
              لوحة التحكم قبل استخدام مساعد مسار الذكي.
            </p>
          )}

          {farms.length > 0 && (
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {/* اختيار المزرعة والحقل */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs text-white/70">
                    اختر المزرعة
                  </label>
                  <select
                    value={selectedFarmId}
                    onChange={(e) => {
                      setSelectedFarmId(e.target.value);
                      setSelectedFieldId("");
                    }}
                    className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
                  >
                    <option value="">اختر المزرعة...</option>
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name || "مزرعة بدون اسم"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-white/70">
                    الحقل (اختياري)
                  </label>
                  <select
                    value={selectedFieldId}
                    onChange={(e) => setSelectedFieldId(e.target.value)}
                    className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
                    disabled={!selectedFarmId || fields.length === 0}
                  >
                    <option value="">
                      {fields.length === 0
                        ? "لا توجد حقول مسجلة لهذه المزرعة"
                        : "اختر الحقل (اختياري)"}
                    </option>
                    {fields.map((fld) => (
                      <option key={fld.id} value={fld.id}>
                        {fld.name || "حقل بدون اسم"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* اختيار نوع المحصول */}
              <div className="space-y-1">
                <label className="block text-xs text-white/70">
                  نوع المحصول في هذه الصورة
                </label>
                <select
                  value={cropCategory}
                  onChange={(e) => setCropCategory(e.target.value)}
                  className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
                >
                  <option value="">اختر نوع المحصول...</option>
                  {CROP_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* رفع الصورة */}
              <div className="space-y-1">
                <label className="block text-xs text-white/70">
                  صورة واضحة للنبات
                </label>
                <p className="text-[11px] text-white/50 mb-1">
                  حاول أن تُظهر في الصورة الأوراق بوضوح، وأي أعراض مرضية أو تغيّر في
                  اللون؛ حتى يسهل على المساعد الذكي التحليل في الإصدارات القادمة.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-[#0058E6] file:px-3 file:py-1.5 file:text-white file:text-xs file:font-semibold file:hover:bg-[#1D7AF3] file:cursor-pointer cursor-pointer bg-black/40 border border-white/15 rounded-xl px-2 py-2"
                />
                {filePreview && (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/50 p-2 inline-block">
                    <Image
                      src={filePreview}
                      alt="معاينة الصورة"
                      width={200}
                      height={200}
                      className="rounded-xl object-cover"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || farms.length === 0}
                className="w-full rounded-xl bg-[#0058E6] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0058E6]/40 hover:bg-[#1D7AF3] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? "جاري رفع الصورة وتسجيل الفحص..."
                  : "تنفيذ فحص تجريبي للنبات"}
              </button>
            </form>
          )}
        </section>

        {/* نتيجة آخر فحص */}
        {lastInspection && (
          <section className="rounded-3xl bg-black/70 border border-emerald-500/40 p-6 md:p-7 space-y-4">
            <h2 className="text-sm md:text-base font-semibold mb-1">
              نتيجة آخر فحص (تجريبي)
            </h2>
            <p className="text-[11px] text-white/60">
              هذا الفحص تم تنفيذه في وضع تجريبي. سيتم لاحقًا ربطه بنموذج ذكاء
              اصطناعي فعلي متخصص في محاصيل السعودية.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-4 text-xs md:text-sm">
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] text-white/60 mb-1">
                    نوع المحصول / Crop Category
                  </p>
                  <p className="text-sm font-semibold">
                    {lastInspection.crop_category}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-white/60 mb-1">
                    التشخيص (عربي)
                  </p>
                  <p className="text-xs leading-relaxed text-emerald-100">
                    {lastInspection.diagnosis_ar}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-white/60 mb-1">
                    Diagnosis (English)
                  </p>
                  <p className="text-xs leading-relaxed text-emerald-100">
                    {lastInspection.diagnosis_en}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-white/60 mb-1">
                    توصيات (عربي)
                  </p>
                  <p className="text-xs leading-relaxed text-white/80">
                    {lastInspection.recommendations_ar}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-white/60 mb-1">
                    Recommendations (English)
                  </p>
                  <p className="text-xs leading-relaxed text-white/80">
                    {lastInspection.recommendations_en}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] text-white/60 mb-1">صورة الفحص</p>
                <div className="rounded-2xl border border-white/10 bg-black/50 p-2 inline-block">
                  <Image
                    src={lastInspection.image_url}
                    alt="صورة الفحص"
                    width={260}
                    height={260}
                    className="rounded-xl object-cover"
                  />
                </div>
                <p className="text-[10px] text-white/50 mt-1">
                  وقت الفحص:{" "}
                  {new Date(lastInspection.created_at).toLocaleString("ar-SA")}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
