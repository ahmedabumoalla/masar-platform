import "leaflet/dist/leaflet.css";
import "./globals.css";
import type { Metadata } from "next";
import Image from "next/image";
import MainHeaderActions from "@/components/main-header-actions";
import { Cairo } from 'next/font/google'

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['400', '700', '900'],
})


export const metadata: Metadata = {
  title: "مسار | منصة الري الذكي",
  description:
    "مسار منصة ذكية تربط المزارع بالمستشعرات والمساعد الذكي لرفع كفاءة الري وتقليل الهدر المائي.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      {/* خلفية فاتحة مريحة + نص غامق */}
      <body className={`${cairo.className} bg-[#F7FAFB]`}>
        {/* شريط علوي بسيط */}
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9">
                <Image
                  src="/assets/masar-logo.png"
                  alt="Masar"
                  fill
                  className="object-contain rounded-xl"
                />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-slate-900">مسار</p>
                <p className="text-[11px] text-slate-600">
                  شريكك الذكي لرفع كفاءة الري وتقليل الهدر المائي
                </p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-4 text-xs text-slate-600">
              <a href="/" className="hover:text-slate-900 transition">
                الرئيسية
              </a>
              <a href="#about" className="hover:text-slate-900 transition">
                عن مسار
              </a>
              <a href="#services" className="hover:text-slate-900 transition">
                الخدمات
              </a>
              <a href="#contact" className="hover:text-slate-900 transition">
                تواصل معنا
              </a>
            </nav>

            {/* يعتمد على حالة المستخدم (مسجّل/غير مسجّل) */}
            <MainHeaderActions />
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
