import "leaflet/dist/leaflet.css";
import "./globals.css";
import type { Metadata } from "next";
import Image from "next/image";
import MainHeaderActions from "@/components/main-header-actions";

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
      <body className="min-h-screen bg-gradient-to-b from-[#02040b] via-[#020617] to-black text-white antialiased">
        {/* شريط علوي بسيط */}
        <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
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
                <p className="text-sm font-semibold">مسار</p>
                <p className="text-[11px] text-white/60">
                  شريكك الذكي لرفع كفاءة الري وتقليل الهدر المائي
                </p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-4 text-xs text-white/70">
              <a href="/" className="hover:text-white transition">
                الرئيسية
              </a>
              <a href="#about" className="hover:text-white transition">
                عن مسار
              </a>
              <a href="#services" className="hover:text-white transition">
                الخدمات
              </a>
              <a href="#contact" className="hover:text-white transition">
                تواصل معنا
              </a>
            </nav>

            {/* ✅ هنا من يحكم: مسجّل دخول ولا لا */}
            <MainHeaderActions />
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
