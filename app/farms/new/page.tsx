"use client";

import { FormEvent, useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useMapEvents } from "react-leaflet";
import { supabase } from "@/lib/supabaseClient";

// نعرّف كمبوننتات الخريطة كـ any عشان نتجاوز تعقيد تايب سكربت
const MapContainer: any = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer: any = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker: any = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);

type LatLng = {
  lat: number;
  lng: number;
};

function LocationMarker({
  position,
  setPosition,
}: {
  position: LatLng | null;
  setPosition: (pos: LatLng) => void;
}) {
  useMapEvents({
    click(e: any) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  if (!position) return null;
  return <Marker position={position} />;
}

type StartMode = "fields" | "later";

export default function NewFarmPage() {
  const router = useRouter();

  const [checkingUser, setCheckingUser] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // بيانات المزرعة
  const [name, setName] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [areaValue, setAreaValue] = useState("");
  const [areaUnit, setAreaUnit] = useState("متر مربع");
  const [mainCrops, setMainCrops] = useState("");
  const [farmingType, setFarmingType] = useState("");
  const [waterSource, setWaterSource] = useState("");

  // تفضيل البداية
  const [startMode, setStartMode] = useState<StartMode>("fields");

  // موقع الخريطة
  const [mapCenter, setMapCenter] = useState<LatLng | null>(null);
  const [markerPos, setMarkerPos] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ✅ حالات تحليل الصور في صفحة المزرعة
  const [images, setImages] = useState<File[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // التحقق من المستخدم + تحديد الموقع التقريبي
  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("new farm getUser error:", error);
        }

        if (!user) {
          router.replace("/auth/login?from=/farms/new");
          return;
        }

        setUserId(user.id);

        // تحديد موقع المستخدم تلقائيًا
        setLocating(true);
        if (typeof window !== "undefined" && "geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              const center = { lat, lng };
              setMapCenter(center);
              setMarkerPos(center);
              setLocating(false);
            },
            () => {
              const center = { lat: 18.2465, lng: 42.5117 }; // أبها تقريبًا
              setMapCenter(center);
              setMarkerPos(center);
              setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 8000 }
          );
        } else {
          const center = { lat: 18.2465, lng: 42.5117 };
          setMapCenter(center);
          setMarkerPos(center);
          setLocating(false);
        }
      } catch (err) {
        console.error(err);
        setError("حدث خطأ أثناء التحقق من حسابك.");
      } finally {
        setCheckingUser(false);
      }
    };

    init();
  }, [router]);

  const handleImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAiError(null);
    setAiSummary(null);

    if (!e.target.files) {
      setImages([]);
      return;
    }
    const filesArray = Array.from(e.target.files);
    setImages(filesArray);
  };

  // 🔍 تحليل الصور بالذكاء الاصطناعي من صفحة المزرعة
  const handleAnalyzeImages = async () => {
    setAiError(null);
    setAiSummary(null);

    if (images.length < 3) {
      setAiError("يتطلب التحليل ثلاث صور على الأقل من المزرعة.");
      return;
    }

    try {
      setAiLoading(true);

      const formData = new FormData();
      images.forEach((file) => {
        formData.append("images", file);
      });

      // نرسل بعض البيانات لتساعد النموذج
      formData.append("farmName", name || "مزرعة بدون اسم");
      formData.append(
        "cropType",
        mainCrops || "لم يحدد المحاصيل الرئيسية بعد"
      );
      formData.append(
        "notes",
        locationDescription ||
          "لا توجد ملاحظات إضافية، استخدم حالة النباتات الظاهرة في الصور فقط."
      );

      const res = await fetch("/api/fields/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        console.error("AI analyze error (farm):", data);
        setAiError(
          data.error ||
            "تعذر تحليل الصور بالذكاء الاصطناعي، يمكنك المحاولة لاحقًا."
        );
        return;
      }

      if (typeof data.analysis === "string" && data.analysis.trim().length > 0) {
        setAiSummary(data.analysis.trim());
      } else {
        setAiSummary(
          "تم تحليل الصور بنجاح، لكن لم يصل نص واضح من خدمة الذكاء الاصطناعي."
        );
      }
    } catch (err) {
      console.error("AI analyze unexpected error (farm):", err);
      setAiError("حدث خطأ غير متوقع أثناء تحليل الصور، حاول مرة أخرى.");
    } finally {
      setAiLoading(false);
    }
  };

  // ✅ تم تعديل الدالة بالكامل هنا لحفظ تقرير AI في farm_level_report
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId) {
      setError("تعذر التحقق من المستخدم. حاول تسجيل الدخول مرة أخرى.");
      return;
    }

    if (!name.trim()) {
      setError("فضلاً أدخل اسم المزرعة.");
      return;
    }

    if (!markerPos) {
      setError("فضلاً انتظر تحميل الخريطة أو حرك الدبوس لتحديد موقع المزرعة.");
      return;
    }

    setSaving(true);

    try {
      const areaCombined = areaValue.trim()
        ? `${areaValue.trim()} ${areaUnit}`
        : null;

      const payload = {
        user_id: userId,
        name: name.trim(),
        location_description: locationDescription.trim() || null,
        area: areaCombined,
        main_crops: mainCrops.trim() || null,
        farming_type: farmingType || null,
        water_source: waterSource || null,
        location_lat: markerPos.lat,
        location_lng: markerPos.lng,
      };

      console.log("📦 إرسال بيانات المزرعة إلى Supabase:", payload);

      const { data, error: insertError } = await supabase
        .from("farms")
        .insert(payload)
        .select("id")
        .single();

      if (insertError) {
        console.error("❌ insert farm error:", insertError);
        setError(
          "تعذر حفظ المزرعة، حاول مرة أخرى.\n" +
            (insertError.message || "")
        );
        setSaving(false);
        return;
      }

      const newFarmId = data.id as string;

      // ✅ لو عندنا تقرير ذكاء اصطناعي للمزرعة (من قسم تحليل الصور)
      // نخزّنه في حقل farm_level_report في جدول farms
      if (startMode === "later" && aiSummary && aiSummary.trim().length > 0) {
        const { error: updateReportError } = await supabase
          .from("farms")
          .update({ farm_level_report: aiSummary.trim() })
          .eq("id", newFarmId);

        if (updateReportError) {
          console.error(
            "❌ update farm_level_report error:",
            updateReportError
          );
        }
      }

      // 🖼️ حفظ صور هذه المزرعة في جدول farm_images + التخزين
      if (startMode === "later" && images.length > 0) {
        try {
          const publicUrls: string[] = [];

          for (const file of images) {
            const fileExt = file.name.split(".").pop() || "jpg";
            const fileName = `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}.${fileExt}`;
            const filePath = `farms/${newFarmId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from("masar-images")
              .upload(filePath, file, {
                cacheControl: "3600",
                upsert: true,
              });

            if (uploadError) {
              console.error("farm_images upload error:", uploadError);
              continue;
            }

            const { data: publicData } = supabase.storage
              .from("masar-images")
              .getPublicUrl(filePath);

            const imageUrl = publicData.publicUrl;
            publicUrls.push(imageUrl);

            const { error: insertImgError } = await supabase
              .from("farm_images")
              .insert({
                farm_id: newFarmId,
                user_id: userId,
                image_url: imageUrl,
              });

            if (insertImgError) {
              console.error("farm_images insert error:", insertImgError);
            }
          }

          console.log("✅ farm images saved:", publicUrls.length);
        } catch (err) {
          console.error("Unexpected farm images save error:", err);
        }
      }

      // التوجيه حسب اختيار المستخدم
      if (startMode === "fields") {
        router.replace(`/farms/${newFarmId}/fields/new`);
      } else {
        router.replace("/dashboard");
      }
    } catch (err: any) {
      console.error("❌ unexpected insert farm error:", err);
      setError("حدث خطأ غير متوقع أثناء حفظ المزرعة.");
    } finally {
      setSaving(false);
    }
  };

  if (checkingUser) {
    return (
      <main className="min-h-[calc(100vh-56px)] bg-slate-50 text-slate-900 flex items-center justify-center px-4">
        <div className="rounded-3xl bg-white border border-slate-200 px-6 py-4 text-sm text-slate-600 shadow-sm">
          يتم التحقق من حسابك...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-4 pt-24 pb-16">
        <div className="rounded-3xl bg-white border border-slate-200 p-6 md:p-7 space-y-6 shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-1 text-slate-900">
              إضافة مزرعة جديدة
            </h1>
            <p className="text-xs md:text-sm text-slate-600">
              عرّف مزرعتك وحدد موقعها على الخريطة. سيتم استخدام هذه البيانات في
              لوحة التحكم والخريطة العامة لاحقًا بدون إظهار تفاصيل حساسة عن
              الآبار أو النقاط الدقيقة.
            </p>
          </div>

          {error && (
            <p className="whitespace-pre-line text-[11px] md:text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {/* كيف تفضّل تبدأ؟ */}
          <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-2">
            <p className="text-xs md:text-sm font-semibold text-emerald-900">
              كيف تفضّل تبدأ مع هذه المزرعة؟
            </p>
            <p className="text-[11px] md:text-xs text-emerald-800">
              يمكنك إما البدء مباشرة في إضافة الحقول بالتفصيل، أو فقط حفظ المزرعة
              الآن مع تحليل سريع لصور النباتات بالمزرعة.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => setStartMode("fields")}
                className={`rounded-full px-3 py-1.5 border text-xs ${
                  startMode === "fields"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                إضافة الحقول الآن
              </button>
              <button
                type="button"
                onClick={() => setStartMode("later")}
                className={`rounded-full px-3 py-1.5 border text-xs ${
                  startMode === "later"
                    ? "bg-sky-600 text-white border-sky-600"
                    : "bg-white text-sky-900 border-sky-200 hover:bg-sky-50"
                }`}
              >
                لاحقًا فقط احفظ المزرعة
              </button>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {/* اسم ووصف المزرعة */}
            <div className="space-y-1">
              <label className="block text-xs text-slate-700">اسم المزرعة</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 focus:outline-none focus:border-[#0058E6]"
                placeholder="مثال: مزرعة وادي مسار - عسير"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-slate-700">
                وصف عام للموقع
              </label>
              <textarea
                value={locationDescription}
                onChange={(e) => setLocationDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-[#0058E6]"
                placeholder="مثال: تقع في وادي قريب من مدينة أبها، تبعد 20 كم عن أقرب شبكة مياه رئيسية..."
              />
            </div>

            {/* المساحة + نوع الزراعة */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs text-slate-700">
                  المساحة التقريبية
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={areaValue}
                    onChange={(e) => setAreaValue(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 focus:outline-none focus:border-[#0058E6]"
                    placeholder="مثال: 100"
                  />
                  <select
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value)}
                    className="min-w-[140px] rounded-xl bg-slate-50 border border-slate-200 px-2 py-2 text-xs focus:outline-none focus:border-[#0058E6]"
                  >
                    <option>متر مربع</option>
                    <option>دونم</option>
                    <option>هكتار</option>
                    <option>أحواض منزلية</option>
                    <option>سطول زراعة منزلية</option>
                    <option>أسطح منازل</option>
                    <option>فازات زراعية داخلية</option>
                  </select>
                </div>
                <p className="text-[10px] text-slate-500">
                  مثال: 100 متر مربع / 3 أحواض منزلية.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-slate-700">
                  نوع الزراعة
                </label>
                <select
                  value={farmingType}
                  onChange={(e) => setFarmingType(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 focus:outline-none focus:border-[#0058E6]"
                >
                  <option value="">اختر...</option>
                  <option value="open">زراعة مكشوفة</option>
                  <option value="greenhouse">بيوت محمية</option>
                  <option value="mixed">مختلطة</option>
                  <option value="home">زراعة منزلية</option>
                </select>
              </div>
            </div>

            {/* محاصيل + مصدر مياه */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs text-slate-700">
                  المحاصيل الرئيسية
                </label>
                <input
                  type="text"
                  value={mainCrops}
                  onChange={(e) => setMainCrops(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 focus:outline-none focus:border-[#0058E6]"
                  placeholder="مثال: عنب، بطاطس، ورقيات..."
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-slate-700">
                  مصدر المياه
                </label>
                <select
                  value={waterSource}
                  onChange={(e) => setWaterSource(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 focus:outline-none focus:border-[#0058E6]"
                >
                  <option value="">اختر...</option>
                  <option value="desalination">مياه تحلية</option>
                  <option value="well">بئر</option>
                  <option value="rain">أمطار</option>
                  <option value="dam">سد</option>
                </select>
              </div>
            </div>

            {/* الخريطة وتحديد الموقع */}
            <div className="space-y-2">
              <label className="block text-xs text-slate-700">
                موقع المزرعة على الخريطة
              </label>
              <p className="text-[11px] text-slate-500">
                سيتم استخدام هذه الإحداثيات بشكل تقريبي في الخريطة العامة
                والإحصائيات، دون إظهار تفاصيل حساسة عن الآبار أو النقاط الدقيقة
                إلا بموافقتك.
              </p>

              <div className="h-72 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                {!mapCenter ? (
                  <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-500">
                    {locating
                      ? "جاري تحديد موقعك التقريبي..."
                      : "تعذر تحديد الموقع تلقائيًا، سيتم تحميل خريطة افتراضية. يمكنك سحب الدبوس للموقع الصحيح."}
                  </div>
                ) : (
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ width: "100%", height: "100%" }}
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker
                      position={markerPos}
                      setPosition={setMarkerPos}
                    />
                  </MapContainer>
                )}
              </div>

              {markerPos && (
                <p className="text-[11px] text-slate-500 mt-1">
                  الإحداثيات المختارة (لن تظهر للمستخدمين الآخرين بشكل مباشر):{" "}
                  <span className="font-mono">
                    {markerPos.lat.toFixed(5)}, {markerPos.lng.toFixed(5)}
                  </span>
                </p>
              )}
            </div>

            {/* 🔬 تحليل الصور بالذكاء الاصطناعي – يظهر فقط لو اختار (لاحقًا فقط احفظ المزرعة) */}
            {startMode === "later" && (
              <section className="mt-4 space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-emerald-900">
                      تحليل سريع لحالة النباتات في هذه المزرعة
                    </p>
                    <p className="text-[11px] md:text-xs text-emerald-800">
                      ارفع على الأقل 3 صور من زوايا مختلفة للنباتات في المزرعة، ثم
                      اضغط على زر{" "}
                      <span className="font-semibold">
                        تحليل الصور بالذكاء الاصطناعي
                      </span>{" "}
                      لاستلام ملخص يساعدك في ضبط الري والتسميد.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <label className="inline-flex items-center rounded-full bg-white border border-emerald-200 px-3 py-1.5 cursor-pointer hover:bg-emerald-50">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImagesChange}
                    />
                    <span>اختيار الملفات</span>
                  </label>
                  <span className="text-[11px] text-emerald-900">
                    عدد الملفات: {images.length}{" "}
                    <span className="text-emerald-700">
                      (الحد الأدنى 3 صور)
                    </span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAnalyzeImages}
                  disabled={aiLoading || images.length < 3}
                  className="rounded-full bg-emerald-600 text-white text-xs font-semibold px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-emerald-700 transition"
                >
                  {aiLoading
                    ? "جاري تحليل الصور..."
                    : "تحليل الصور بالذكاء الاصطناعي"}
                </button>

                {aiError && (
                  <p className="text-[11px] md:text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    {aiError}
                  </p>
                )}

                {aiSummary && (
                  <div className="mt-2 rounded-2xl bg-white border border-emerald-200 px-3 py-3 text-[11px] md:text-xs text-emerald-900 whitespace-pre-line">
                    <p className="font-semibold mb-1">ملخص تحليل النباتات:</p>
                    <p>{aiSummary}</p>
                  </div>
                )}
              </section>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-[#0058E6] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0058E6]/30 hover:bg-[#1D7AF3] transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {saving ? "جاري حفظ المزرعة..." : "حفظ المزرعة"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
