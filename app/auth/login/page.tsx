"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("from") || "/dashboard";

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
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("signIn error:", error);
        setError(error.message || "تعذر تسجيل الدخول، تأكد من البيانات.");
        setLoading(false);
        return;
      }

      router.replace(redirectTo);
    } catch (err: any) {
      console.error(err);
      setError("حدث خطأ غير متوقع أثناء تسجيل الدخول.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7FAFB] text-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            تسجيل الدخول إلى مسار
          </h1>
          <p className="text-xs text-slate-500">
            ادخل إلى لوحة التحكم لإدارة مزارعك ومتابعة التقارير والتحليلات.
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
                placeholder="example@domain.com"
                className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-[#4BA3FF] focus:ring-1 focus:ring-[#4BA3FF]"
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
                placeholder="••••••••"
                className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-[#4BA3FF] focus:ring-1 focus:ring-[#4BA3FF]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#0058E6] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0058E6]/25 hover:bg-[#1D7AF3] transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          <p className="text-[11px] text-slate-600 text-center pt-1">
            لا تملك حساباً بعد؟{" "}
            <Link
              href="/auth/register"
              className="font-semibold text-[#0058E6] hover:underline"
            >
              إنشاء حساب جديد
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
