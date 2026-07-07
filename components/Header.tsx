"use client"

import Link from "next/link"
import { Menu, ShoppingCart, User, X } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { readCart, writeCart } from "@/lib/cart"

const links = [
  { href: "/connect-device", label: "ربط جهاز" },
  { href: "/reports", label: "التقارير" },
  { href: "/overview", label: "نظرة عامة" },
  { href: "/market", label: "المتجر" },
  { href: "/ai-assistant", label: "المساعد الذكي" }
]

export default function Header() {
  const pathname = usePathname()
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const update = () => {
      const cart = writeCart(readCart())
      setCount(cart.reduce((sum, item) => sum + item.qty, 0))
    }

    update()
    window.addEventListener("storage", update)
    window.addEventListener("masar-cart-updated", update)
    return () => {
      window.removeEventListener("storage", update)
      window.removeEventListener("masar-cart-updated", update)
    }
  }, [])

  return (
    <header className="header">
      <div className="container nav">
        <Link href="/" className="brand" onClick={() => setOpen(false)} aria-label="مسار">
          مسار
        </Link>

        <nav className="navLinks" aria-label="روابط مسار">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
            return (
              <Link className={active ? "active" : ""} key={link.href} href={link.href}>
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="actions">
          <Link className="headerButton desktopOnly" href="/consultations">
            احجز مختص
            <User size={18} />
          </Link>
          <Link href="/cart" className="cartBtn" aria-label="السلة">
            <ShoppingCart size={21} />
            <span className="cartBadge">{count}</span>
          </Link>
          <button className="menuBtn mobileOnly" aria-label="القائمة" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="mobileMenu container" aria-label="قائمة الجوال">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link className="headerButton" href="/consultations" onClick={() => setOpen(false)}>
            احجز مختص
            <User size={18} />
          </Link>
        </nav>
      )}
    </header>
  )
}
