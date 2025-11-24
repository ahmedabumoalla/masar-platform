"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type UserRole = "owner" | "farmer" | "supervisor";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole | "">("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim() || !password.trim()) {
      setError("فضلاً أدخل البريد الإلكتروني وكلمة المرور.");
      return;
    }

    if (!role) {
      setError("فضلاً اختر نوع الحساب (مالك، مزارع، مشرف).");
      return;
    }

    setLoading(true);

    try {
      // 1) إنشاء الحساب في Supabase Auth بالبريد + كلمة المرور
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName || null,
            phone: phone || null,
            role: role,
          },
        },
      });

      if (error) {
        console.error("signUp error:", error);
        setError(error.message || "تعذر إنشاء الحساب، حاول مرة أخرى.");
        setLoading(false);
        return;
      }

      const user = data.user;
      if (user) {
        // 2) حفظ بيانات البروفايل في جدول profiles (معرّف على auth.users.id)
        try {
          await supabase
            .from("profiles")
            .upsert(
              {
                id: user.id, // يفترض أن عمود id في profiles هو نفس auth.users.id
                full_name: fullName || null,
                phone: phone || null,
                role: role,
              },
              { onConflict: "id" }
            );
        } catch (err) {
          console.error("profiles upsert error:", err);
          // ما نوقف المستخدم، بس نطبع الخطأ
        }
      }

      setInfo(
        "تم إنشاء حسابك بنجاح. يمكنك الآن تسجيل الدخول واستخدام منصة مسار."
      );
      // توجيه بعد ثانيتين مثلاً
      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError("حدث خطأ غير متوقع أثناء إنشاء الحساب.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7FAFB] text-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            إنشاء حساب جديد في مسار
          </h1>
          <p className="text-xs text-slate-500">
            سجّل بياناتك الأساسية لبدء استخدام منصة الري الذكي وإدارة مزارعك.
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4">
          {error && (
            <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {info && (
            <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              {info}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-sm">
            <div className="space-y-1">
              <label className="block text-xs text-slate-700">
                الاسم الكامل
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: محمد أحمد القحطاني"
                className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-[#4BA3FF] focus:ring-1 focus:ring-[#4BA3FF]"
              />
            </div>

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
                رقم الجوال (اختياري)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XXXXXXXX"
                className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-[#4BA3FF] focus:ring-1 focus:ring-[#4BA3FF]"
              />
              <p className="text-[10px] text-slate-500">
                يستخدم رقم الجوال للتواصل وتخصيص الصلاحيات لاحقاً، ولن يظهر
                للآخرين.
              </p>
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

            <div className="space-y-1">
              <label className="block text-xs text-slate-700">
                نوع الحساب
              </label>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setRole("owner")}
                  className={`rounded-xl border px-2 py-2 ${
                    role === "owner"
                      ? "border-[#0058E6] bg-[#0058E6]/10 text-[#0058E6] font-semibold"
                      : "border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  مالك المزرعة
                </button>
                <button
                  type="button"
                  onClick={() => setRole("farmer")}
                  className={`rounded-xl border px-2 py-2 ${
                    role === "farmer"
                      ? "border-[#0058E6] bg-[#0058E6]/10 text-[#0058E6] font-semibold"
                      : "border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  مزارع
                </button>
                <button
                  type="button"
                  onClick={() => setRole("supervisor")}
                  className={`rounded-xl border px-2 py-2 ${
                    role === "supervisor"
                      ? "border-[#0058E6] bg-[#0058E6]/10 text-[#0058E6] font-semibold"
                      : "border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  مشرف مزرعة
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#0058E6] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0058E6]/25 hover:bg-[#1D7AF3] transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب جديد"}
            </button>
          </form>

          <p className="text-[11px] text-slate-600 text-center pt-1">
            لديك حساب مسبقاً؟{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-[#0058E6] hover:underline"
            >
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
