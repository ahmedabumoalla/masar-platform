"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type AuthState = "unknown" | "authenticated" | "unauthenticated";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("unknown");

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          setAuthState("unauthenticated");
        } else {
          setAuthState("authenticated");
        }
      } catch (err) {
        console.error("Navbar getUser error:", err);
        setAuthState("unauthenticated");
      }
    };

    checkUser();
  }, []);

  const isDashboard = pathname === "/dashboard";

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-black/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* الشعار / اسم المنصة */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-2"
        >
          <div className="h-8 w-8 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-lg">
            🌱
          </div>
          <div className="text-right">
            <p className="text-xs text-emerald-200">منصة إدارة الري والمزارع</p>
            <p className="text-sm font-semibold">مسار</p>
          </div>
        </button>

        {/* الأزرار يمين */}
        <div className="flex items-center gap-2 text-xs">
          {authState === "authenticated" ? (
            // ✅ مستخدم مسجل دخول → زر واحد فقط: لوحة التحكم
            <Link
              href="/dashboard"
              className={`rounded-xl px-4 py-2 border transition ${
                isDashboard
                  ? "bg-emerald-500/20 border-emerald-400 text-emerald-100"
                  : "bg-white/5 border-white/20 text-white/90 hover:bg-white/10"
              }`}
            >
              لوحة التحكم
            </Link>
          ) : (
            // ❌ غير مسجل → زر دخول + تسجيل جديد
            <>
              <Link
                href="/auth/login"
                className="rounded-xl border border-white/25 bg-white/5 px-3 py-2 text-white/90 hover:bg-white/10 transition"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/auth/register"
                className="rounded-xl bg-[#0058E6] px-3 py-2 text-white font-semibold shadow-md shadow-[#0058E6]/40 hover:bg-[#1D7AF3] transition"
              >
                إنشاء حساب
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
