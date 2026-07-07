import Link from "next/link"
import { notFound } from "next/navigation"
import AddToCartButton from "@/components/AddToCartButton"
import { PageHeader } from "@/components/MasarUI"
import { products } from "@/lib/data"

type ProductPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params
  const product = products.find((item) => item.slug === slug)

  if (!product) return { title: "المنتج غير موجود | مسار" }

  return {
    title: `${product.name} | مسار`,
    description: product.summary
  }
}

export default async function ProductDetailsPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = products.find((item) => item.slug === slug)

  if (!product) notFound()

  return (
    <main className="page">
      <div className="container">
        <PageHeader title={product.name} text={product.summary} />
        <div className="layoutTwo reverse">
          <section className="devicePanel card">
            <img className="deviceImage" src={product.image} alt={product.name} />
          </section>
          <section className="card panel">
            <span className="productTag" style={{ position: "static", display: "inline-flex" }}>{product.tag}</span>
            <h2 className="pageTitle" style={{ fontSize: 36, marginTop: 20 }}>{product.price} ر.س</h2>
            <p className="pageText">{product.company} - {product.region}</p>
            <div className="buttonRow" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <AddToCartButton product={product} label="أضف المنتج للسلة" />
              <Link className="outlineButton" href="/installation">طلب تركيب</Link>
            </div>
          </section>
        </div>
        <section className="card panel" style={{ marginTop: 24 }}>
          <h2 className="sectionTitle">ما الذي يقدمه المنتج؟</h2>
          <div className="grid4">
            {product.details.map((detail) => <article className="metricCard card" key={detail}><span>{detail}</span></article>)}
          </div>
        </section>
      </div>
    </main>
  )
}
