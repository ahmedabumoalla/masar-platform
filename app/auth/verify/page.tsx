"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: التحقق من الكود من الباك-إند
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#050814] via-[#02040b] to-black text-white">
      <div className="mx-auto max-w-md px-4 pt-24 pb-16">
        <div className="rounded-3xl bg-black/60 border border-white/10 p-6 space-y-5">
          <h1 className="text-xl font-bold mb-2">إدخال كود التحقق</h1>
          <p className="text-xs text-white/60 mb-2">
            أدخل كود التحقق المكون من 4 أرقام الذي وصلك عبر الجوال أو البريد الإلكتروني.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="space-y-1">
              <label className="block text-xs text-white/70">
                كود التحقق (4 أرقام)
              </label>
              <input
                type="text"
                maxLength={4}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
                className="w-full tracking-[0.5em] text-center text-lg rounded-xl bg-black/40 border border-white/15 px-3 py-2 focus:outline-none focus:border-[#4BA3FF]"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-3 rounded-xl bg-[#0058E6] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0058E6]/40 hover:bg-[#1D7AF3] transition"
            >
              تأكيد والدخول للوحة التحكم
            </button>

            <p className="text-[11px] text-white/50 mt-2">
              في النسخة الحالية، سيتم نقلك مباشرة إلى لوحة التحكم بعد إدخال أي كود (للعرض
              فقط). لاحقًا يتم ربط الكود بالنظام الفعلي.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
