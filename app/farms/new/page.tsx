"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useMapEvents } from "react-leaflet";
import { supabase } from "@/lib/supabaseClient";

// نعرّف كمبوننتات الخريطة كـ any عشان ما يزعجنا TypeScript
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
  // أي كليك على الخريطة يحرك الدبوس
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  if (!position) return null;

  return <Marker position={position} />;
}

export default function NewFarmPage() {
  const router = useRouter();

  const [checkingUser, setCheckingUser] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // بيانات المزرعة
  const [name, setName] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [area, setArea] = useState("");
  const [mainCrops, setMainCrops] = useState("");
  const [farmingType, setFarmingType] = useState("");
  const [waterSource, setWaterSource] = useState("");

  // موقع الخريطة
  const [mapCenter, setMapCenter] = useState<LatLng | null>(null);
  const [markerPos, setMarkerPos] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ✅ التحقق من المستخدم وتحديد الموقع التقريبي
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
              // مركز افتراضي (أبها) لو رفض الإذن أو صار خطأ
              const center = { lat: 18.2465, lng: 42.5117 };
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
      const payload = {
        user_id: userId,
        name: name.trim(),
        location_description: locationDescription.trim() || null,
        area: area.trim() || null,
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

      console.log("✅ farm inserted:", data);

      const newFarmId = data.id as string;

      const wantsFields =
        typeof window !== "undefined"
          ? window.confirm(
              "تم حفظ المزرعة بنجاح.\nهل تريد الآن إضافة حقول لهذه المزرعة؟"
            )
          : false;

      if (wantsFields) {
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
              إضافة مزرعة جديدة
            </h1>
            <p className="text-xs md:text-sm text-white/60">
              عرّف مزرعتك وحدد موقعها على الخريطة. سيتم استخدام هذه البيانات في
              لوحة التحكم، والخريطة العامة، والإحصائيات لاحقًا بدون إظهار تفاصيل
              حساسة عن الآبار أو النقاط الدقيقة.
            </p>
          </div>

          {error && (
            <p className="whitespace-pre-line text-[11px] text-red-300 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {/* اسم ووصف المزرعة */}
            <div className="space-y-1">
              <label className="block text-xs text-white/70">
                اسم المزرعة
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
                placeholder="مثال: مزرعة وادي مسار - عسير"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-white/70">
                وصف عام للموقع
              </label>
              <textarea
                value={locationDescription}
                onChange={(e) => setLocationDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-xs focus:outline-none focus:border-[#4BA3FF]"
                placeholder="مثال: تقع في وادي قريب من مدينة أبها، تبعد 20 كم عن أقرب شبكة مياه رئيسية..."
              />
            </div>

            {/* مساحة + نوع الزراعة (مع زراعة منزلية) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs text-white/70">
                  المساحة التقريبية
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
                  placeholder="مثال: 5 هكتار / 20 دونم"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-white/70">
                  نوع الزراعة
                </label>
                <select
                  value={farmingType}
                  onChange={(e) => setFarmingType(e.target.value)}
                  className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
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
                <label className="block text-xs text-white/70">
                  المحاصيل الرئيسية
                </label>
                <input
                  type="text"
                  value={mainCrops}
                  onChange={(e) => setMainCrops(e.target.value)}
                  className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
                  placeholder="مثال: عنب، بطاطس، ورقيات..."
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-white/70">
                  مصدر المياه
                </label>
                <select
                  value={waterSource}
                  onChange={(e) => setWaterSource(e.target.value)}
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

            {/* الخريطة وتحديد الموقع */}
            <div className="space-y-2">
              <label className="block text-xs text-white/70">
                موقع المزرعة على الخريطة
              </label>
              <p className="text-[11px] text-white/50">
                سيتم استخدام هذه الإحداثيات بشكل تقريبي في الخريطة العامة
                والإحصائيات، دون إظهار تفاصيل حساسة عن الآبار أو النقاط الدقيقة
                إلا بموافقتك.
              </p>

              <div className="h-72 w-full overflow-hidden rounded-2xl border border-white/15 bg-black/60">
                {!mapCenter ? (
                  <div className="w-full h-full flex items-center justify-center text-[11px] text-white/60">
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
                <p className="text-[11px] text-white/50 mt-1">
                  الإحداثيات المختارة (لن تظهر للمستخدمين الآخرين بشكل مباشر):{" "}
                  <span className="font-mono">
                    {markerPos.lat.toFixed(5)}, {markerPos.lng.toFixed(5)}
                  </span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-[#0058E6] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0058E6]/40 hover:bg-[#1D7AF3] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "جاري حفظ المزرعة..." : "حفظ المزرعة"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
