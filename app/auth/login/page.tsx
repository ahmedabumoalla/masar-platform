import { Suspense } from "react";
import type { Metadata } from "next";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "تسجيل الدخول | مسار",
  description: "تسجيل الدخول إلى منصة مسار لإدارة الري الذكي ومزارعك.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[calc(100vh-64px)] bg-[#F7FAFB] flex items-center justify-center px-4 py-10">
          <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-600 shadow-sm">
            جاري تحميل صفحة تسجيل الدخول...
          </div>
        </main>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}
