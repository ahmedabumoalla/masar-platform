"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Farm = {
  id: string;
  user_id: string | null;
  name: string | null;
  location_description: string | null;
  area: string | null;
  main_crops: string | null;
  farming_type: string | null;
  water_source: string | null;
  created_at: string | null;
};

type FieldWithReport = {
  id: string;
  farm_id: string;
  user_id?: string | null;
  name: string | null;
  crop_type: string | null;
  area: string | null;
  irrigation_method: string | null;
  last_watering_at: string | null;
  latest_report: string | null;
  latest_rating: number | null;
};

type IrrigationStatusTone = "ok" | "soon" | "urgent";

type IrrigationStatus = {
  tone: IrrigationStatusTone;
  label: string;
};

/**
 * يحسب حالة الري بناءً على:
 * - تاريخ آخر ري
 * - نوع المحصول (لتقدير المدة بين الريّات)
 */
function getIrrigationStatus(
  lastWateringAt: string | null,
  cropType?: string | null
): IrrigationStatus {
  if (!lastWateringAt) {
    return {
      tone: "soon",
      label:
        "لم يتم تسجيل وقت آخر ري لهذا الحقل، يُنصح بتحديث هذه المعلومة من تفاصيل الحقل.",
    };
  }

  const last = new Date(lastWateringAt);
  const now = new Date();
  const diffMs = now.getTime() - last.getTime();
  const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // المدة الافتراضية بين الريّات (نقدر نضبطها لاحقًا بشكل أدق)
  let baseInterval = 3; // 3 أيام افتراضيًا

  if (cropType === "زراعة منزلية" || cropType === "نباتات ظل") {
    baseInterval = 2;
  } else if (cropType === "نخل") {
    baseInterval = 7;
  }

  const daysLeft = baseInterval - daysSince;

  if (daysLeft > 1) {
    return {
      tone: "ok",
      label: `لا يحتاج ري الآن، متوقع الحاجة للري بعد حوالي ${daysLeft} يوم.`,
    };
  }

  if (daysLeft === 1) {
    return {
      tone: "soon",
      label:
        "اقترب موعد الري، يُفضّل متابعة رطوبة التربة خلال اليومين القادمين.",
    };
  }

  if (daysLeft === 0) {
    return {
      tone: "urgent",
      label: "يُنصح بري هذا الحقل اليوم للحفاظ على كفاءة الري.",
    };
  }

  // متأخر عن الموعد
  return {
    tone: "urgent",
    label: `يبدو أن هذا الحقل متأخر عن موعد الري بحوالي ${Math.abs(
      daysLeft
    )} يوم، يُنصح بريه في أقرب وقت.`,
  };
}

export default function DashboardPage() {
  const router = useRouter();

  const [checkingUser, setCheckingUser] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [fields, setFields] = useState<FieldWithReport[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [lastInspectionAt, setLastInspectionAt] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("getUser error:", error);
        }

        if (!user) {
          router.replace("/auth/login?from=/dashboard");
          return;
        }

        setUserName(
          (user.user_metadata && user.user_metadata.full_name) || null
        );
        setUserEmail(user.email || null);
        setCheckingUser(false);

        // ✅ جلب مزارع هذا المستخدم فقط
        const { data: farmsData, error: farmsError } = await supabase
          .from("farms")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (farmsError) {
          console.error("load farms error:", farmsError);
          setDataError("تعذر تحميل بيانات المزارع من الخادم.");
        } else {
          setFarms((farmsData || []) as Farm[]);
        }

        // ✅ جلب الحقول لهذا المستخدم (مع last_watering_at)
        // ✅ بعد ما جبنا farmsData فوق مباشرة
const farmIds = (farmsData || []).map((f: any) => f.id as string);

let fieldsData: any[] | null = [];
let fieldsError: any = null;

if (farmIds.length > 0) {
  const { data, error } = await supabase
    .from("fields")
    .select(
      "id, farm_id, user_id, name, crop_type, notes, created_at, area, irrigation_method, last_watering_at"
    )
    .in("farm_id", farmIds); // 🟢 نجيب كل الحقول التابعة لمزارعك
  fieldsData = data;
  fieldsError = error;
}


        if (fieldsError) {
          console.warn("load fields error:", fieldsError);
        }

        // ✅ جلب تقارير المساعد الذكي لكل حقل
        const { data: inspectionsData, error: inspectionsError } =
          await supabase
            .from("plant_inspections")
            .select("id, field_id, report, rating, created_at")
            .eq("user_id", user.id);

        if (inspectionsError) {
          console.warn("load inspections error:", inspectionsError);
        }

        // نحدد آخر وقت فحص
        if (inspectionsData && inspectionsData.length > 0) {
          const latest = inspectionsData.reduce((acc, cur) => {
            if (!acc) return cur;
            const accDate = new Date(acc.created_at as string).getTime();
            const curDate = new Date(cur.created_at as string).getTime();
            return curDate > accDate ? cur : acc;
          });
          setLastInspectionAt(latest.created_at as string);
        }

        // ✅ بناء خريطة لأحدث تقرير لكل حقل
        const latestByField: Record<
          string,
          {
            report: string | null;
            rating: number | null;
            created_at: string | null;
          }
        > = {};

        (inspectionsData || []).forEach((ins: any) => {
          const fieldId = ins.field_id as string;
          const createdAt = ins.created_at as string | null;

          if (!latestByField[fieldId]) {
            latestByField[fieldId] = {
              report: ins.report as string | null,
              rating: ins.rating as number | null,
              created_at: createdAt,
            };
          } else if (createdAt && latestByField[fieldId].created_at) {
            if (
              new Date(createdAt).getTime() >
              new Date(latestByField[fieldId].created_at as string).getTime()
            ) {
              latestByField[fieldId] = {
                report: ins.report as string | null,
                rating: ins.rating as number | null,
                created_at: createdAt,
              };
            }
          }
        });

        const mergedFields: FieldWithReport[] = (fieldsData || []).map(
          (f: any) => ({
            id: f.id,
            farm_id: f.farm_id,
            user_id: f.user_id,
            name: f.name,
            crop_type: f.crop_type,
            area: f.area,
            irrigation_method: f.irrigation_method,
            last_watering_at: f.last_watering_at || null,
            latest_report: latestByField[f.id]?.report || null,
            latest_rating:
              typeof latestByField[f.id]?.rating === "number"
                ? latestByField[f.id]?.rating
                : null,
          })
        );

        setFields(mergedFields);
      } catch (err) {
        console.error("Unexpected dashboard error:", err);
        setDataError("حدث خطأ غير متوقع أثناء الاتصال بقاعدة البيانات.");
      } finally {
        setLoadingData(false);
      }
    };

    checkAuthAndLoad();
  }, [router]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("signOut error:", err);
    } finally {
      router.replace("/auth/login?logged_out=1");
    }
  };

  // ملاحظة: دالة الحذف بقت هنا لو احتجناها لاحقًا، لكن الأزرار انتقلت لصفحة تفاصيل المزرعة
  const handleDeleteFarm = async (id: string) => {
    const confirmDelete = window.confirm(
      "هل أنت متأكد أنك تريد حذف هذه المزرعة؟ لا يمكن التراجع عن هذا الإجراء."
    );
    if (!confirmDelete) return;

    setDeletingId(id);
    setDataError(null);

    try {
      const { error } = await supabase.from("farms").delete().eq("id", id);
      if (error) {
        console.error(error);
        setDataError("تعذر حذف المزرعة، حاول مرة أخرى.");
      } else {
        setFarms((prev) => prev.filter((farm) => farm.id !== id));
        setFields((prev) => prev.filter((field) => field.farm_id !== id));
      }
    } catch (err) {
      console.error(err);
      setDataError("حدث خطأ غير متوقع أثناء حذف المزرعة.");
    } finally {
      setDeletingId(null);
    }
  };

  const farmCount = farms.length;
  const fieldsCount = fields.length;
  const activeConsultationsDemo = 0;

  // 🔔 تجهيز تنبيهات الري: الحقول اللي حالتها "soon" أو "urgent"
  const irrigationAlerts =
    !loadingData && !checkingUser
      ? fields
          .map((field) => {
            const status = getIrrigationStatus(
              field.last_watering_at,
              field.crop_type || undefined
            );
            const farmName =
              farms.find((f) => f.id === field.farm_id)?.name ||
              "مزرعة غير معروفة";
            return { field, farmName, status };
          })
          .filter(
            ({ status }) => status.tone === "soon" || status.tone === "urgent"
          )
      : [];

  if (checkingUser || loadingData) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#050814] via-[#02040b] to-black text-white flex items-center justify-center">
        <div className="rounded-3xl bg-black/70 border border-white/10 px-6 py-4 text-sm text-white/70">
          يتم التحقق من حسابك وتحميل بيانات مزارعك...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#050814] via-[#02040b] to-black text-white">
      <div className="mx-auto max-w-6xl px-4 pt-24 pb-16 space-y-10">
        {/* الهيدر العلوي */}
        <section className="flex flex-col gap-4 md:gap-0 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              لوحة تحكم المزارع — مسار
            </h1>
            <p className="text-sm text-white/60 max-w-xl">
              من هنا تدير مزارعك وحقولك، تتابع التقارير، وتستخدم المساعد الذكي
              وترتبط مع المستشارين الزراعيين.
            </p>
            {userName || userEmail ? (
              <p className="mt-2 text-[11px] text-white/50">
                مسجل الدخول كـ{" "}
                <span className="font-semibold">
                  {userName || userEmail || ""}
                </span>
              </p>
            ) : null}
          </div>

          <div className="flex flex-col items-stretch sm:items-end gap-3">
            <div className="flex flex-wrap gap-3 text-xs justify-end">
              <span className="rounded-full bg-[#0058E6]/20 border border-[#0058E6]/40 px-3 py-1 text-[#4BA3FF]">
                متصل بقاعدة بيانات Supabase
              </span>
              <span className="rounded-full bg-[#FFCC33]/10 border border-[#FFCC33]/30 px-3 py-1 text-[#FFCC33]">
                بعض الأرقام لا تزال تجريبية
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="self-end text-xs rounded-xl border border-red-400/60 bg-red-500/10 px-3 py-1.5 text-red-200 hover:bg-red-500/20 transition"
            >
              تسجيل الخروج من هذا الحساب
            </button>
          </div>
        </section>

        {/* الكروت العلوية */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="relative overflow-hidden rounded-3xl bg-black/60 border border-white/10 p-4">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0058E6]/20 via-transparent to-transparent pointer-events-none" />
            <div className="relative space-y-1">
              <p className="text-xs text-white/60">عدد المزارع المسجلة</p>
              <p className="text-2xl font-semibold">{farmCount}</p>
              <p className="text-[11px] text-white/50">
                هذا الرقم يعتمد على عدد المزارع الفعلية المخزّنة في قاعدة
                البيانات.
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-black/60 border border-white/10 p-4">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/15 via-transparent to-transparent pointer-events-none" />
            <div className="relative space-y-1">
              <p className="text-xs text-white/60">عدد الحقول</p>
              <p className="text-2xl font-semibold">{fieldsCount}</p>
              <p className="text-[11px] text-white/50">
                عدد الحقول التي تم تسجيلها فعليًا في مزارعك داخل المنصة.
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-black/60 border border-white/10 p-4">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#FFCC33]/20 via-transparent to-transparent pointer-events-none" />
            <div className="relative space-y-1">
              <p className="text-xs text-white/60">
                آخر فحص بالذكاء الاصطناعي
              </p>
              <p className="text-2xl font-semibold">
                {lastInspectionAt
                  ? new Date(lastInspectionAt).toLocaleString("ar-SA")
                  : farmCount > 0
                  ? "بانتظار أول فحص"
                  : "بانتظار أول مزرعة"}
              </p>
              <p className="text-[11px] text-white/50">
                يتم تحديث هذا الوقت بعد كل تحليل صور ناجح لأحد الحقول.
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-black/60 border border-white/10 p-4">
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/15 via-transparent to-transparent pointer-events-none" />
            <div className="relative space-y-1">
              <p className="text-xs text-white/60">استشارات زراعية</p>
              <p className="text-2xl font-semibold">
                {activeConsultationsDemo}
              </p>
              <p className="text-[11px] text-white/50">
                هذا الحقل تجريبي حاليًا، ويمكن ربطه لاحقًا بجدول طلبات
                الاستشارات.
              </p>
            </div>
          </div>
        </section>

        {/* 🔔 تنبيهات الري للحقول */}
        <section className="rounded-3xl bg-black/60 border border-white/10 p-5 md:p-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm md:text-base font-semibold mb-1">
                تنبيهات الري الحالية
              </h2>
              <p className="text-[11px] text-white/60">
                تعتمد هذه التنبيهات على تاريخ آخر ري مسجل لكل حقل ونوع المحصول،
                لتخبرك متى يُفضّل الري أو إذا كنت متأخرًا عن الموعد.
              </p>
            </div>
          </div>

          {irrigationAlerts.length === 0 ? (
            <p className="text-[11px] text-emerald-300 bg-emerald-500/5 border border-emerald-500/40 rounded-2xl px-3 py-2">
              لا توجد حاليًا أي حقول تحتاج ري مستعجل أو قريب. استمر في تسجيل
              مواعيد الري من صفحة تفاصيل الحقل لتحسين دقة التوصيات.
            </p>
          ) : (
            <div className="space-y-2 text-xs md:text-sm">
              {irrigationAlerts.map(({ field, farmName, status }) => (
                <div
                  key={field.id}
                  className={`rounded-2xl px-4 py-3 border ${
                    status.tone === "urgent"
                      ? "bg-red-500/5 border-red-500/50"
                      : "bg-amber-500/5 border-amber-500/40"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div>
                      <p className="font-semibold">
                        {field.name || "حقل بدون اسم"}{" "}
                        <span className="text-white/60 text-[11px]">
                          — {farmName}
                        </span>
                      </p>
                      {field.crop_type && (
                        <p className="text-[11px] text-white/60">
                          نوع المحصول: {field.crop_type}
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/fields/${field.id}`}
                      className="text-[11px] rounded-xl border border-white/25 bg-white/10 px-2.5 py-1 hover:bg-white/20 transition"
                    >
                      عرض تفاصيل الحقل
                    </Link>
                  </div>

                  <p className="text-[12px] md:text-[13px]">{status.label}</p>

                  {field.last_watering_at && (
                    <p className="mt-1 text-[11px] text-white/50">
                      آخر ري مسجل:{" "}
                      {new Date(
                        field.last_watering_at
                      ).toLocaleString("ar-SA")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* أزرار الوصول السريع */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Link
            href="/farms/new"
            className="group rounded-3xl bg-black/60 border border-white/10 p-4 hover:border-[#4BA3FF] hover:bg-black/70 transition overflow-hidden"
          >
            <div className="flex items-start gap-3 relative z-10">
              <div className="h-10 w-10 rounded-2xl bg-[#0058E6]/20 flex items-center justify-center text-lg group-hover:scale-110 transition">
                ➕
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">إضافة مزرعة جديدة</p>
                <p className="text-[11px] text-white/60">
                  سجّل مزرعتك وحدد موقعها، ثم ابدأ في إضافة الحقول وتصوير
                  النباتات.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-40 transition bg-gradient-to-l from-[#0058E6] to-transparent" />
          </Link>

          <Link
            href="/assistant"
            className="group rounded-3xl bg-black/60 border border-white/10 p-4 hover:border-emerald-400 hover:bg-black/70 transition overflow-hidden"
          >
            <div className="flex items-start gap-3 relative z-10">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-lg group-hover:scale-110 transition">
                🤖
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">المساعد الذكي</p>
                <p className="text-[11px] text-white/60">
                  صوّر النباتات من جوالك، ودع النظام يحلل الأمراض والاحتياجات
                  الغذائية ومواعيد الري المقترحة.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-35 transition bg-gradient-to-l from-emerald-500 to-transparent" />
          </Link>

          <Link
            href="/consultants"
            className="group rounded-3xl bg-black/60 border border-white/10 p-4 hover:border-[#FFCC33] hover:bg-black/70 transition overflow-hidden"
          >
            <div className="flex items-start gap-3 relative z-10">
              <div className="h-10 w-10 rounded-2xl bg-[#FFCC33]/15 flex items-center justify-center text-lg group-hover:scale-110 transition">
                🌿
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">
                  ربط مع مستشار زراعي
                </p>
                <p className="text-[11px] text-white/60">
                  استعرض المستشارين المعتمدين، أسعارهم، ونطاق خدمتهم، واحجز
                  استشارة عن بعد أو زيارة ميدانية.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-35 transition bg-gradient-to-l from-[#FFCC33] to-transparent" />
          </Link>

          <Link
            href="/map"
            className="group rounded-3xl bg-black/60 border border-white/10 p-4 hover:border-white/60 hover:bg-black/70 transition overflow-hidden"
          >
            <div className="flex items-start gap-3 relative z-10">
              <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-lg group-hover:scale-110 transition">
                🗺️
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">الخريطة العامة</p>
                <p className="text-[11px] text-white/60">
                  استكشف على الخريطة مناطق الاشتراك، أنواع المزروعات، ومصادر
                  المياه المسجلة في المنصة.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-35 transition bg-gradient-to-l from-white to-transparent" />
          </Link>
        </section>

        {/* جدول المزارع + الحقول */}
        <section className="rounded-3xl bg-black/60 border border-white/10 p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm md:text-base font-semibold mb-1">
                المزارع المسجلة في حسابك
              </h2>
              <p className="text-[11px] text-white/60">
                البيانات في هذا الجدول قادمة مباشرة من جدول{" "}
                <span className="font-mono">farms</span> في Supabase، مع
                إمكانية استعراض الحقول وتقارير المساعد الذكي لكل مزرعة على
                حدة.
              </p>
            </div>
            <Link
              href="/farms/new"
              className="text-xs rounded-xl border border-white/25 bg-white/5 px-3 py-1.5 hover:bg-white/10 transition"
            >
              + إضافة مزرعة جديدة
            </Link>
          </div>

          {dataError && (
            <p className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2">
              {dataError}
            </p>
          )}

          {farms.length === 0 && !dataError && (
            <p className="text-[11px] text-white/60 bg:white/5 border border-white/10 rounded-2xl px-3 py-3">
              لا توجد مزارع مسجلة حتى الآن. ابدأ بإضافة مزرعة جديدة لتظهر هنا
              في لوحة التحكم.
            </p>
          )}

          {farms.length > 0 && (
            <div className="overflow-x-auto text-xs md:text-sm">
              <table className="w-full border-separate border-spacing-y-2">
                <thead className="text-[11px] md:text-xs text-white/60">
                  <tr>
                    <th className="text-right px-3 py-2">اسم المزرعة</th>
                    <th className="text-right px-3 py-2">الموقع</th>
                    <th className="text-right px-3 py-2">المساحة</th>
                    <th className="text-right px-3 py-2">النباتات الرئيسية</th>
                    <th className="text-right px-3 py-2">نوع الزراعة</th>
                    <th className="text-right px-3 py-2">مصدر المياه</th>
                    <th className="text-right px-3 py-2">تاريخ الإضافة</th>
                    <th className="text-right px-3 py-2">تفاصيل</th>
                  </tr>
                </thead>
                <tbody>
                  {farms.map((farm) => {
                    const farmFields = fields.filter(
                      (f) => f.farm_id === farm.id
                    );

                    return (
                      <tr key={farm.id} className="align-top">
                        <td colSpan={8} className="p-0">
                          <Link
                            href={`/farms/${farm.id}`}
                            className="block group"
                          >
                            <div className="bg-white/5 rounded-2xl overflow-hidden border border-transparent group-hover:border-[#4BA3FF]/60 group-hover:bg-white/10 transition">
                              <div className="grid grid-cols-8">
                                <div className="px-3 py-2 col-span-2">
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-[#0058E6]/20 text-[11px] text-[#4BA3FF] group-hover:scale-110 group-hover:bg-[#0058E6]/30 transition">
                                      {farmFields.length}
                                    </span>
                                    <div className="flex flex-col">
                                      <span className="font-semibold">
                                        {farm.name || "مزرعة بدون اسم"}
                                      </span>
                                      <span className="text-[10px] text-white/50">
                                        عدد الحقول المرتبطة:{" "}
                                        {farmFields.length}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="px-3 py-2 col-span-2">
                                  {farm.location_description ||
                                    "لم يتم تحديد الموقع نصيًا"}
                                </div>
                                <div className="px-3 py-2 col-span-1">
                                  {farm.area || "غير محددة"}
                                </div>
                                <div className="px-3 py-2 col-span-1">
                                  {farm.main_crops || "لم تُحدد بعد"}
                                </div>
                                <div className="px-3 py-2 col-span-1">
                                  {farm.farming_type || "غير محدد"}
                                </div>
                                <div className="px-3 py-2 col-span-1">
                                  {farm.water_source || "غير محدد"}
                                </div>
                                <div className="px-3 py-2 col-span-1 flex items-center justify-between">
                                  <span>
                                    {farm.created_at
                                      ? new Date(
                                          farm.created_at
                                        ).toLocaleDateString("ar-SA")
                                      : "—"}
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-[11px] text-white/60 group-hover:text-[#4BA3FF] transition">
                                    <span>عرض التفاصيل</span>
                                    <span className="translate-x-0 group-hover:translate-x-0.5 transition-transform">
                                      ⟵
                                    </span>
                                  </span>
                                </div>
                              </div>

                              {/* الحقول التابعة لهذه المزرعة (معاينة سريعة) */}
                              {farmFields.length > 0 && (
                                <div className="border-t border-white/10 px-3 py-3 bg-black/40">
                                  <p className="text-[11px] text-white/60 mb-2">
                                    قم بمعاينة سريعة لأحدث تقارير الحقول في هذه
                                    المزرعة:
                                  </p>
                                  <div className="space-y-2">
                                    {farmFields.slice(0, 2).map((field) => {
                                      const shortReport =
                                        field.latest_report &&
                                        (field.latest_report.length > 160
                                          ? field.latest_report.slice(0, 160) +
                                            "..."
                                          : field.latest_report);

                                      return (
                                        <div
                                          key={field.id}
                                          className="rounded-2xl bg:white/5 border border-white/10 px-3 py-2 text-[11px] md:text-xs bg-white/5"
                                        >
                                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                                            <div className="space-y-0.5">
                                              <p className="font-semibold text-xs">
                                                {field.name || "حقل بدون اسم"}
                                              </p>
                                              {field.crop_type && (
                                                <p className="text-white/65">
                                                  المحصول: {field.crop_type}
                                                </p>
                                              )}
                                              {field.area && (
                                                <p className="text-white/60">
                                                  المساحة: {field.area}
                                                </p>
                                              )}
                                            </div>
                                            {typeof field.latest_rating ===
                                              "number" && (
                                              <span className="self-start md:self-center inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-400/60 px-2.5 py-0.5 text-[10px] text-emerald-200">
                                                تقييم المساعد:{" "}
                                                {field.latest_rating} / 5
                                              </span>
                                            )}
                                          </div>

                                          {shortReport && (
                                            <p className="mt-2 text-[11px] text-white/70">
                                              {shortReport}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {farmFields.length > 2 && (
                                    <p className="mt-2 text-[10px] text-white/50">
                                      يوجد حقول إضافية وتفاصيل أكثر داخل صفحة
                                      المزرعة.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
