"use client"

import { ShoppingCart } from "lucide-react"
import { Product } from "@/lib/data"
import { readCart, writeCart } from "@/lib/cart"
import { useState } from "react"

export default function AddToCartButton({ product, label = "أضف للسلة" }: { product: Product; label?: string }) {
  const [done, setDone] = useState(false)

  const add = () => {
    const cart = readCart()
    const index = cart.findIndex((item) => item.slug === product.slug)

    if (index >= 0) cart[index].qty += 1
    else cart.push({ slug: product.slug, name: product.name, price: product.price, image: product.image, company: product.company, qty: 1 })

    writeCart(cart)
    setDone(true)
    window.setTimeout(() => setDone(false), 1500)
  }

  return (
    <button className="miniBtn" onClick={add}>
      <ShoppingCart size={16} />
      {done ? "تمت الإضافة" : label}
    </button>
  )
}
