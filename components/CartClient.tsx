"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { CartItem, readCart, writeCart } from "@/lib/cart"

export default function CartClient() {
  const [items, setItems] = useState<CartItem[]>([])

  const load = () => setItems(writeCart(readCart()))

  useEffect(() => {
    load()
  }, [])

  const save = (nextItems: CartItem[]) => setItems(writeCart(nextItems))
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.qty, 0), [items])

  if (!items.length) {
    return (
      <section className="card panel">
        <h2 className="sectionTitle">السلة فارغة</h2>
        <p className="pageText">ابدأ من المتجر واختر المنتجات المناسبة لمزرعتك.</p>
        <Link className="primaryButton" href="/market" style={{ marginTop: 18 }}>الذهاب للمتجر</Link>
      </section>
    )
  }

  return (
    <div className="layoutTwo">
      <section className="card panel tableCard">
        <table className="dataTable">
          <thead><tr><th>المنتج</th><th>السعر</th><th>الكمية</th><th>الإجراء</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.slug}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img src={item.image} alt={item.name} style={{ width: 62, height: 62, objectFit: "contain" }} />
                    <div><strong>{item.name}</strong><br /><span>{item.company}</span></div>
                  </div>
                </td>
                <td>{item.price.toLocaleString("ar-SA")} ر.س</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button className="miniBtn" aria-label="تقليل الكمية" onClick={() => save(items.map((product) => product.slug === item.slug ? { ...product, qty: Math.max(1, product.qty - 1) } : product))}>-</button>
                    <strong>{item.qty}</strong>
                    <button className="miniBtn" aria-label="زيادة الكمية" onClick={() => save(items.map((product) => product.slug === item.slug ? { ...product, qty: product.qty + 1 } : product))}>+</button>
                  </div>
                </td>
                <td><button className="miniBtn" onClick={() => save(items.filter((product) => product.slug !== item.slug))}>حذف</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <aside className="card panel">
        <h2 className="sectionTitle">ملخص الطلب</h2>
        <p className="pageText">إجمالي المنتجات</p>
        <h3 className="pageTitle" style={{ fontSize: 34 }}>{total.toLocaleString("ar-SA")} ر.س</h3>
        <p className="pageText">يشمل تجهيز الطلب وربطه بحساب المزرعة بعد إتمام الدفع.</p>
        <Link className="primaryButton" href="/checkout" style={{ width: "100%", marginTop: 18 }}>إتمام الدفع</Link>
      </aside>
    </div>
  )
}
