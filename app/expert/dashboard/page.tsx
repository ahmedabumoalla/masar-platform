"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Expert = {
  id: string;
  full_name: string;
  region: string | null;
  specialties: string | null;
  bio: string | null;
  contact_whatsapp: string | null;
};

export default function ExpertDashboardPage() {
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErrorMsg("يجب تسجيل الدخول للوصول للوحة المستشار.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("experts")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        setErrorMsg(
          "لم يتم العثور على ملف مستشار لك. يمكنك التقديم من صفحة التقديم."
        );
        setLoading(false);
        return;
      }

      setExpert(data as Expert);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white">
        <div className="rounded-3xl bg-black/70 border border-white/10 px-6 py-4 text-sm text-white/70">
          يتم تحميل بياناتك كمستشار...
        </div>
      </main>
    );
  }

  if (errorMsg) {
    return (
      <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white">
        <div className="mx-auto max-w-3xl px-4 pt-10 pb-16 space-y-4 text-sm">
          <p className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2">
            {errorMsg}
          </p>
          <Link
            href="/expert/apply"
            className="text-xs rounded-xl bg-[#FFCC33] px-4 py-2 font-semibold text-black hover:bg-[#FFD84F] transition inline-block"
          >
            التقديم كمستشار زراعي
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white">
      <div className="mx-auto max-w-4xl px-4 pt-10 pb-16 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-1">
              لوحة المستشار الزراعي
            </h1>
            <p className="text-xs md:text-sm text-white/60">
              هذا عرض مبسط لملفك كمستشار. يمكن لاحقًا ربطه بطلبات استشارة من
              المزارعين.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs rounded-xl border border-white/25 bg-white/5 px-3 py-1.5 hover:bg-white/10 transition"
          >
            الرجوع للداشبورد
          </Link>
        </div>

        {expert && (
          <section className="rounded-3xl bg-black/60 border border-white/10 p-5 space-y-3 text-xs md:text-sm">
            <p className="text-sm font-semibold">{expert.full_name}</p>
            <p className="text-[11px] text-white/60">
              المنطقة: {expert.region || "غير محددة"}
            </p>
            <p className="text-[11px] text-white/60">
              التخصصات: {expert.specialties || "غير محددة"}
            </p>
            <p className="text-[11px] text-white/60">
              نبذة: {expert.bio || "لم تتم إضافة نبذة بعد."}
            </p>
            <p className="text-[11px] text-emerald-300">
              واتساب للتواصل: {expert.contact_whatsapp || "غير محدد"}
            </p>
            <p className="text-[11px] text-white/50 mt-2">
              يمكن لاحقًا إضافة إدارة أسعار الاستشارات، أوقات التوفر، وتتبع
              الطلبات من المزارعين.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
