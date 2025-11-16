export default function StorePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#050814] via-[#02040b] to-black text-white">
      <div className="mx-auto max-w-3xl px-4 pt-24 pb-16">
        <div className="rounded-3xl bg-black/60 border border-white/10 p-6 md:p-8 text-center space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">المتجر الإلكتروني</h1>
          <p className="text-sm text-white/70">
            قريبًا سيتم افتتاح متجر مسار الإلكتروني لمنتجات الزراعة، الأسمدة، العلاجات،
            وأدوات الريّ من شركاء موثوقين.
          </p>
          <p className="text-xs text-white/60">
            المنصة جاهزة لعرض المنتجات وربطها ببوابة دفع، وسيتم تفعيلها بعد الاتفاق مع
            الشركاء والموردين واعتماد المنتجات المناسبة.
          </p>
        </div>
      </div>
    </main>
  );
}
