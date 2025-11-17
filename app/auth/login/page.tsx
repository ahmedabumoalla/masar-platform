"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const from = searchParams.get("from");
  const loggedOut = searchParams.get("logged_out");
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError || !data.session) {
        throw signInError || new Error("تعذر تسجيل الدخول.");
      }

      // لو فيه from نرجع له، غير كذا نروح للداشبورد
      router.replace(from || "/dashboard");
    } catch (err: any) {
      setError(err?.message || "حدث خطأ غير متوقع أثناء تسجيل الدخول.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto mt-24 max-w-md rounded-3xl bg-black/70 border border-white/10 px-6 py-7 text-white space-y-5">
      <div>
        <h1 className="text-xl font-bold mb-1">تسجيل الدخول لحسابك</h1>
        <p className="text-xs text-white/60">
          أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى لوحـة تحكم مزارعك في مسار.
        </p>
      </div>

      {(loggedOut || errorParam || error) && (
        <div
          className={`text-xs rounded-2xl px-3 py-2 border ${
            loggedOut
              ? "bg-emerald-500/10 border-emerald-400/60 text-emerald-100"
              : "bg-red-500/10 border-red-400/60 text-red-100"
          }`}
        >
          {loggedOut && "تم تسجيل خروجك بنجاح من الحساب."}
          {errorParam && !loggedOut && "انتهت صلاحية الجلسة، فضلاً قم بتسجيل الدخول مجددًا."}
          {error && !loggedOut && !errorParam && error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="space-y-1">
          <label className="block text-xs text-white/70">البريد الإلكتروني</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
            placeholder="example@domain.com"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs text-white/70">كلمة المرور</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 rounded-xl bg-[#0058E6] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0058E6]/40 hover:bg-[#1D7AF3] transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
        </button>
      </form>

      <p className="text-[11px] text-white/50">
        ليس لديك حساب؟ يمكنك إنشاء حساب جديد من صفحة التسجيل.
      </p>
    </section>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#050814] via-[#02040b] to-black text-white">
      <div className="mx-auto max-w-5xl px-4 pt-20 pb-16">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-white/40 mb-2">
            مسار · نظام إدارة المزارع الذكي
          </p>
          <h2 className="text-2xl md:text-3xl font-bold">
            أهلاً برجوعك إلى <span className="text-[#4BA3FF]">مسار</span> 👋
          </h2>
          <p className="text-xs md:text-sm text-white/60 mt-1">
            سجّل الدخول لمتابعة مراقبة مزارعك، حقولك، وتوصيات الري والعناية بالنباتات.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="mt-16 text-center text-sm text-white/60">
              جارٍ تجهيز صفحة تسجيل الدخول...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
