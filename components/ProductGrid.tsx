"use client"

import Link from "next/link"
import { Heart, Search, SlidersHorizontal, Star } from "lucide-react"
import { categories, products } from "@/lib/data"
import { useMemo, useState } from "react"
import AddToCartButton from "./AddToCartButton"

export default function ProductGrid() {
  const [category, setCategory] = useState("الكل")
  const [query, setQuery] = useState("")

  const shown = useMemo(() => products.filter((product) => {
    const okCategory = category === "الكل" || product.category === category
    const okSearch = `${product.name} ${product.company} ${product.summary}`.toLowerCase().includes(query.trim().toLowerCase())
    return okCategory && okSearch
  }), [category, query])

  return (
    <>
      <div className="marketTools">
        <button className="outlineButton"><SlidersHorizontal size={18} /> تصفية</button>
        <label className="searchBox">
          <Search size={20} />
          <input className="input" placeholder="ابحث عن منتج أو خدمة..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>

      <div className="filters" aria-label="تصنيف المنتجات">
        {categories.map((item) => (
          <button key={item} onClick={() => setCategory(item)} className={`filter ${category === item ? "active" : ""}`}>
            {item}
          </button>
        ))}
      </div>

      <div className="productGrid">
        {shown.map((product) => (
          <article className="productCard card" key={product.slug}>
            <span className="heart"><Heart size={18} /></span>
            <span className="productTag">{product.tag}</span>
            <Link className="productImage" href={`/market/${product.slug}`}>
              <img src={product.image} alt={product.name} />
            </Link>
            <h3><Link href={`/market/${product.slug}`}>{product.name}</Link></h3>
            <p>{product.company}</p>
            <div className="ratingRow"><span>{product.rating} <Star className="ratingStar" size={14} fill="currentColor" /> ({product.reviews})</span><span className="price">{product.price} ر.س</span></div>
            <div className="priceRow" style={{ marginTop: 10 }}>
              <AddToCartButton product={product} />
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
