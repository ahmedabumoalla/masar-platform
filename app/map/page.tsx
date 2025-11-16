"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";

// نحمّل عناصر الخريطة بشكل ديناميكي عشان SSR في Next
const MapContainer: any = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer: any = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const CircleMarker: any = dynamic(
  () => import("react-leaflet").then((m) => m.CircleMarker),
  { ssr: false }
);
const Tooltip: any = dynamic(
  () => import("react-leaflet").then((m) => m.Tooltip),
  { ssr: false }
);

type RegionStats = {
  total_farms: number;
  main_crops: string | null;
  farming_types: string | null;
  water_sources: string | null;
};

type MapFarm = {
  id: string;
  name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  main_crops: string | null;
  farming_type: string | null;
  water_source: string | null;
};

const DEFAULT_CENTER = {
  lat: 21.3891, // تقريباً وسط السعودية
  lng: 39.8579,
};

// دالة لحساب المسافة بين نقطتين بالكيلومتر (هافِرسين)
function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.asin(Math.sqrt(a));
  return R * c;
}

export default function MapPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [stats, setStats] = useState<RegionStats | null>(null);
  const [radiusKm, setRadiusKm] = useState(100);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [farms, setFarms] = useState<MapFarm[]>([]);

  // ⬇️ أول ما تفتح الصفحة: نجيب موقع المستخدم ثم نحمل البيانات
  useEffect(() => {
    if (!navigator.geolocation) {
      setErrorMsg("المتصفح لا يدعم تحديد الموقع.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        loadRegionData(lat, lng, radiusKm);
      },
      () => {
        setErrorMsg("تعذر الحصول على موقعك الحالي.");
        setLoading(false);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ⬇️ دالة تجيب الإحصائيات + المزارع في النطاق
  const loadRegionData = async (
    lat: number,
    lng: number,
    radius: number
  ) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // نستدعي دالة الإحصائيات + جدول المزارع في نفس الوقت
      const [statsRes, farmsRes] = await Promise.all([
        supabase.rpc("get_region_stats", {
          center_lat: lat,
          center_lng: lng,
          radius_km: radius,
        }),
        supabase
          .from("farms")
          .select(
            "id, name, location_lat, location_lng, main_crops, farming_type, water_source"
          ),
      ]);

      // معالجة أخطاء الإحصائيات
      if (statsRes.error) {
        console.error("get_region_stats error:", statsRes.error);
        setErrorMsg("تعذر تحميل بيانات المنطقة.");
        setStats(null);
      } else {
        const first = (statsRes.data && statsRes.data[0]) || null;
        setStats(first);
      }

      // معالجة المزارع
      if (farmsRes.error) {
        console.error("farms fetch error:", farmsRes.error);
      } else {
        const allFarms = (farmsRes.data || []) as MapFarm[];

        // نفلتر المزارع داخل نصف القطر المطلوب
        const farmsInRadius = allFarms.filter((f) => {
          if (f.location_lat == null || f.location_lng == null) return false;
          const d = distanceKm(lat, lng, f.location_lat, f.location_lng);
          return d <= radius;
        });

        setFarms(farmsInRadius);
      }
    } catch (err) {
      console.error("Unexpected region data error:", err);
      setErrorMsg("حدث خطأ غير متوقع أثناء تحميل بيانات الخريطة.");
      setStats(null);
      setFarms([]);
    } finally {
      setLoading(false);
    }
  };

  // ⬇️ تغيير نصف القطر (50 / 100 / 150 كم)
  const handleRadiusChange = async (newRadius: number) => {
    setRadiusKm(newRadius);
    if (coords) {
      await loadRegionData(coords.lat, coords.lng, newRadius);
    }
  };

  const center = coords || DEFAULT_CENTER;

  return (
    <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-16 space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold mb-1">
            الخريطة العامة لمسار
          </h1>
          <p className="text-xs md:text-sm text-white/60">
            نعتمد بيانات المزارعين الفعليين المسجلين في مسار لعرض صورة مجمّعة عن
            أهم المحاصيل، وأنواع الزراعة، ومصادر المياه في دائرة حول موقعك
            (افتراضيًا 100 كم)، مع إبراز النقاط الساخنة لتجمع المزارع.
          </p>
        </div>

        {errorMsg && (
          <p className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2">
            {errorMsg}
          </p>
        )}

        {/* إعدادات نصف القطر وموقع المستخدم */}
        <div className="rounded-3xl bg-black/60 border border-white/10 p-4 space-y-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-white/70">
              نصف القطر الحالي:{" "}
              <span className="font-semibold text-[#FFCC33]">
                {radiusKm} كم
              </span>
            </p>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => handleRadiusChange(50)}
                className={`rounded-xl px-3 py-1 border ${
                  radiusKm === 50
                    ? "bg-[#0058E6] border-[#0058E6]"
                    : "bg-white/5 border-white/20"
                }`}
              >
                50 كم
              </button>
              <button
                onClick={() => handleRadiusChange(100)}
                className={`rounded-xl px-3 py-1 border ${
                  radiusKm === 100
                    ? "bg-[#0058E6] border-[#0058E6]"
                    : "bg-white/5 border-white/20"
                }`}
              >
                100 كم
              </button>
              <button
                onClick={() => handleRadiusChange(150)}
                className={`rounded-xl px-3 py-1 border ${
                  radiusKm === 150
                    ? "bg-[#0058E6] border-[#0058E6]"
                    : "bg-white/5 border-white/20"
                }`}
              >
                150 كم
              </button>
            </div>
          </div>

          {coords && (
            <p className="text-[11px] text-white/50">
              موقعك التقريبي: lat {coords.lat.toFixed(3)}, lng{" "}
              {coords.lng.toFixed(3)} – لا يتم حفظ موقعك الشخصي، نستخدمه فقط
              لحساب الإحصائيات المجمّعة ورسم النقاط الساخنة.
            </p>
          )}
        </div>

        {/* الخريطة التفاعلية مع النقاط الساخنة */}
        <section className="rounded-3xl bg-black/60 border border-white/10 p-4 space-y-3">
          <h2 className="text-sm md:text-base font-semibold mb-1">
            توزيع المزارع حولك (نقاط ساخنة)
          </h2>
          <div className="h-72 md:h-96 rounded-2xl overflow-hidden border border-white/10">
            <MapContainer
              center={[center.lat, center.lng]}
              zoom={7}
              scrollWheelZoom={true}
              className="w-full h-full"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {farms.map((farm) =>
                farm.location_lat != null && farm.location_lng != null ? (
                  <CircleMarker
                    key={farm.id}
                    center={[farm.location_lat, farm.location_lng]}
                    radius={10} // كل ما زاد العدد وتداخلت الدوائر تظهر المنطقة أحرّ
                    pathOptions={{
                      color: "#f97316",
                      fillColor: "#ef4444",
                      fillOpacity: 0.4,
                      weight: 1,
                    }}
                  >
                    <Tooltip direction="top">
                      <div className="text-xs">
                        <div className="font-semibold mb-1">
                          {farm.name || "مزرعة بدون اسم"}
                        </div>
                        {farm.main_crops && (
                          <div>المحاصيل: {farm.main_crops}</div>
                        )}
                        {farm.farming_type && (
                          <div>نوع الزراعة: {farm.farming_type}</div>
                        )}
                        {farm.water_source && (
                          <div>مصدر المياه: {farm.water_source}</div>
                        )}
                      </div>
                    </Tooltip>
                  </CircleMarker>
                ) : null
              )}
            </MapContainer>
          </div>
          <p className="text-[11px] text-white/60">
            كل دائرة تمثّل مزرعة مسجلة في مسار داخل النطاق المحدد. تداخل
            الدوائر في نفس المنطقة يخلق تأثير &quot;نقطة ساخنة&quot; لتجمع
            المزارع، مما يساعدك على فهم أماكن الكثافة الزراعية سريعًا.
          </p>
        </section>

        {/* الإحصائيات المجمّعة كما كانت سابقاً */}
        {loading ? (
          <p className="text-[11px] text-white/60">
            جاري حساب إحصائيات المنطقة...
          </p>
        ) : stats && stats.total_farms > 0 ? (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs md:text-sm">
            <div className="rounded-3xl bg-black/60 border border-white/10 p-4 space-y-1">
              <p className="text-xs text-white/60">عدد المزارع في النطاق</p>
              <p className="text-2xl font-semibold">{stats.total_farms}</p>
              <p className="text-[11px] text-white/60">
                هذه مزارع حقيقية تستخدم مسار داخل الدائرة المحددة.
              </p>
            </div>
            <div className="rounded-3xl bg-black/60 border border-white/10 p-4 space-y-1">
              <p className="text-xs text-white/60">أشهر المحاصيل</p>
              <p className="text-sm">
                {stats.main_crops && stats.main_crops.trim() !== ""
                  ? stats.main_crops
                  : "لا توجد بيانات كافية بعد."}
              </p>
              <p className="text-[11px] text-white/60">
                يتم احتسابها من حقل &quot;المحاصيل الرئيسية&quot; في بيانات
                المزارع.
              </p>
            </div>
            <div className="rounded-3xl bg-black/60 border border-white/10 p-4 space-y-1">
              <p className="text-xs text-white/60">
                أشهر أنواع الزراعة ومصادر المياه
              </p>
              <p className="text-sm">
                {stats.farming_types && stats.farming_types.trim() !== ""
                  ? stats.farming_types
                  : "نوع الزراعة غير محدد بعد."}
              </p>
              <p className="text-[11px] text-white/60 mt-1">
                مصادر المياه:{" "}
                {stats.water_sources && stats.water_sources.trim() !== ""
                  ? stats.water_sources
                  : "لا توجد بيانات كافية عن مصادر المياه."}
              </p>
            </div>
          </section>
        ) : (
          <p className="text-[11px] text-white/60">
            لا توجد بيانات كافية في هذه المنطقة حتى الآن. كلما زاد عدد
            المزارع التي تستخدم مسار، زادت دقة الخريطة العامة وتوصيات الري.
          </p>
        )}
      </div>
    </main>
  );
}
