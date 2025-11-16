// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

type MapViewProps = {
  onLocationChange?: (lat: number, lng: number) => void;
};

type LatLng = {
  lat: number;
  lng: number;
};

const DEFAULT_CENTER: LatLng = {
  lat: 18.2465, // تقريباً أبها
  lng: 42.5117,
};

function ClickHandler({
  setPosition,
  onLocationChange,
}: {
  setPosition: (pos: LatLng) => void;
  onLocationChange?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition({ lat, lng });
      if (onLocationChange) {
        onLocationChange(lat, lng);
      }
    },
  });

  return null;
}

// ✅ يحرك الخريطة إلى الـ center الجديد مع زوم أنسب
function MapUpdater({ center }: { center: LatLng | null }) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;
    map.setView([center.lat, center.lng], 15, { animate: true });
  }, [center, map]);

  return null;
}

export default function MapView({ onLocationChange }: MapViewProps) {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [center, setCenter] = useState<LatLng | null>(DEFAULT_CENTER);

  // حالات مساعدة
  const [isLocating, setIsLocating] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);

  // 🔹 دالة موحدة لتحديد الموقع (تستخدم عند فتح الصفحة وعند الضغط على الزر)
  const locateUser = () => {
    if (!navigator.geolocation) {
      setIsLocating(false);
      setGeoError("متصفحك لا يدعم تحديد الموقع.");
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const accuracy = pos.coords.accuracy; // بالدقة متر
        const coords: LatLng = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        // 🔍 تحقق من الدقة (٤ متر كحد أقصى)
        if (typeof accuracy === "number" && accuracy > 4) {
          setIsLocating(false);
          setGeoError(
            `لم نتمكن من تحديد موقعك بدقة ٤ أمتار (الدقة الحالية تقريباً ${Math.round(
              accuracy
            )} م). جرّب الاقتراب من نافذة أو مكان مفتوح.`
          );
          return;
        }

        setCenter(coords);
        setPosition(coords);

        if (onLocationChange) {
          onLocationChange(coords.lat, coords.lng);
        }

        setIsLocating(false);
      },
      (err) => {
        console.warn("تعذر الحصول على الموقع:", err.message);
        setIsLocating(false);
        setGeoError(
          "تعذر تحديد موقعك الحالي، سيتم عرض الخريطة على الموقع الافتراضي."
        );
        // نترك center على DEFAULT_CENTER
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // ✅ عند فتح الصفحة: محاولة أولية لتحديد الموقع
  useEffect(() => {
    locateUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effectiveCenter = center ?? DEFAULT_CENTER;

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-800 bg-black">
      {/* جزء الخريطة نفسه */}
      <div className="relative w-full h-[340px]">
        <MapContainer
          center={[effectiveCenter.lat, effectiveCenter.lng]}
          zoom={13}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          {/* يحرك الكاميرا عندما يتغير center (مثلاً بعد تحديد موقعك) */}
          <MapUpdater center={center} />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ClickHandler
            setPosition={setPosition}
            onLocationChange={onLocationChange}
          />

          {/* دبوس دائرة بسيطة لموقع المستخدم / النقطة المختارة */}
          {position && (
            <CircleMarker
              center={[position.lat, position.lng]}
              radius={10}
              pathOptions={{
                color: "#22c55e",
                fillColor: "#22c55e",
                fillOpacity: 0.5,
              }}
            />
          )}
        </MapContainer>

        {/* مؤشر تحميل فوق الخريطة أثناء تحديد الموقع */}
        {isLocating && (
          <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
            <span className="rounded-full bg-black/70 border border-white/15 px-3 py-1 text-[11px] text-white/80">
              جاري تحديد موقعك الحالي…
            </span>
          </div>
        )}

        {/* رسالة خطأ في حال رفض/فشل تحديد الموقع أو الدقة أقل من المطلوب */}
        {geoError && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-3">
            <span className="rounded-full bg-red-500/90 border border-red-300/70 px-3 py-1 text-[11px] text-white shadow-lg text-center">
              {geoError}
            </span>
          </div>
        )}
      </div>

      {/* 🔘 زر صغير أسفل الخريطة داخل نفس الكرت وفي الزاوية (يمين تحت) */}
      <div className="flex justify-end px-3 py-2">
        <button
          type="button"
          onClick={locateUser}
          className="rounded-full bg-black/75 border border-white/30 px-3 py-1 text-[11px] text-white hover:bg-black/90 transition"
        >
          تحديد موقعي بدقة
        </button>
      </div>
    </div>
  );
}
