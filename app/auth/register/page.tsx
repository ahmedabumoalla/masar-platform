"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("فضلاً أدخل اسمك الثلاثي.");
      return;
    }

    if (!email.trim()) {
      setError("فضلاً أدخل البريد الإلكتروني.");
      return;
    }

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("تأكيد كلمة المرور لا يطابق كلمة المرور.");
      return;
    }

    try {
      setLoading(true);

      // ✅ تسجيل باستخدام البريد فقط
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        console.error(signUpError);
        setError(
          signUpError.message ||
            "تعذر إنشاء الحساب حالياً، حاول مرة أخرى لاحقاً."
        );
        setLoading(false);
        return;
      }

      // بعد التسجيل نروح مباشرة لصفحة تسجيل الدخول
      router.replace("/auth/login?registered=1");
    } catch (err) {
      console.error(err);
      setError("حدث خطأ غير متوقع أثناء إنشاء الحساب.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#020617] via-[#050816] to-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-black/70 border border-white/10 p-6 md:p-7 shadow-2xl shadow-black/60">
        <h1 className="text-xl md:text-2xl font-bold mb-2 text-center">
          إنشاء حساب جديد في مسار
        </h1>
        <p className="text-xs md:text-sm text-white/60 text-center mb-5">
          أدخل بياناتك لإنشاء حساب وإدارة مزارعك وحقولك من لوحة التحكم.
        </p>

        {error && (
          <div className="mb-4 rounded-2xl bg-red-500/10 border border-red-500/40 px-3 py-2 text-xs md:text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div className="space-y-1">
            <label className="block text-xs text-white/70">
              الاسم الكامل (سيظهر في لوحة التحكم)
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
              placeholder="مثال: عبدالله أبو معلا"
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
              placeholder="example@domain.com"
            />
          </div>

          {/* ✅ لا يوجد رقم جوال */}

          <div className="space-y-1">
            <label className="block text-xs text-white/70">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-white/70">
              تأكيد كلمة المرور
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
              placeholder="أعد كتابة كلمة المرور"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-3 w-full rounded-xl bg-[#0058E6] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0058E6]/40 hover:bg-[#1D7AF3] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
          </button>
        </form>

        <p className="mt-4 text-[11px] text-white/60 text-center">
          لديك حساب مسبقاً؟{" "}
          <button
            type="button"
            onClick={() => router.push("/auth/login")}
            className="text-[#4BA3FF] hover:underline"
          >
            تسجيل الدخول
          </button>
        </p>
      </div>
    </main>
  );
}
