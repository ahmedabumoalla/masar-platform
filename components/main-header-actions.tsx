"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function MainHeaderActions() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setIsLoggedIn(!!user);
      } catch (err) {
        console.error("header getUser error:", err);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  if (loading) {
    // بس مساحة فاضية عشان ما يطقّز الهيدر
    return <div className="h-8" />;
  }

  // ✅ مستخدم مسجّل دخول
  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <Link
          href="/dashboard"
          className="rounded-xl bg-[#0058E6] px-3 py-1.5 font-semibold text-white shadow-lg shadow-[#0058E6]/40 hover:bg-[#1D7AF3] transition"
        >
          لوحة التحكم
        </Link>

        {/* نترك خيار المستشار موجود دائمًا */}
        <Link
          href="/expert/apply"
          className="hidden sm:inline-flex rounded-xl bg-[#FFCC33] px-3 py-1.5 text-black font-semibold hover:bg-[#FFD84F] transition"
        >
          قدّم كمستشار زراعي
        </Link>
      </div>
    );
  }

  // ❌ مو مسجّل دخول
  return (
    <div className="flex items-center gap-2 text-xs">
      <Link
        href="/auth/login"
        className="rounded-xl border border-white/25 bg-white/5 px-3 py-1.5 hover:bg-white/10 transition"
      >
        دخول
      </Link>
      <Link
        href="/auth/register"
        className="rounded-xl border border-emerald-400/60 bg-emerald-500/10 px-3 py-1.5 text-emerald-100 hover:bg-emerald-500/20 transition"
      >
        تسجيل جديد
      </Link>
      <Link
        href="/expert/apply"
        className="hidden sm:inline-flex rounded-xl bg-[#FFCC33] px-3 py-1.5 text-black font-semibold hover:bg-[#FFD84F] transition"
      >
        قدّم كمستشار زراعي
      </Link>
    </div>
  );
}
