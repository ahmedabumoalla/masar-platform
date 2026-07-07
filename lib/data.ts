export type Product = {
  slug: string
  name: string
  category: string
  company: string
  region: string
  price: number
  rating: number
  reviews: number
  image: string
  tag: string
  summary: string
  details: string[]
}

export const categories = ["الكل", "مستلزمات الري", "حساسات", "أسمدة", "مكافحة الآفات", "بذور"]

export const products: Product[] = [
  {
    slug: "soil-moisture-sensor",
    name: "حساس رطوبة التربة",
    category: "حساسات",
    company: "شركة النخيل للتقنيات",
    region: "القصيم",
    price: 129,
    rating: 4.8,
    reviews: 128,
    image: "/products/soil-moisture-sensor.svg",
    tag: "حساسات",
    summary: "حساس ميداني لقراءة رطوبة التربة وربطها بلوحة مسار.",
    details: ["قراءة دقيقة لرطوبة التربة", "مناسب للمزارع والبيوت المحمية", "يدعم المزامنة مع جهاز مسار", "تصميم خفيف وسهل التركيب"]
  },
  {
    slug: "drip-irrigation-kit",
    name: "طقم ري بالتنقيط",
    category: "مستلزمات الري",
    company: "من الري الذكي",
    region: "الرياض",
    price: 165,
    rating: 4.7,
    reviews: 96,
    image: "/products/drip-kit.svg",
    tag: "مستلزمات الري",
    summary: "طقم توصيلات وخراطيم لتوزيع المياه بكفاءة.",
    details: ["خراطيم تنقيط عالية التحمل", "وصلات ومنظمات ضغط", "مناسب للمحاصيل الصغيرة", "قابل للتوسع حسب مساحة المزرعة"]
  },
  {
    slug: "balanced-organic-fertilizer",
    name: "سماد عضوي متوازن",
    category: "أسمدة",
    company: "الوادي الأخضر",
    region: "حائل",
    price: 79,
    rating: 4.6,
    reviews: 74,
    image: "/products/fertilizer.svg",
    tag: "أسمدة",
    summary: "تركيبة متوازنة لتحسين خصوبة التربة ودعم نمو المحصول.",
    details: ["تركيبة NPK متوازنة", "يدعم الجذور والنمو الخضري", "مناسب لعدة أنواع من المحاصيل", "إرشادات استخدام واضحة"]
  },
  {
    slug: "safe-pesticide",
    name: "مبيد آفات آمن",
    category: "مكافحة الآفات",
    company: "الحماية الزراعية",
    region: "جدة",
    price: 85,
    rating: 4.5,
    reviews: 63,
    image: "/products/pesticide.svg",
    tag: "مكافحة الآفات",
    summary: "حل وقائي للآفات الشائعة مع جرعات استخدام سهلة.",
    details: ["مناسب للاستخدام الوقائي", "تعليمات جرعات مبسطة", "قابل للطلب مع استشارة مختص", "عبوة آمنة وسهلة التخزين"]
  },
  {
    slug: "hybrid-tomato-seeds",
    name: "بذور طماطم هجينة",
    category: "بذور",
    company: "بذور المملكة",
    region: "المدينة",
    price: 39,
    rating: 4.8,
    reviews: 112,
    image: "/products/tomato-seeds.svg",
    tag: "بذور",
    summary: "بذور عالية الجودة مناسبة للزراعة الموسمية.",
    details: ["إنبات موثوق", "مناسبة للبيوت المحمية", "تحتاج ريًا منتظمًا", "دليل زراعة مبسط"]
  },
  {
    slug: "salinity-meter",
    name: "جهاز قياس ملوحة",
    category: "حساسات",
    company: "النخيل للتقنيات",
    region: "الدمام",
    price: 199,
    rating: 4.7,
    reviews: 58,
    image: "/products/salinity-meter.svg",
    tag: "حساسات",
    summary: "جهاز محمول لمتابعة ملوحة المياه والتربة.",
    details: ["قراءة واضحة وسريعة", "مناسب للمياه والتربة", "شاشة رقمية سهلة", "يدعم قرارات الري والتسميد"]
  }
]

export const specialists = [
  { name: "مختص ري", field: "جدولة الري وتحسين الضغط", status: "متاح الآن" },
  { name: "مختص آفات", field: "تشخيص الآفات والتوصيات", status: "متاح الآن" },
  { name: "مختص تربة", field: "تحليل الرطوبة والتغذية", status: "متاح الآن" }
]

export const services = [
  "تركيب جهاز مسار",
  "فحص نظام الري",
  "صيانة الصمامات والمضخات",
  "استشارة زراعية",
  "فحص آفة أو مرض نباتي",
  "زيارة ميدانية كاملة"
]

export const liveRows = [
  { time: "09:00", moisture: "61.8", temp: "25.7", pressure: "2.7", flow: "17.9", water: "31.6", status: "متصل" },
  { time: "09:05", moisture: "62.1", temp: "25.9", pressure: "2.8", flow: "18.2", water: "32.0", status: "متصل" },
  { time: "09:10", moisture: "62.3", temp: "26.1", pressure: "2.8", flow: "18.1", water: "32.1", status: "متصل" },
  { time: "09:15", moisture: "62.0", temp: "26.0", pressure: "2.8", flow: "18.3", water: "32.2", status: "متصل" },
  { time: "09:20", moisture: "62.2", temp: "26.2", pressure: "2.8", flow: "18.4", water: "32.4", status: "متصل" }
]
