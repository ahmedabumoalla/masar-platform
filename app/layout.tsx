import type { Metadata } from "next"
import "./globals.css"
import Header from "@/components/Header"

export const metadata: Metadata = {
  title: "مسار | منصة زراعية ذكية",
  description: "منصة زراعية ذكية لإدارة الري وقراءة البيانات وطلب الاستشارات والمنتجات الزراعية."
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Header />
        {children}
      </body>
    </html>
  )
}
