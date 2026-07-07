import { products } from "@/lib/data"

export type CartItem = {
  slug: string
  name: string
  price: number
  image: string
  company: string
  qty: number
}

const validSlugs = new Set(products.map((product) => product.slug))

export function normalizeCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return []

  return raw
    .filter((item): item is CartItem => {
      if (!item || typeof item !== "object") return false
      const candidate = item as Partial<CartItem>
      return Boolean(
        candidate.slug &&
        validSlugs.has(candidate.slug) &&
        candidate.name &&
        candidate.company &&
        candidate.image &&
        typeof candidate.price === "number"
      )
    })
    .map((item) => ({
      ...item,
      qty: Number.isFinite(Number(item.qty)) ? Math.max(1, Math.floor(Number(item.qty))) : 1
    }))
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return []

  try {
    return normalizeCart(JSON.parse(localStorage.getItem("masar-cart") || "[]"))
  } catch {
    localStorage.removeItem("masar-cart")
    return []
  }
}

export function writeCart(items: CartItem[]) {
  const next = normalizeCart(items)
  localStorage.setItem("masar-cart", JSON.stringify(next))
  window.dispatchEvent(new Event("masar-cart-updated"))
  return next
}
