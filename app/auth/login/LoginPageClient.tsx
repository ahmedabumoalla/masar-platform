"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("from") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("فضلاً أدخل البريد الإلكتروني وكلمة المرور.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("login error:", error);
        setError(
          error.message === "Invalid login credentials"
            ? "بيانات الدخول غير صحيحة. تأكد من البريد وكلمة المرور."
            : "تعذر تسجيل الدخول حالياً. حاول مرة أخرى."
        );
        return;
      }

      if (!data.session) {
        setError("لم يتم إنشاء جلسة دخول. حاول مرة أخرى بعد قليل.");
        return;
      }

      router.replace(redirectTo);
    } catch (err) {
      console.error("login exception:", err);
      setError("حدث خطأ غير متوقع أثناء تسجيل الدخول.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#F7FAFB] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="relative h-12 w-12">
            <Image
              src="/assets/masar-logo.png"
              alt="Masar"
              fill
              className="object-contain rounded-2xl"
            />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            تسجيل الدخول إلى مسار
          </h1>
          <p className="text-xs text-slate-500 text-center max-w-sm">
            أدخل بيانات حسابك للوصول إلى لوحة تحكم مزارعك ومساعد مسار الذكي.
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4">
          {error && (
            <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-sm">
            <div className="space-y-1">
              <label className="block text-xs text-slate-700">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-[#4BA3FF] focus:ring-1 focus:ring-[#4BA3FF]"
                placeholder="name@example.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-slate-700">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-[#4BA3FF] focus:ring-1 focus:ring-[#4BA3FF]"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#0058E6] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0058E6]/25 hover:bg-[#1D7AF3] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center pt-1">
            ما عندك حساب؟{" "}
            <a
              href="/auth/register"
              className="text-[#0058E6] font-semibold hover:underline"
            >
              سجّل حساب جديد
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
