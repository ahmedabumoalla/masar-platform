"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// نفس منطق التحويل المستخدم في التسجيل
function normalizePhone(phone: string) {
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const englishDigits = "0123456789";

  const converted = phone.replace(/[٠-٩]/g, (d) => {
    const index = arabicDigits.indexOf(d);
    return index !== -1 ? englishDigits[index] : d;
  });

  return converted.replace(/[^0-9+]/g, "");
}

function emailFromPhone(phone: string) {
  const normalized = normalizePhone(phone);
  const localPart = normalized ? `u${normalized}` : "phone";
  return `${localPart}@masar.app`;
}

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = params.get("from") || "/dashboard";
  const loggedOut = params.get("logged_out");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError("فضلاً أدخل رقم الجوال أو البريد وكلمة المرور.");
      return;
    }

    setLoading(true);

    try {
      let emailToUse: string;

      if (identifier.includes("@")) {
        emailToUse = identifier.trim();
      } else {
        emailToUse = emailFromPhone(identifier);
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (signInError) {
        console.error("Supabase signIn error:", signInError);
        setError("بيانات الدخول غير صحيحة، تأكد من المدخلات.");
        return;
      }

      router.replace(from);
    } catch (err) {
      console.error("Unexpected login error:", err);
      setError("حدث خطأ غير متوقع أثناء تسجيل الدخول.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-black/70 border border-white/10 p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold mb-1">تسجيل الدخول إلى مسار</h1>
          <p className="text-xs text-white/60">
            يمكنك استخدام البريد الإلكتروني أو رقم الجوال الذي سجلت به، مع كلمة
            المرور، للوصول إلى لوحة التحكم ومزارعك.
          </p>
          {loggedOut && (
            <p className="mt-2 text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/40 rounded-xl px-3 py-2">
              تم تسجيل خروجك بنجاح.
            </p>
          )}
        </div>

        {error && (
          <p className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="space-y-1">
            <label className="block text-xs text-white/70">
              البريد الإلكتروني أو رقم الجوال
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
              placeholder="example@mail.com أو 05xxxxxxxx"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-white/70">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#0058E6] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0058E6]/40 hover:bg-[#1D7AF3] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "جاري تسجيل الدخول..." : "دخول إلى لوحة التحكم"}
          </button>

          <p className="text-[11px] text:white/50 text-center mt-1">
            ليس لديك حساب؟{" "}
            <button
              type="button"
              onClick={() => router.push("/auth/register")}
              className="text-[#4BA3FF] hover:underline"
            >
              إنشاء حساب جديد
            </button>
          </p>
        </form>
      </div>
    </main>
  );
}
