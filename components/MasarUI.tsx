import Image from "next/image"
import Link from "next/link"
import {
  Activity,
  BarChart3,
  Battery,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  CircleGauge,
  CloudUpload,
  Droplets,
  FileText,
  Headphones,
  Heart,
  Image as ImageIcon,
  Leaf,
  Link as LinkIcon,
  MessageCircle,
  Package,
  PieChart,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Star,
  Thermometer,
  Truck,
  UploadCloud,
  User,
  Wifi,
  Wrench
} from "lucide-react"
import { liveRows, products, specialists } from "@/lib/data"

export function PageHeader({ title, text, center = false }: { title: string; text: string; center?: boolean }) {
  return (
    <div className={`pageHeader ${center ? "center" : ""}`}>
      <h1 className="pageTitle">{title}</h1>
      <p className="pageText">{text}</p>
    </div>
  )
}

export function DeviceVisual({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "devicePanel card" : "deviceScene"} aria-label="جهاز مسار الذكي">
      {compact ? null : <Wifi className="wifiHero" size={52} strokeWidth={1.8} />}
      <img className={compact ? "deviceImage" : "deviceMain"} src="/masar-device.svg" alt="جهاز مسار الذكي" />
      {compact ? null : (
        <>
          <article className="floatCard irrigationFloat">
            <div className="floatLabel"><span>حالة الري</span><Droplets size={24} color="#0A8BFF" /></div>
            <span className="floatValue">مثالي</span>
            <div className="progressTrack"><span style={{ width: "82%" }} /></div>
            <span className="floatLabel" style={{ justifyContent: "flex-start", marginTop: 8 }}>82%</span>
          </article>

          <article className="floatCard waterFloat">
            <span className="floatLabel">استهلاك المياه</span>
            <span className="floatValue">32.4 م³</span>
            <div className="miniBars" aria-hidden="true">
              {[46, 66, 52, 64, 78, 92, 84].map((height) => <span key={height} style={{ height: `${height}%` }} />)}
            </div>
            <div className="barDays"><span>سبت</span><span>جمعة</span><span>خميس</span><span>أربعاء</span><span>ثلاثاء</span><span>اثنين</span><span>أحد</span></div>
          </article>

          <article className="floatCard soilFloat">
            <Droplets size={24} color="#0A8BFF" />
            <span className="floatLabel" style={{ display: "block", marginTop: 6 }}>رطوبة التربة</span>
            <span className="floatValue">%62</span>
          </article>

          <article className="floatCard tempFloat">
            <Thermometer size={24} color="#0A8BFF" />
            <span className="floatLabel" style={{ display: "block", marginTop: 6 }}>درجة الحرارة</span>
            <span className="floatValue">26°C</span>
          </article>
        </>
      )}
    </div>
  )
}

export function HomeFeatures() {
  const items = [
    { icon: Sprout, title: "إدارة المزرعة", text: "لوحة تحكم ذكية لمتابعة جميع المؤشرات." },
    { icon: ShieldCheck, title: "اكتشاف الأعطال", text: "تنبيهات فورية وحلول ذكية." },
    { icon: Activity, title: "اكتشاف الآفات", text: "ذكاء اصطناعي لتحديد الآفات." },
    { icon: Droplets, title: "جدولة الري", text: "جدولة تلقائية بناء على البيانات." },
    { icon: ShoppingBag, title: "سوق داعم", text: "تصفح منتجات وحلول زراعية." }
  ]

  return (
    <section className="container">
      <div className="featureIntro">
        <h2><Leaf size={20} /> كل ما تحتاجه لإدارة مزرعتك بذكاء <Leaf size={20} /></h2>
      </div>
      <div className="featureGrid">
        {items.map(({ icon: Icon, title, text }) => (
          <article className="featureCard card" key={title}>
            <span className="iconBubble"><Icon size={28} /></span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export function StatsGrid() {
  const items = [
    { icon: PieChart, value: "+1,500", label: "عملية تحليل بيانات" },
    { icon: Leaf, value: "+50", label: "مزرعة مستفيدة" },
    { icon: User, value: "+1,320", label: "عميل نشط" },
    { icon: CircleGauge, value: "+23", label: "شريك محلي وعالمي" }
  ]

  return (
    <div className="statsGrid">
      {items.map(({ icon: Icon, value, label }) => (
        <article className="statCard card" key={label}>
          <span className="iconBubble"><Icon size={28} /></span>
          <div><strong>{value}</strong><span>{label}</span></div>
        </article>
      ))}
    </div>
  )
}

export function OverviewDashboard() {
  const tools = [
    { icon: Sparkles, title: "المساعد الذكي", text: "اسأل وخذ توصيات ذكية مبنية على بيانات مزرعتك.", href: "/ai-assistant", cta: "ابدأ المحادثة" },
    { icon: Headphones, title: "طلب استشارة", text: "احصل على استشارة من خبراء الزراعة المعتمدين.", href: "/consultations", cta: "اطلب استشارة" },
    { icon: ShoppingBag, title: "السوق الرقمي", text: "تسوق المنتجات والمستلزمات الزراعية بسهولة وأمان.", href: "/market", cta: "تصفح السوق" }
  ]
  const metrics = [
    { icon: Droplets, label: "رطوبة التربة", value: "62%" },
    { icon: Thermometer, label: "درجة الحرارة", value: "26°C" },
    { icon: Droplets, label: "استهلاك المياه اليومي", value: "32.4 م³" },
    { icon: Activity, label: "عدد التنبيهات", value: "3" }
  ]

  return (
    <>
      <div className="layoutTwo reverse">
        <aside className="sideStack">
          <section className="card panel">
            <h2 className="sectionTitle">حالة المزرعة</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <span className="iconBubble"><ShieldCheck size={30} /></span>
              <div><strong style={{ color: "#18B76A", fontSize: 24 }}>مستقرة</strong><p className="pageText" style={{ marginTop: 4 }}>جميع المؤشرات ضمن النطاق الطبيعي.</p></div>
            </div>
            <span className="status" style={{ marginTop: 22 }}><span className="dot" /> الجهاز متصل</span>
          </section>
          <section className="card panel">
            <h2 className="sectionTitle">مهام اليوم</h2>
            <div className="infoList">
              <InfoTask time="07:00 ص" title="ري المحصول" text="المنطقة الشمالية" icon={<Droplets size={22} />} />
              <InfoTask time="11:00 ص" title="تفقد النظام" text="فحص الأنابيب والصمامات" icon={<Settings2 size={22} />} />
              <InfoTask time="04:30 م" title="استشارة زراعية" text="مع خبير معتمد" icon={<Headphones size={22} />} />
            </div>
          </section>
        </aside>

        <main>
          <PageHeader title="لوحة تحكم المزرعة" text="تابع حالة مزرعتك وإدارتها من مكان واحد" />
          <p className="sectionTitle">أدواتك لإدارة المزرعة</p>
          <div className="grid3">
            {tools.map(({ icon: Icon, title, text, href, cta }) => (
              <article className="featureCard card" key={title}>
                <span className="iconBubble"><Icon size={30} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
                <Link className="softButton" style={{ marginTop: 18 }} href={href}>{cta}<ChevronLeft size={18} /></Link>
              </article>
            ))}
          </div>
          <div className="grid4" style={{ marginTop: 22 }}>
            {metrics.map(({ icon: Icon, label, value }) => (
              <article className="metricCard card" key={label}>
                <span className="iconBubble"><Icon size={24} /></span>
                <div><span>{label}</span><strong>{value}</strong></div>
              </article>
            ))}
          </div>
        </main>
      </div>

      <div className="layoutTwo" style={{ marginTop: 24 }}>
        <section className="card panel tableCard">
          <h2 className="sectionTitle">النشاطات الأخيرة</h2>
          <table className="dataTable">
            <thead><tr><th>الوقت</th><th>النشاط</th><th>التفاصيل</th><th>الحالة</th></tr></thead>
            <tbody>
              <tr><td>09:20 ص</td><td>ري المحصول</td><td>تم ري المنطقة الشمالية لمدة 60 دقيقة</td><td><span className="status"><span className="dot" /> مكتمل</span></td></tr>
              <tr><td>08:45 ص</td><td>قراءة البيانات</td><td>تم تحديث بيانات جميع الحساسات</td><td><span className="status"><span className="dot" /> مكتمل</span></td></tr>
              <tr><td>07:30 ص</td><td>تنبيه رطوبة التربة</td><td>انخفاض الرطوبة في المنطقة الجنوبية</td><td><span className="status blue"><span className="dot" /> تم التفعيل</span></td></tr>
              <tr><td>06:10 م</td><td>استشارة زراعية</td><td>تمت جلسة استشارة حول تسميد التربة</td><td><span className="status"><span className="dot" /> مكتمل</span></td></tr>
            </tbody>
          </table>
        </section>
        <section className="card panel">
          <h2 className="sectionTitle">نظرة عامة على المزرعة</h2>
          <div className="infoList">
            <InfoPair label="اسم المزرعة" value="مزرعة الربيع" />
            <InfoPair label="الموقع" value="القصيم - بريدة" />
            <InfoPair label="المساحة" value="45 هكتار" />
            <InfoPair label="نوع المحصول" value="نخيل - حبوب" />
            <InfoPair label="تاريخ آخر تحديث" value="اليوم، 09:20 ص" />
          </div>
        </section>
      </div>
    </>
  )
}

function InfoTask({ time, title, text, icon }: { time: string; title: string; text: string; icon: React.ReactNode }) {
  return (
    <div className="infoRow">
      <span className="status blue">{time}</span>
      <div style={{ flex: 1 }}><strong>{title}</strong><div>{text}</div></div>
      <span className="iconBubble" style={{ width: 42, height: 42 }}>{icon}</span>
    </div>
  )
}

export function InfoPair({ label, value }: { label: string; value: string }) {
  return <div className="infoRow"><span>{label}</span><strong>{value}</strong></div>
}

export function AiAssistantView() {
  return (
    <div>
      <PageHeader title="المساعد الذكي" text="ارفع صورة لشجرتك واحصل على تشخيص فوري للمشكلة المحتملة." />
      <div className="aiGrid">
        <section className="card panel">
          <h2 className="sectionTitle">نتيجة الفحص</h2>
          <span className="status"><CheckCircle2 size={16} /> تم تحليل الصورة</span>
          <div className="resultAlert">
            <span>المشكلة المحتملة:</span>
            <strong>اصفرار الأوراق بسبب نقص العناصر أو إجهاد الري</strong>
          </div>
          <h3 className="sectionTitle">العلامات الظاهرة</h3>
          <ul className="bullets">
            <li>اصفرار الأوراق القديمة بدءا من الأطراف.</li>
            <li>وجود بقع صفراء غير منتظمة على الأوراق.</li>
            <li>ضعف عام في نمو الشجرة.</li>
          </ul>
          <h3 className="sectionTitle" style={{ marginTop: 24 }}>الإجراء الأولي</h3>
          <ul className="bullets">
            <li>تحقق من مستوى الري وتجنب الإفراط أو الجفاف.</li>
            <li>أضف سمادا متوازنا يحتوي على العناصر الصغرى.</li>
            <li>أزل الأوراق شديدة الاصفرار لتحسين التهوية.</li>
          </ul>
          <div className="smallStats">
            <div className="smallStat"><span>مستوى الثقة</span><strong>92%</strong></div>
            <div className="smallStat"><span>نوع النبات</span><strong>شجرة</strong></div>
          </div>
        </section>

        <section className="card panel">
          <h2 className="sectionTitle">ارفع صورة الشجرة</h2>
          <p className="pageText" style={{ marginBottom: 22 }}>اختر صورة من جهازك أو التقط صورة مباشرة لشجرتك</p>
          <div className="plantImageCard">
            <img src="/ai-plant-sample.svg" alt="أوراق شجرة مصابة بالاصفرار" />
            <div className="uploadBox">
              <div>
                <UploadCloud size={54} color="#0A8BFF" />
                <strong>اسحب الصورة هنا</strong>
                <span>أو اختر من جهازك</span>
                <div style={{ display: "grid", gap: 12, marginTop: 28 }}>
                  <button className="outlineButton"><ImageIcon size={20} /> اختيار صورة</button>
                  <button className="outlineButton"><CameraIcon /> التقاط صورة</button>
                </div>
              </div>
            </div>
          </div>
          <button className="primaryButton" style={{ width: "100%", marginTop: 22 }}><RefreshCw size={20} /> تحليل صورة جديدة</button>
        </section>
      </div>
    </div>
  )
}

function CameraIcon() {
  return <span style={{ width: 20, height: 20, display: "inline-flex" }}><ImageIcon size={20} /></span>
}

export function ConsultationView({ installation = false }: { installation?: boolean }) {
  return (
    <div>
      <PageHeader
        title={installation ? "طلب تركيب" : "طلب الاستشارة"}
        text={installation ? "اطلب تركيب جهاز مسار في مزرعتك بواسطة فريق مختص." : "أرسل تفاصيل مشكلتك الزراعية واحصل على استشارة من مختصين معتمدين."}
      />
      <div className="layoutTwo">
        <section className="card panel">
          {installation ? <InstallationFields /> : <ConsultationFields />}
        </section>
        <aside className="sideStack">
          <SummaryCard installation={installation} />
          {!installation ? <HowItWorks /> : <DeviceMethod />}
          {!installation ? <SpecialistsCard /> : null}
        </aside>
      </div>
    </div>
  )
}

function ConsultationFields() {
  return (
    <>
      <div className="formGrid">
        <Field label="نوع الاستشارة" required><select className="select"><option>اختر نوع الاستشارة</option><option>الري</option><option>الآفات</option><option>التربة</option></select></Field>
        <Field label="اسم المزرعة" required><select className="select"><option>اختر المزرعة</option><option>مزرعة الوادي الأخضر</option></select></Field>
        <Field label="عنوان المشكلة" required full><input className="input" placeholder="اكتب عنوانا مختصرا للمشكلة" /></Field>
        <Field label="وصف الحالة" required full><textarea className="textarea" placeholder="اكتب تفاصيل المشكلة، متى بدأت، وما لاحظته على المحصول أو الحقل..." /></Field>
        <Field label="درجة الأولوية" required><div className="segmented"><button className="segment active">عادية</button><button className="segment">عاجلة</button></div></Field>
        <Field label="طريقة التواصل المفضلة" required><div className="segmented" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}><button className="segment active">مكالمة</button><button className="segment">واتساب</button><button className="segment">محادثة</button></div></Field>
        <Field label="الموعد المناسب" required><input className="input" placeholder="اختر التاريخ والوقت المناسب" /></Field>
        <Field label="إرفاق صورة أو ملف اختياري"><div className="uploadBox"><div><CloudUpload size={38} color="#0A8BFF" /><strong>اسحب وأفلت ملفا هنا</strong><span>PDF, DOC, XLS, صور حتى 10MB</span></div></div></Field>
      </div>
      <div className="buttonRow">
        <button className="outlineButton"><FileText size={20} /> حفظ كمسودة</button>
        <button className="primaryButton"><Send size={20} /> إرسال طلب الاستشارة</button>
      </div>
    </>
  )
}

function InstallationFields() {
  return (
    <>
      <div className="formGrid">
        <Field label="بيانات المزرعة" required><input className="input" placeholder="مزرعة الوادي الأخضر" /></Field>
        <Field label="الموقع" required><input className="input" placeholder="القصيم - بريدة" /></Field>
        <Field label="نوع الجهاز" required><select className="select"><option>جهاز مسار للري الرئيسي</option><option>حساس رطوبة التربة</option></select></Field>
        <Field label="الموعد المناسب" required><input className="input" placeholder="اختر التاريخ والوقت المناسب" /></Field>
        <Field label="ملاحظات إضافية" full><textarea className="textarea" placeholder="اكتب أي تفاصيل تساعد فريق التركيب..." /></Field>
      </div>
      <button className="primaryButton" style={{ width: "100%", marginTop: 28 }}><Wrench size={20} /> إرسال طلب التركيب</button>
    </>
  )
}

function Field({ label, required, full, children }: { label: string; required?: boolean; full?: boolean; children: React.ReactNode }) {
  return <label className={`field ${full ? "full" : ""}`}><span className="label">{label} {required ? <span className="required">*</span> : null}</span>{children}</label>
}

function SummaryCard({ installation }: { installation: boolean }) {
  return (
    <section className="card panel">
      <h2 className="sectionTitle">ملخص الطلب</h2>
      <div className="infoList">
        <InfoPair label="اسم المزرعة" value="غير محدد" />
        <InfoPair label={installation ? "نوع الجهاز" : "نوع الاستشارة"} value="غير محدد" />
        <InfoPair label="درجة الأولوية" value="عادية" />
        <InfoPair label="وقت الاستجابة المتوقع" value="24 - 48 ساعة" />
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section className="card panel">
      <h2 className="sectionTitle">كيف تعمل الاستشارة؟</h2>
      <div className="stepList">
        <Step num="1" title="أرسل الطلب" text="أخبرنا عن مشكلتك وشارك التفاصيل." />
        <Step num="2" title="يراجع المختص التفاصيل" text="يقوم المختص الزراعي بتحليل حالتك." />
        <Step num="3" title="يتم التواصل معك" text="نقدم لك الحلول والتوصيات المناسبة." />
      </div>
    </section>
  )
}

function DeviceMethod() {
  return (
    <section className="card panel">
      <h2 className="sectionTitle">طريقة التركيب</h2>
      <div className="stepList">
        <Step num="1" title="حدد الموعد" text="اختر الوقت المناسب للزيارة." />
        <Step num="2" title="يراجع الفريق الطلب" text="نتأكد من الجهاز والاحتياج." />
        <Step num="3" title="يتم التركيب" text="يربط الفريق الجهاز بحسابك في مسار." />
      </div>
    </section>
  )
}

function Step({ num, title, text }: { num: string; title: string; text: string }) {
  return <div className="stepRow"><span className="stepNum">{num}</span><div><h4>{title}</h4><p>{text}</p></div></div>
}

function SpecialistsCard() {
  return (
    <section className="card panel">
      <h2 className="sectionTitle">مختصون متاحون الآن</h2>
      <div className="infoList">
        {specialists.map((item) => <div className="infoRow" key={item.name}><div><strong>{item.name}</strong><div>{item.field}</div></div><span className="status"><span className="dot" /> {item.status}</span></div>)}
      </div>
    </section>
  )
}

export function ConnectDeviceView() {
  return (
    <div>
      <PageHeader title="ربط الجهاز" text="أدخل الكود الظاهر على جهاز مسار لإضافته وربطه بمزرعتك بسهولة وأمان." />
      <div className="layoutTwo reverse">
        <aside className="sideStack">
          <section className="devicePanel card">
            <Wifi size={42} color="#79C3FF" style={{ margin: "0 auto 10px" }} />
            <img className="deviceImage" src="/masar-device.svg" alt="جهاز مسار" />
            <div className="deviceMeta">
              <InfoPair label="كود الجهاز:" value="MAS-48291" />
              <InfoPair label="الحالة:" value="جاهز للربط" />
              <InfoPair label="الاتصال:" value="نشط" />
            </div>
          </section>
          <DeviceMethod />
        </aside>
        <section className="card panel">
          <div className="stepList" style={{ gridTemplateColumns: "repeat(3, 1fr)", display: "grid", marginBottom: 34 }}>
            <Step num="1" title="تشغيل الجهاز" text="" />
            <Step num="2" title="إدخال الكود" text="" />
            <Step num="3" title="تأكيد الربط" text="" />
          </div>
          <div className="formGrid">
            <Field label="كود الجهاز" required full><input className="input" placeholder="MAS-48291" /></Field>
            <Field label="اسم المزرعة" required full><select className="select"><option>مزرعة الوادي الأخضر</option></select></Field>
            <Field label="اسم الجهاز" required full><input className="input" placeholder="مثال: جهاز الري الرئيسي" /></Field>
          </div>
          <label className="infoRow" style={{ marginTop: 22, border: 0 }}>
            <span><strong>تفعيل المزامنة التلقائية</strong><br />سيتم مزامنة البيانات تلقائيا مع حسابك في مسار</span>
            <input type="checkbox" defaultChecked />
          </label>
          <button className="primaryButton" style={{ width: "100%", marginTop: 24 }}><LinkIcon size={20} /> ربط الجهاز الآن</button>
          <button className="outlineButton" style={{ width: "100%", marginTop: 16 }}><Headphones size={20} /> الحصول على مساعدة</button>
          <p className="pageText" style={{ textAlign: "center" }}>يتم الربط بشكل آمن ومباشر مع حسابك في مسار</p>
        </section>
      </div>
    </div>
  )
}

export function DataReadingView() {
  const metrics = [
    { icon: Droplets, label: "رطوبة التربة", value: "62%" },
    { icon: Thermometer, label: "درجة الحرارة", value: "26°C" },
    { icon: Droplets, label: "ضغط المياه", value: "2.8 بار" },
    { icon: Battery, label: "جهد البطارية", value: "87%" },
    { icon: Droplets, label: "استهلاك المياه اليومي", value: "32.4 م³" },
    { icon: Activity, label: "معدل التدفق", value: "18.4 لتر/دقيقة" }
  ]

  return (
    <div>
      <PageHeader title="قراءة البيانات" text="عرض مباشر للبيانات الواردة من جهاز مسار بدون تحليل أو توصيات." />
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}><span className="status"><span className="dot" /> الجهاز متصل</span></div>
      <div className="layoutTwo reverse">
        <DeviceCardWithMeta />
        <div className="grid3">
          {metrics.map(({ icon: Icon, label, value }) => <article className="metricCard card" key={label}><span className="iconBubble"><Icon size={24} /></span><div><span>{label}</span><strong>{value}</strong></div></article>)}
        </div>
      </div>
      <LiveDataTable />
      <div className="bottomActions">
        <button className="outlineButton"><RefreshCw size={20} /> مزامنة الآن</button>
        <button className="outlineButton"><FileText size={20} /> تصدير CSV</button>
        <button className="outlineButton"><RefreshCw size={20} /> تحديث البيانات</button>
      </div>
    </div>
  )
}

function DeviceCardWithMeta() {
  return (
    <section className="devicePanel card">
      <Wifi size={42} color="#79C3FF" style={{ margin: "0 auto 8px" }} />
      <img className="deviceImage" src="/masar-device.svg" alt="جهاز مسار" />
      <div className="deviceMeta">
        <InfoPair label="كود الجهاز:" value="MAS-48291" />
        <InfoPair label="حالة الاتصال:" value="متصل" />
        <InfoPair label="آخر مزامنة:" value="الآن" />
      </div>
    </section>
  )
}

export function LiveDataTable() {
  return (
    <section className="card panel tableCard" style={{ marginTop: 26 }}>
      <h2 className="sectionTitle">البيانات المباشرة</h2>
      <table className="dataTable">
        <thead>
          <tr><th>الوقت</th><th>رطوبة التربة (%)</th><th>درجة الحرارة (°C)</th><th>ضغط المياه (بار)</th><th>معدل التدفق (لتر/دقيقة)</th><th>استهلاك المياه (م³)</th><th>حالة الاتصال</th></tr>
        </thead>
        <tbody>
          {liveRows.map((row) => (
            <tr key={row.time}>
              <td>{row.time}</td><td>{row.moisture}</td><td>{row.temp}</td><td>{row.pressure}</td><td>{row.flow}</td><td>{row.water}</td>
              <td><span className="status"><Wifi size={14} /> {row.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export function ReportsView() {
  const metrics = [
    { icon: Droplets, label: "استهلاك المياه", value: "32.4 م³" },
    { icon: Droplets, label: "متوسط الرطوبة", value: "62%" },
    { icon: Activity, label: "الأعطال المكتشفة", value: "3" },
    { icon: ShieldCheck, label: "كفاءة الري", value: "92%" }
  ]
  return (
    <div>
      <PageHeader title="التقارير" text="تابع تقارير مزرعتك وقراءات جهاز مسار وتحليلات الأداء من مكان واحد." />
      <div className="grid4">
        {metrics.map(({ icon: Icon, label, value }) => <article className="metricCard card" key={label}><span className="iconBubble"><Icon size={24} /></span><div><span>{label}</span><strong>{value}</strong></div></article>)}
      </div>
      <div className="layoutTwo" style={{ marginTop: 24 }}>
        <section className="chartCard card">
          <h2 className="sectionTitle">تقرير الأداء الأسبوعي</h2>
          <div className="barChart">
            {["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"].map((day, index) => <div className="barColumn" key={day} style={{ height: `${[48, 68, 56, 75, 83, 64, 72][index]}%` }}><span>{day}</span></div>)}
          </div>
        </section>
        <section className="card panel">
          <h2 className="sectionTitle">ملخص التنبيهات</h2>
          <ul className="bullets">
            <li>انخفاض رطوبة التربة</li>
            <li>ارتفاع استهلاك المياه</li>
            <li>تأخر جدولة الري</li>
          </ul>
        </section>
      </div>
      <section className="card panel tableCard" style={{ marginTop: 24 }}>
        <table className="dataTable">
          <thead><tr><th>التاريخ</th><th>نوع التقرير</th><th>الحالة</th><th>الإجراء</th></tr></thead>
          <tbody>
            <tr><td>2024/05/20</td><td>تقرير الري</td><td><span className="status"><span className="dot" /> مكتمل</span></td><td>عرض</td></tr>
            <tr><td>2024/05/18</td><td>تقرير الأعطال</td><td><span className="status orange"><span className="dot" /> قيد المراجعة</span></td><td>عرض</td></tr>
            <tr><td>2024/05/15</td><td>تقرير التربة</td><td><span className="status"><span className="dot" /> مكتمل</span></td><td>عرض</td></tr>
          </tbody>
        </table>
      </section>
      <div className="bottomActions">
        <button className="outlineButton"><FileText size={20} /> تصدير PDF</button>
        <button className="outlineButton"><FileText size={20} /> تصدير CSV</button>
        <button className="outlineButton"><RefreshCw size={20} /> تحديث التقارير</button>
      </div>
    </div>
  )
}

export function ImpactView() {
  const items = [
    { icon: Droplets, label: "توفير مياه", value: "30%" },
    { icon: ShieldCheck, label: "تحسين كفاءة الري", value: "50%" },
    { icon: Activity, label: "دقة التحليل", value: "92%" },
    { icon: PieChart, label: "عملية تحليل", value: "+1,500" }
  ]
  return (
    <div>
      <PageHeader title="الأثر" text="أثر مسار في تقليل الهدر وتحسين كفاءة إدارة المزارع." />
      <div className="grid4">
        {items.map(({ icon: Icon, label, value }) => <article className="statCard card" key={label}><span className="iconBubble"><Icon size={30} /></span><div><strong>{value}</strong><span>{label}</span></div></article>)}
      </div>
      <section className="chartCard card" style={{ marginTop: 26 }}>
        <h2 className="sectionTitle">تحسن مؤشرات المزرعة بعد استخدام مسار</h2>
        <div className="barChart">
          {["الهدر", "الضغط", "الرطوبة", "الري", "التنبيهات", "الجودة"].map((day, index) => <div className="barColumn" key={day} style={{ height: `${[42, 55, 68, 76, 84, 92][index]}%` }}><span>{day}</span></div>)}
        </div>
      </section>
    </div>
  )
}

export function MarketSidebar() {
  return (
    <aside className="sideStack">
      <section className="card panel">
        <h2 className="sectionTitle">سلة المشتريات</h2>
        <div className="infoList">
          {products.slice(0, 3).map((product) => <InfoPair key={product.slug} label={product.name} value="1 ×" />)}
          <InfoPair label="الإجمالي" value="436 ر.س" />
        </div>
        <Link href="/cart" className="primaryButton" style={{ width: "100%", marginTop: 18 }}><ShoppingCart size={18} /> عرض السلة والدفع</Link>
      </section>
      <section className="promoCard card">
        <h2 className="sectionTitle">عروض مميزة</h2>
        <p className="pageText">خصومات تصل إلى <strong style={{ color: "#18B76A" }}>20%</strong> على مجموعة مختارة من المنتجات</p>
        <Link className="outlineButton" href="/market" style={{ width: "100%", marginTop: 18 }}>تسوق العروض</Link>
      </section>
      <section className="card panel">
        <h2 className="sectionTitle">لماذا تختار مسار؟</h2>
        <ul className="bullets">
          <li>موردون معتمدون وموثوقون</li>
          <li>ضمان جودة على جميع المنتجات</li>
          <li>أسعار تنافسية وعروض حصرية</li>
          <li>دعم فني واستشارات متخصصة</li>
        </ul>
      </section>
    </aside>
  )
}

export function StoreBenefits() {
  return (
    <div className="grid3" style={{ marginTop: 24 }}>
      <article className="metricCard card"><span className="iconBubble"><Truck size={22} /></span><span>توصيل سريع إلى مزرعتك</span></article>
      <article className="metricCard card"><span className="iconBubble"><RefreshCw size={22} /></span><span>إرجاع سهل خلال 7 أيام</span></article>
      <article className="metricCard card"><span className="iconBubble"><ShieldCheck size={22} /></span><span>دفع آمن 100%</span></article>
    </div>
  )
}

export { Heart, Search, SlidersHorizontal, Star, ShoppingCart, products }
