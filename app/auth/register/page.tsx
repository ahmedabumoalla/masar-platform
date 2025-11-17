"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

// الكومبوننت الأساسي للصفحة
function RegisterPageInner() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg("فضلاً أدخل البريد الإلكتروني.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || null,
          },
        },
      });

      if (error) {
        console.error("signUp error:", error);
        setErrorMsg(
          error.message || "تعذر إنشاء الحساب، حاول مرة أخرى بعد قليل."
        );
        setLoading(false);
        return;
      }

      if (data.user && !data.session) {
        setSuccessMsg(
          "تم إنشاء الحساب بنجاح، فضلاً تحقق من بريدك الإلكتروني لتفعيل الحساب ثم سجّل دخولك."
        );
      } else {
        setSuccessMsg("تم إنشاء الحساب بنجاح.");
      }

      setTimeout(() => {
        router.replace("/auth/login?registered=1");
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMsg("حدث خطأ غير متوقع أثناء إنشاء الحساب.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white">
      <div className="mx-auto max-w-md px-4 pt-24 pb-16 space-y-6">
        <section className="rounded-3xl bg-black/70 border border-white/10 p-6 md:p-7 space-y-5">
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-1">
              إنشاء حساب جديد في مسار
            </h1>
            <p className="text-xs md:text-sm text-white/60">
              استخدم بريدك الإلكتروني لإنشاء حساب مزارع، ويمكنك لاحقًا ربط
              مزارعك وحقولك ورفع صور النباتات لتحليلها بالذكاء الاصطناعي.
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/40 px-4 py-3 text-sm text-red-200">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/40 px-4 py-3 text-sm text-emerald-200">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="space-y-1">
              <label className="block text-xs text-white/70">
                الاسم الكامل (اختياري)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
                placeholder="مثال: عبد الله أبو معلا"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-white/70">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
                placeholder="example@farm.com"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-white/70">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
                placeholder="6 أحرف على الأقل"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[#0058E6] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0058E6]/40 hover:bg-[#1D7AF3] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
            </button>
          </form>

          <p className="text-[11px] text-white/60 text-center mt-2">
            لديك حساب سابق؟{" "}
            <Link
              href="/auth/login"
              className="text-[#4BA3FF] hover:underline"
            >
              سجّل الدخول من هنا
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

// الواجهة المصدّرة مع Suspense
export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
          <p className="text-sm text-white/70">
            جاري تحميل صفحة إنشاء الحساب...
          </p>
        </main>
      }
    >
      <RegisterPageInner />
    </Suspense>
  );
}
