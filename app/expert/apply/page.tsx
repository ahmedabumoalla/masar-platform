"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ExpertApplyPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [region, setRegion] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [bio, setBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/auth/login?from=/expert/apply");
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg("فضلاً أدخل اسمك الكامل.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("experts").insert([
      {
        user_id: user.id,
        full_name: fullName.trim(),
        region: region.trim() || null,
        specialties: specialties.trim() || null,
        bio: bio.trim() || null,
        contact_whatsapp: whatsapp.trim() || null,
      },
    ]);
    setLoading(false);

    if (error) {
      setErrorMsg("تعذر حفظ طلبك كمستشار.");
      return;
    }

    setSuccessMsg("تم حفظ طلبك، يمكنك إدارة ملفك من لوحة المستشار.");
    router.replace("/expert/dashboard");
  };

  return (
    <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white">
      <div className="mx-auto max-w-3xl px-4 pt-10 pb-16 space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold mb-1">
            التقديم كمستشار زراعي في مسار
          </h1>
          <p className="text-xs md:text-sm text-white/60">
            إن كنت تمتلك خبرة عملية في إدارة المزارع أو البيوت المحمية أو
            المحاصيل، يمكنك التقديم ليتم ربطك بالمزارعين داخل المنصة.
          </p>
        </div>

        {errorMsg && (
          <p className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2">
            {errorMsg}
          </p>
        )}
        {successMsg && (
          <p className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/40 rounded-xl px-3 py-2">
            {successMsg}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="space-y-1">
            <label className="block text-xs text-white/70">الاسم الكامل *</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
              placeholder="مثال: م. أحمد – خبير خضروات"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-white/70">المنطقة</label>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
              placeholder="عسير، الرياض، القصيم..."
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-white/70">
              التخصصات (محاصيل، مجالات)
            </label>
            <input
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
              placeholder="خضروات، بيوت محمية، فواكه، نخيل..."
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-white/70">نبذة مختصرة</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
              placeholder="اكتب نبذة عن خبراتك الزراعية..."
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-white/70">
              رقم الواتساب للتواصل
            </label>
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
              placeholder="05xxxxxxxx"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full md:w-auto rounded-xl bg-[#FFCC33] px-6 py-2.5 text-sm font-semibold text-black hover:bg-[#FFD84F] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "جاري إرسال الطلب..." : "إرسال الطلب"}
          </button>
        </form>
      </div>
    </main>
  );
}
