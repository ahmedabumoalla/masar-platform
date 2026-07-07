"use client"

import { useEffect, useMemo, useState } from "react"
import { CartItem, readCart, writeCart } from "@/lib/cart"

export default function CheckoutForm() {
  const [items, setItems] = useState<CartItem[]>([])
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setItems(writeCart(readCart()))
  }, [])

  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.qty, 0), [items])

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!items.length) {
      setError("السلة فارغة. أضف منتجات قبل الدفع.")
      return
    }

    const data = new FormData(event.currentTarget)
    const required = ["name", "phone", "email", "farm", "address", "payment"]
    const missing = required.some((key) => !String(data.get(key) || "").trim())

    if (missing) {
      setError("أكمل بيانات الدفع والتوصيل.")
      return
    }

    setError("")
    setDone(true)
    localStorage.removeItem("masar-cart")
    window.dispatchEvent(new Event("masar-cart-updated"))
    setItems([])
  }

  return (
    <div className="layoutTwo">
      <form className="card panel" onSubmit={submit}>
        <div className="formGrid">
          <label className="field"><span className="label">الاسم</span><input name="name" className="input" required /></label>
          <label className="field"><span className="label">رقم الجوال</span><input name="phone" className="input" inputMode="tel" required /></label>
          <label className="field"><span className="label">البريد الإلكتروني</span><input name="email" className="input" type="email" required /></label>
          <label className="field"><span className="label">اسم المزرعة</span><input name="farm" className="input" required /></label>
          <label className="field full"><span className="label">عنوان التوصيل أو موقع المزرعة</span><input name="address" className="input" required /></label>
          <label className="field"><span className="label">طريقة الدفع</span><select name="payment" className="select" required><option value="">اختر طريقة الدفع</option><option>مدى</option><option>Visa</option><option>Mastercard</option><option>تحويل بنكي</option></select></label>
          <label className="field"><span className="label">وقت التواصل المناسب</span><input name="contactTime" className="input" type="time" /></label>
        </div>
        <button className="primaryButton" style={{ marginTop: 22 }} type="submit">تأكيد الطلب التجريبي</button>
        {error && <div className="status orange" style={{ marginTop: 18 }}>{error}</div>}
        {done && <div className="status" style={{ marginTop: 18 }}>تم إنشاء أمر الشراء وسيتم التواصل لتأكيد التركيب أو التوصيل.</div>}
      </form>
      <aside className="card panel">
        <h2 className="sectionTitle">ملخص الدفع</h2>
        <div className="infoList">
          {items.length ? items.map((item) => <div className="infoRow" key={item.slug}><span>{item.name} × {item.qty}</span><strong>{(item.price * item.qty).toLocaleString("ar-SA")} ر.س</strong></div>) : <p className="pageText">لا توجد منتجات في السلة حاليا.</p>}
        </div>
        <h3 className="pageTitle" style={{ fontSize: 34, marginTop: 22 }}>{total.toLocaleString("ar-SA")} ر.س</h3>
        <p className="pageText">واجهة دفع جاهزة للربط لاحقا مع بوابة دفع حقيقية.</p>
      </aside>
    </div>
  )
}
