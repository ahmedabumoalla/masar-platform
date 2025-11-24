"use client";

import {
  FormEvent,
  useEffect,
  useState,
  ChangeEvent,
} from "react";
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
  analysis: string;
  crop_category: string;
  created_at: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
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

  // أسئلة عن النبات
  const [plantName, setPlantName] = useState("");
  const [cropCategory, setCropCategory] = useState("");
  const [plantPlace, setPlantPlace] = useState<
    "indoor" | "outdoor" | "mixed" | ""
  >("");
  const [plantAge, setPlantAge] = useState("");
  const [wateringFrequency, setWateringFrequency] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [extraNotes, setExtraNotes] = useState("");

  // الصور (٣ على الأقل)
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [lastInspection, setLastInspection] =
    useState<InspectionResult | null>(null);

  // 💬 الشات
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

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

  // 💾 اختيار ملفات الصور (٣ على الأقل)
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
       if (!selected.length) return;

    setFiles((prev) => [...prev, ...selected]);

    const newPreviews = selected.map((file) => URL.createObjectURL(file));
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  // 🧠 استدعاء API لتحليل الصور (نستخدم /api/fields/analyze الموجودة)
  const analyzeWithAI = async (params: {
    imageUrls: string[];
    cropCategory: string;
    plantName: string;
    extraContext: string;
    farmName?: string | null;
  }): Promise<string> => {
    try {
      const res = await fetch("/api/fields/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrls: params.imageUrls,
          cropType: params.cropCategory || params.plantName,
          fieldName: params.plantName || params.cropCategory || "نبات",
          farmName: params.farmName || null,
          notes: params.extraContext,
          last_watering_at: null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("AI analyze error:", data);
        return (
          "تعذر الحصول على تحليل دقيق من نموذج الذكاء الاصطناعي في هذه المحاولة. " +
          "تأكد من وضوح الصور وزوايا التصوير، ثم حاول مرة أخرى. " +
          "يمكنك أيضًا استشارة مهندس زراعي محلي قبل اتخاذ أي قرار علاجي."
        );
      }

      const text =
        (data && (data.analysis as string | undefined)) || null;

      if (!text) {
        return (
          "لم يرجع النموذج تحليلاً واضحًا يمكن الاعتماد عليه. " +
          "حاول التقاط صور أوضح للأوراق والأعراض الظاهرة، ثم أعد التحليل."
        );
      }

      return text;
    } catch (err) {
      console.error("AI analyze exception:", err);
      return (
        "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي. " +
        "تحقق من الاتصال بالإنترنت أو إعدادات الخادم، ثم حاول مرة أخرى لاحقًا."
      );
    }
  };

  // 🧠 تهيئة الشات بعد كل فحص جديد
  useEffect(() => {
    if (!lastInspection) return;

    setChatMessages([
      {
        role: "assistant",
        content:
          "تم توليد تقرير مبدئي لحالة هذا النبات بناءً على الصور والمعلومات التي أرسلتها. " +
          "يمكنك الآن أن تسألني عن سبب المشكلة، خطورتها، ماذا تفعل اليوم، وتأثير ذلك على الري والتسميد.",
      },
    ]);
  }, [lastInspection]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);
    setLastInspection(null);
    setChatMessages([]);

    if (!userId) {
      setError("تعذر التحقق من المستخدم.");
      return;
    }

    if (!selectedFarmId) {
      setError("فضلاً اختر المزرعة المرتبط بها هذا الفحص.");
      return;
    }

    if (!plantName.trim() && !cropCategory.trim()) {
      setError("فضلاً أدخل اسم النبات أو اختر نوع المحصول.");
      return;
    }

    if (files.length < 3) {
      setError("يجب رفع 3 صور على الأقل لنفس النبات من زوايا مختلفة.");
      return;
    }

    setLoading(true);

    try {
      // 1) رفع الصور إلى Supabase Storage
      setStatusMessage("جاري رفع الصور إلى خادم مسار...");

      const publicUrls: string[] = [];
      const farm = farms.find((f) => f.id === selectedFarmId);

      for (const file of files) {
        const fileExt = file.name.split(".").pop() || "jpg";
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${fileExt}`;
        const filePath = `assistant-inspections/${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("masar-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          console.error("upload error:", uploadError);
          setError("تعذر رفع إحدى الصور، حاول مرة أخرى.");
          setLoading(false);
          return;
        }

        const { data: publicData } = supabase.storage
          .from("masar-images")
          .getPublicUrl(filePath);

        publicUrls.push(publicData.publicUrl);
      }

      // 2) تجهيز سياق التحليل
      const contextParts: string[] = [];

      if (plantName.trim()) contextParts.push(`اسم النبات: ${plantName}`);
      if (cropCategory.trim())
        contextParts.push(`تصنيف المحصول: ${cropCategory}`);
      if (plantPlace)
        contextParts.push(
          `مكان الزراعة: ${
            plantPlace === "indoor"
              ? "داخل البيت أو الصوبة"
              : plantPlace === "outdoor"
              ? "في الهواء الطلق"
              : "أحياناً داخل وأحياناً خارج"
          }`
        );
      if (plantAge.trim())
        contextParts.push(`عمر النبات التقريبي: ${plantAge}`);
      if (wateringFrequency.trim())
        contextParts.push(`تكرار الري المعتاد: ${wateringFrequency}`);
      if (symptoms.trim())
        contextParts.push(`الأعراض الملحوظة: ${symptoms}`);
      if (extraNotes.trim())
        contextParts.push(`ملاحظات إضافية من المزارع: ${extraNotes}`);

      const extraContext = contextParts.join("\n");

      // 3) استدعاء الذكاء الاصطناعي
      setStatusMessage("جاري تحليل الصور عبر مساعد مسار الذكي...");

      const analysisText = await analyzeWithAI({
        imageUrls: publicUrls,
        cropCategory: cropCategory.trim(),
        plantName: plantName.trim() || cropCategory.trim(),
        extraContext,
        farmName: farm?.name || null,
      });

      const createdAt = new Date().toISOString();

      // 4) تجهيز النتيجة للعرض
      const result: InspectionResult = {
        analysis: analysisText,
        crop_category:
          cropCategory.trim() ||
          plantName.trim() ||
          "محصول غير محدد",
        created_at: createdAt,
      };

      setLastInspection(result);
      setStatusMessage("تم تنفيذ الفحص بناءً على 3 صور أو أكثر.");

      // 5) حفظ الاستشارة الذكية في جدول خاص (سجل الاستشارات السابقة)
      try {
        await supabase.from("smart_consultations").insert({
          user_id: userId,
          farm_id: selectedFarmId,
          field_id: selectedFieldId || null,
          plant_name: plantName || null,
          crop_category: cropCategory || null,
          plant_place: plantPlace || null,
          plant_age: plantAge || null,
          watering_frequency: wateringFrequency || null,
          symptoms: symptoms || null,
          extra_notes: extraNotes || null,
          analysis: analysisText,
        });
      } catch (err) {
        console.error(
          "smart_consultations insert error (تأكد من وجود الجدول):",
          err
        );
      }
    } catch (err) {
      console.error(err);
      setError("حدث خطأ غير متوقع أثناء تنفيذ الفحص.");
    } finally {
      setLoading(false);
    }
  };

  // 💬 إرسال سؤال للمساعد الذكي بعد النتيجة
  const handleSendChat = async (e: FormEvent) => {
    e.preventDefault();

    if (!chatInput.trim()) return;

    const question = chatInput.trim();
    setChatInput("");

    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: question },
    ]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/assistant-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userQuestion: question,
          reportSummary: lastInspection?.analysis || "",
          cropCategory: lastInspection?.crop_category || "",
          farmerNotes:
            extraNotes || symptoms || wateringFrequency || "",
          inspectionId: null,
        }),
      });

      const text = await res.text();
      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok || !data?.reply) {
        console.error("assistant chat error:", res.status, text);

        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              data?.error ||
              "تعذر الحصول على رد من مساعد مسار الذكي في هذه اللحظة. تأكد من إعداد واجهة /api/assistant-chat بشكل صحيح أو حاول مرة أخرى لاحقًا.",
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply as string },
        ]);
      }
    } catch (err) {
      console.error("assistant chat exception:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "حدث خطأ أثناء الاتصال بالمساعد. تحقق من الاتصال أو إعدادات الخادم، ثم حاول مرة أخرى.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (checkingUser) {
    return (
      <main className="min-h-screen bg-[#F7FAFB] text-slate-700 flex items-center justify-center">
        <div className="rounded-2xl bg-white border border-slate-200 px-6 py-4 text-sm text-slate-600 shadow-sm">
          يتم التحقق من حسابك وتحميل بيانات مزارعك...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7FAFB] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 pt-24 pb-16 space-y-8">
        {/* الهيدر العلوي للمساعد الذكي */}
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="relative h-10 w-10 md:h-12 md:w-12">
              <Image
                src="/assets/masar-logo.png"
                alt="Masar"
                fill
                className="object-contain rounded-xl"
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1 text-slate-900">
                مساعد مسار الذكي
              </h1>
              <p className="text-sm text-slate-600 max-w-xl">
                أجب عن عدة أسئلة سريعة عن النبات، ثم ارفع{" "}
                <span className="font-semibold">٣ صور على الأقل</span> من
                زوايا مختلفة، ودع مساعد مسار يحلل الحالة ويقترح خطوات عملية
                لتحسين الري والصحة العامة للنبات.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-stretch sm:items-end gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-700">
              <span>🤖</span>
              <span>الإصدار التجريبي من مساعد مسار الذكي</span>
            </span>
            <p className="text-[11px] text-slate-500 max-w-xs text-left md:text-right">
              لا تغني هذه التحليلات عن استشارة مهندس زراعي مرخّص قبل اتخاذ
              قرار علاجي أو مالي على مستوى المزرعة.
            </p>
          </div>
        </section>

        {/* المحتوى الرئيسي: نموذج الأسئلة + الصور / النتيجة + الشات */}
        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-6 items-start">
          {/* كرت النموذج */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3 mb-1">
              <div>
                <h2 className="text-sm md:text-base font-semibold text-slate-900">
                  أسئلة سريعة عن النبات + رفع الصور
                </h2>
                <p className="text-[11px] text-slate-500">
                  اختر المزرعة والحقل (إن وجد)، ثم أجب عن الأسئلة وارفع ٣ صور.
                </p>
              </div>

              {files.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-[11px] text-slate-700">
                  {files.length} صورة مختارة
                </span>
              )}
            </div>

            {error && (
              <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            {statusMessage && (
              <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                {statusMessage}
              </p>
            )}

            {farms.length === 0 && (
              <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3">
                لا توجد مزارع مسجلة في حسابك حتى الآن. ابدأ بإضافة مزرعة من{" "}
                <span className="font-semibold">لوحة التحكم</span> قبل استخدام
                مساعد مسار الذكي.
              </p>
            )}

            {farms.length > 0 && (
              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                {/* اختيار المزرعة والحقل */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs text-slate-700">
                      اختر المزرعة
                    </label>
                    <select
                      value={selectedFarmId}
                      onChange={(e) => {
                        setSelectedFarmId(e.target.value);
                        setSelectedFieldId("");
                      }}
                      className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-[#4BA3FF] focus:ring-1 focus:ring-[#4BA3FF]"
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
                    <label className="block text-xs text-slate-700">
                      الحقل (اختياري)
                    </label>
                    <select
                      value={selectedFieldId}
                      onChange={(e) => setSelectedFieldId(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-[#4BA3FF] focus:ring-1 focus:ring-[#4BA3FF] disabled:bg-slate-50"
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

                {/* أسئلة عن النبات */}
                <div className="space-y-3 rounded-2xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-slate-800 mb-1">
                    أسئلة عن النبات
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs text-slate-700">
                        اسم النبات (إن وجد)
                      </label>
                      <input
                        type="text"
                        value={plantName}
                        onChange={(e) => setPlantName(e.target.value)}
                        className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-[#4BA3FF] focus:ring-1 focus:ring-[#4BA3FF]"
                        placeholder="مثال: فلفل، ورد، نخلة صغيرة..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs text-slate-700">
                        تصنيف المحصول
                      </label>
                      <select
                        value={cropCategory}
                        onChange={(e) => setCropCategory(e.target.value)}
                        className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-[#4BA3FF] focus:ring-1 focus:ring-[#4BA3FF]"
                      >
                        <option value="">
                          اختر نوع المحصول (اختياري)...
                        </option>
                        {CROP_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs text-slate-700">
                        مكان الزراعة
                      </label>
                      <select
                        value={plantPlace}
                        onChange={(e) =>
                          setPlantPlace(
                            e.target.value as
                              | "indoor"
                              | "outdoor"
                              | "mixed"
                              | ""
                          )
                        }
                        className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-[#4BA3FF] focus:ring-1 focus:ring-[#4BA3FF]"
                      >
                        <option value="">اختر...</option>
                        <option value="indoor">داخل البيت / صوبة</option>
                        <option value="outdoor">خارج البيت / مزرعة مفتوحة</option>
                        <option value="mixed">أحياناً داخل وأحياناً خارج</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs text-slate-700">
                        عمر النبات التقريبي
                      </label>
                      <input
                        type="text"
                        value={plantAge}
                        onChange={(e) => setPlantAge(e.target.value)}
                        className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-[#4BA3FF] focus:ring-1 focus:ring-[#4BA3FF]"
                        placeholder="مثال: شهرين، موسم كامل، أكثر من سنة..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs text-slate-700">
                      تكرار الري المعتاد
                    </label>
                    <input
                      type="text"
                      value={wateringFrequency}
                      onChange={(e) => setWateringFrequency(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-[#4BA3FF] focus:ring-1 focus:ring-[#4BA3FF]"
                      placeholder="مثال: كل يومين، مرتين في الأسبوع، مرة أسبوعياً..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs text-slate-700">
                      الأعراض التي تلاحظها على النبات
                    </label>
                    <textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-[#4BA3FF] focus:ring-1 focus:ring-[#4BA3FF]"
                      placeholder="مثال: اصفرار الأوراق من الأطراف، بقع بنية، ذبول في الظهر، حشرات صغيرة على السطح..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs text-slate-700">
                      ملاحظات إضافية (اختياري)
                    </label>
                    <textarea
                      value={extraNotes}
                      onChange={(e) => setExtraNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-[#4BA3FF] focus:ring-1 focus:ring-[#4BA3FF]"
                      placeholder="أي معلومات إضافية تعتقد أنها مهمة للمساعد (استخدام سماد معين، نقل النبات من مكان لآخر، موجة برد/حر شديدة...)"
                    />
                  </div>
                </div>

                {/* رفع الصور */}
                <div className="space-y-1">
                  <label className="block text-xs text-slate-700">
                    صور النبات (٣ صور على الأقل من زوايا مختلفة)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="w-full rounded-xl bg-slate-50 border border-dashed border-slate-300 px-3 py-3 text-xs file:mr-3 file:rounded-lg file:border-none file:bg-[#0058E6] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:border-[#0058E6]"
                  />
                  <p className="text-[11px] text-slate-600 mt-1">
                    حاول تصوير الأوراق القريبة، وأعراض المرض أو النقص، وصورة أوسع
                    توضح وضع النبات بالكامل.
                  </p>

                  {filePreviews.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {filePreviews.map((url, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-1"
                        >
                          <Image
                            src={url}
                            alt={`صورة ${idx + 1}`}
                            width={120}
                            height={120}
                            className="rounded-lg object-cover w-full h-[80px]"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || farms.length === 0}
                  className="w-full rounded-2xl bg-[#0058E6] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0058E6]/25 hover:bg-[#1D7AF3] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading
                    ? "جاري رفع الصور وتحليلها..."
                    : "تنفيذ فحص ذكي للنبات (٣ صور)"}
                </button>
              </form>
            )}
          </div>

          {/* كرت النتيجة + الشات */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3 mb-1">
              <div>
                <h2 className="text-sm md:text-base font-semibold text-slate-900">
                  نتيجة آخر فحص ومحادثة المساعد
                </h2>
                <p className="text-[11px] text-slate-500">
                  يعرض هنا تقرير الفحص المبني على الصور التي أرسلتها، مع إمكانية
                  طرح أسئلة إضافية.
                </p>
              </div>
            </div>

            {!lastInspection && (
              <div className="rounded-2xl bg-slate-50 border border-slate-200 px-3 py-3 text-[11px] text-slate-600">
                لم يتم تنفيذ أي فحص في هذه الجلسة حتى الآن. أكمل النموذج في
                الجهة اليسرى، وارفع ثلاث صور على الأقل، ثم ستظهر النتيجة هنا مع
                إمكانية الدردشة مع المساعد.
              </div>
            )}

            {lastInspection && (
              <>
                {/* تفاصيل النتيجة بدون صورة، التقرير ياخذ العرض كامل */}
                <div className="space-y-2 text-xs md:text-sm">
                  <div>
                    <p className="text-[11px] text-slate-500 mb-0.5">
                      نوع المحصول / Crop Category
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {lastInspection.crop_category}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-500 mb-0.5">
                      تقرير مساعد مسار لهذه الصور
                    </p>
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs leading-relaxed text-slate-800 whitespace-pre-line">
                      {lastInspection.analysis}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 mt-1">
                    وقت الفحص:{" "}
                    {new Date(
                      lastInspection.created_at
                    ).toLocaleString("ar-SA")}
                  </p>
                </div>

                {/* 💬 شات مساعد مسار */}
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs md:text-sm font-semibold text-slate-900">
                      اسأل مساعد مسار عن هذه النتيجة
                    </h3>
                    <span className="text-[10px] text-slate-500">
                      الأسئلة الأنسب: سبب المشكلة، خطورتها، ماذا تفعل اليوم، وتأثير
                      ذلك على الري والتسميد.
                    </span>
                  </div>

                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 space-y-3 max-h-64 overflow-y-auto">
                    {chatMessages.length === 0 && (
                      <p className="text-[11px] text-slate-500">
                        ابدأ بطرح سؤالك حول حالة النبات أو ما الخطوة الأفضل بعد
                        هذه النتيجة، وسيقوم المساعد بالرد عليك هنا.
                      </p>
                    )}

                    {chatMessages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`flex ${
                          m.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed ${
                            m.role === "user"
                              ? "bg-[#0058E6] text-white rounded-br-sm"
                              : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={handleSendChat}
                    className="flex items-center gap-2 text-[11px]"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="اكتب سؤالك هنا مثلاً: ما أفضل توقيت لري هذا النبات بعد هذه النتيجة؟"
                      className="flex-1 rounded-xl bg-white border border-slate-300 px-3 py-2 text-[11px] focus:outline-none focus:border-[#4BA3FF] focus:ring-1 focus:ring-[#4BA3FF]"
                    />
                    <button
                      type="submit"
                      disabled={chatLoading || !chatInput.trim()}
                      className="rounded-xl bg-[#0058E6] px-3 py-2 font-semibold text-white text-[11px] hover:bg-[#1D7AF3] transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {chatLoading ? "جاري الرد..." : "إرسال"}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
