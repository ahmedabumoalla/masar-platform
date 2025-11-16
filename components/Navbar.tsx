'use client';

import Link from 'next/link';
import Image from 'next/image';
import masarLogo from './assets/masar-logo.png'; // مسار الشعار الصحيح

export default function Navbar() {
  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        {/* الشعار */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={masarLogo}
            alt="منصة مسار"
            width={160}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </Link>

        {/* الروابط */}
        <div className="flex items-center gap-8 text-sm font-medium text-slate-100">
          <Link href="/" className="hover:text-emerald-400">
            الرئيسية
          </Link>
          <Link href="/farms" className="hover:text-emerald-400">
            مزارعي
          </Link>
          <Link href="/dashboard" className="hover:text-emerald-400">
            لوحة التحكم
          </Link>
        </div>
      </nav>
    </header>
  );
}
