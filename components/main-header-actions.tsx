// components/main-header-actions.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type UserState = "loading" | "guest" | "auth";

export default function MainHeaderActions() {
  const [state, setState] = useState<UserState>("loading");

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setState(user ? "auth" : "guest");
      } catch (err) {
        console.error("header getUser error:", err);
        setState("guest");
      }
    };

    checkUser();
  }, []);

  // نخلي فيه ارتفاع بسيط عشان ما يتحرك الهيدر وقت التحميل
  if (state === "loading") {
    return <div className="h-8" />;
  }

  // لو المستخدم مسجل دخول → نعرض رابط لوحة التحكم فقط
  if (state === "auth") {
    return (
      <Link
        href="/dashboard"
        className="inline-flex items-center rounded-full bg-[#0058E6] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#1D7AF3] transition"
      >
        لوحة التحكم
      </Link>
    );
  }

  // 🟢 حالة الزائر (ما هو مسجل دخول)
  return (
    <div className="flex items-center gap-2 text-xs">
      {/* رابط الدخول */}
      <Link
        href="/auth/login"
        className="text-slate-700 hover:text-slate-900 transition"
      >
        دخول
      </Link>

      {/* زر تسجيل حساب جديد – هنا المشكلة كانت، تأكدنا إن لون النص واضح */}
      <Link
        href="/auth/register"
        className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50/60 px-3 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition"
      >
        تسجيل حساب جديد
      </Link>

      {/* زر قدّم كمستشار زراعي – نفس اللي في الصورة */}
      <Link
        href="/consultants/apply"
        className="inline-flex items-center rounded-full bg-[#F9C74F] px-3.5 py-1.5 text-[11px] font-semibold text-slate-900 shadow-sm hover:bg-[#F7B935] transition"
      >
        قدّم كمستشار زراعي
      </Link>
    </div>
  );
}
