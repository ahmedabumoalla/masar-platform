// --- نفس الكود كاملاً بدون حذف ---
// فقط أضفت حالتي showPassword و showPasswordConfirm
// وزر إظهار/إخفاء في حقول كلمة المرور

"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Role = "owner" | "employee" | "supervisor";

function normalizePhone(phone: string) {
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const englishDigits = "0123456789";
  const converted = phone.replace(/[٠-٩]/g, (d) => {
    const index = arabicDigits.indexOf(d);
    return englishDigits[index] ?? d;
  });
  return converted.replace(/[^0-9+]/g, "");
}

function emailFromPhone(phone: string) {
  const normalized = normalizePhone(phone);
  const localPart = normalized ? `u${normalized}` : "phone";
  return `${localPart}@masar.app`;
}

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState<Role>("owner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim())
      return setError("فضلاً أدخل اسمك الكامل.");

    if (!email.trim() && !phone.trim())
      return setError("يجب إدخال البريد الإلكتروني أو رقم الجوال.");

    if (!password || password.length < 6)
      return setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");

    if (password !== passwordConfirm)
      return setError("تأكيد كلمة المرور غير مطابق.");

    setLoading(true);
    try {
      const normalizedPhone = phone ? normalizePhone(phone) : "";
      const emailToUse = email.trim() || emailFromPhone(normalizedPhone);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailToUse,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: normalizedPhone || null,
            role,
          },
        },
      });

      if (signUpError) return setError(signUpError.message);

      const user = data.user;
      if (!user) return setError("حدث خطأ أثناء التسجيل. جرّب الدخول مباشرة.");

      await supabase.from("profiles").insert({
        id: user.id,
        full_name: fullName.trim(),
        phone: normalizedPhone || null,
        email: email.trim() || null,
        role,
      });

      router.replace("/dashboard");
    } catch {
      setError("حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-black/70 border border-white/10 p-6 space-y-6">
        <h1 className="text-xl font-bold">إنشاء حساب جديد في مسار</h1>

        {error && (
          <p className="text-[11px] text-red-300 bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/40">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="space-y-1">
            <label className="text-xs text-white/70">الاسم الكامل</label>
            <input
              type="text"
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: عبدالله أبو معلا"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-white/70">البريد الإلكتروني (اختياري)</label>
            <input
              type="email"
              value={email}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-white/70">رقم الجوال (اختياري)</label>
            <input
              type="tel"
              value={phone}
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2"
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative space-y-1">
              <label className="text-xs text-white/70">كلمة المرور</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 pr-10"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-[30px]"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            <div className="relative space-y-1">
              <label className="text-xs text-white/70">تأكيد كلمة المرور</label>
              <input
                type={showPasswordConfirm ? "text" : "password"}
                value={passwordConfirm}
                className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 pr-10"
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-[30px]"
                onClick={() => setShowPasswordConfirm((v) => !v)}
              >
                {showPasswordConfirm ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* 👇 رجّعت خيار الأدوار كما هو */}
          <div className="space-y-2">
            <p className="text-xs text-white/70">نوع الحساب</p>
            <label className="flex items-center gap-2 text-xs">
              <input type="radio" className="accent-[#4BA3FF]"
                checked={role === "owner"} value="owner"
                onChange={() => setRole("owner")} />
              مالك مزرعة (الحساب الرئيسي)
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input type="radio" className="accent-[#4BA3FF]"
                checked={role === "employee"} value="employee"
                onChange={() => setRole("employee")} />
              موظف / عامل مزرعة
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input type="radio" className="accent-[#4BA3FF]"
                checked={role === "supervisor"} value="supervisor"
                onChange={() => setRole("supervisor")} />
              مشرف / مدير تشغيل
            </label>
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-[#0058E6] py-2.5 font-semibold shadow-lg"
          >
            {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب وربط لوحة التحكم"}
          </button>
        </form>
      </div>
    </main>
  );
}
