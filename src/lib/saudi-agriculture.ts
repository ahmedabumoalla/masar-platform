export type Source = { title: string; url: string }

export type AgricultureProfile = {
  waterKind: 'ground' | 'rain' | 'mixed'
  waterTitle: string
  waterNote: string
  crops: string[]
  cropNote: string
  waterSources: Source[]
  cropSources: Source[]
  scope: 'region' | 'local'
}

// Editorial profiles reviewed against the linked sources on 2026-09-21.
// Categories describe documented water contexts, never measured source shares.
// Regional profiles must remain labelled regional when used for a governorate.
const mewa = (page: string) => `https://www.mewa.gov.sa/ar/MediaCenter/News/Pages/${page}.aspx`
const sources = {
  aquifers: {
    title: 'أم القرى · نطاق الرف الرسوبي والدرع العربي',
    url: 'https://www.uqn.gov.sa/details?p=26672',
  },
  farmWells: {
    title: 'وزارة البيئة · مراقبة آبار المزارع والمياه الجوفية',
    url: mewa('News6422020'),
  },
  dates: {
    title: 'وزارة البيئة · إنتاج التمور في المناطق الثلاث عشرة',
    url: mewa('News10072020'),
  },
  citrus: {
    title: 'وزارة البيئة · مناطق إنتاج الحمضيات',
    url: mewa('News13872020'),
  },
  rainCrops: {
    title: 'وزارة البيئة · دراسة محاصيل الزراعة المطرية',
    url: mewa('News632020'),
  },
  terraces: {
    title: 'وزارة البيئة · المدرجات وحصاد مياه الأمطار',
    url: mewa('News1072020'),
  },
  grapes: {
    title: 'واس · مناطق زراعة العنب وتجارب الري بالمياه المجددة',
    url: 'https://www.spa.gov.sa/N2046657',
  },
  mango: {
    title: 'وزارة البيئة · إنتاج المانجو حسب المنطقة',
    url: mewa('News9972020'),
  },
  hailPotato: {
    title: 'واس · إنتاج البطاطس في حائل',
    url: 'https://www.spa.gov.sa/N2509072',
  },
  tabukCrops: {
    title: 'واس · المحاصيل الزراعية في منطقة تبوك',
    url: 'https://www.spa.gov.sa/N2034275',
  },
  jawf: {
    title: 'واس · محاصيل الجوف ومياهها الجوفية',
    url: 'https://www.spa.gov.sa/w1858995',
  },
  ahsaCrops: {
    title: 'وزارة البيئة · الزراعة في واحة الأحساء',
    url: mewa('News5802020'),
  },
  ahsaLime: {
    title: 'واس · اللومي الحساوي',
    url: 'https://www.spa.gov.sa/N2382047',
  },
  ahsaWater: {
    title: 'واس · شبكة الري والمياه المعالجة في الأحساء',
    url: 'https://www.spa.gov.sa/1705504',
  },
  ahsaReuse: {
    title: 'واس · تعزيز استخدام المياه المجددة في الأحساء',
    url: 'https://www.spa.gov.sa/N2252511',
  },
  ulaWater: {
    title: 'الهيئة الملكية للعلا · تقرير الاستدامة وموارد المياه',
    url: 'https://www.rcu.gov.sa/getmedia/1718ac6f-1aae-493d-bf44-1e3230c56dc7/rcu-report-full-report-v7-3-arabic-%28compressed%29.pdf',
  },
  ulaCrops: {
    title: 'الهيئة الملكية للعلا · زراعة التمور والحمضيات',
    url: 'https://www.rcu.gov.sa/strategic-initiatives/alula-agriculture',
  },
  bishahWater: {
    title: 'واس · أمطار بيشة وتغذية المياه الجوفية لري النخيل',
    url: 'https://www.spa.gov.sa/1928040',
  },
  palmOases: {
    title: 'سعوديبيديا · مناطق النخيل وواحات بيشة',
    url: 'https://saudipedia.com/مناطق-النخيل-في-السعودية',
  },
  dairCoffee: {
    title: 'واس · مزارع البن في محافظة الداير',
    url: 'https://www.spa.gov.sa/N2056513',
  },
  dairHarvest: {
    title: 'واس · حصاد الأمطار والمدرجات في الداير',
    url: 'https://www.spa.gov.sa/1966863',
  },
  dairIrrigation: {
    title: 'أرامكو · خزانات وشبكات ري مزارع البن في الداير',
    url: 'https://www.aramco.com/ar/news-media/news/2018/jazan-coffee-beans-product',
  },
} satisfies Record<string, Source>

const groundwaterContext = {
  waterKind: 'ground' as const,
  waterTitle: 'مياه جوفية تُستخرج بالآبار',
  waterNote: 'سياق مائي إقليمي يشمل أجزاء من الرف الرسوبي والدرع العربي وتختلف خصائص المياه وتجددها باختلاف الموقع دون ترتيب كمي لمصادر الري في كل محافظة',
  waterSources: [sources.aquifers, sources.farmWells],
  scope: 'region' as const,
}

export const regionProfiles: Record<string, AgricultureProfile> = {
  'SA-01': {
    ...groundwaterContext,
    crops: ['التمور', 'الحمضيات', 'العنب'],
    cropNote: 'محاصيل موثقة على مستوى منطقة الرياض ويختلف انتشارها بين المحافظات',
    cropSources: [sources.dates, sources.citrus, sources.grapes],
  },
  'SA-02': {
    waterKind: 'mixed',
    waterTitle: 'آبار وأمطار محصودة',
    waterNote: 'تقع المنطقة ضمن الدرع العربي وتوثق الوزارة حصاد الأمطار والزراعة المطرية في الطائف تحديدًا ولا تعمم هذه الممارسة على جميع محافظات مكة المكرمة',
    crops: ['التمور', 'المانجو', 'العنب', 'الورد الطائفي', 'القمح المطري'],
    cropNote: 'الورد والقمح المطري موثقان في الطائف بينما التمور والمانجو موثقان على مستوى المنطقة',
    waterSources: [sources.aquifers, sources.terraces, sources.rainCrops],
    cropSources: [sources.dates, sources.mango, sources.terraces, sources.rainCrops],
    scope: 'region',
  },
  'SA-03': {
    ...groundwaterContext,
    crops: ['التمور', 'الحمضيات', 'العنب'],
    cropNote: 'محاصيل موثقة في منطقة المدينة المنورة وتتوفر للعلا بطاقة محلية مستقلة',
    cropSources: [sources.dates, sources.citrus, sources.grapes],
  },
  'SA-04': {
    waterKind: 'mixed',
    waterTitle: 'مياه جوفية وري بمياه مجددة',
    waterNote: 'تقع الشرقية على الرف الرسوبي وتوثق مشاريع الأحساء استخدام مياه معالجة للري إلى جانب الموارد الجوفية ولا تمثل الأحساء جميع محافظات المنطقة',
    crops: ['التمور', 'الحمضيات', 'الخضروات'],
    cropNote: 'التمور والحمضيات موثقتان إقليميًا والخضروات ضمن النشاط الزراعي الموثق في الأحساء',
    waterSources: [sources.aquifers, sources.ahsaWater, sources.ahsaReuse],
    cropSources: [sources.dates, sources.citrus, sources.ahsaCrops],
    scope: 'region',
  },
  'SA-05': {
    ...groundwaterContext,
    crops: ['التمور', 'الحمضيات', 'العنب'],
    cropNote: 'أمثلة موثقة لمحاصيل القصيم وليست ترتيبًا للمساحات المزروعة داخل كل محافظة',
    cropSources: [sources.dates, sources.citrus, sources.grapes],
  },
  'SA-06': {
    ...groundwaterContext,
    crops: ['البطاطس', 'التمور', 'الحمضيات', 'العنب'],
    cropNote: 'تشتهر حائل بإنتاج البطاطس وتوثق المصادر كذلك التمور والحمضيات والعنب على مستوى المنطقة',
    cropSources: [sources.hailPotato, sources.dates, sources.citrus, sources.grapes],
  },
  'SA-07': {
    ...groundwaterContext,
    crops: ['العنب', 'القمح', 'التمور', 'الخوخ', 'المشمش', 'الحمضيات'],
    cropNote: 'تنوع محصولي موثق في تقرير فرع الوزارة لمنطقة تبوك دون افتراض زراعة كل محصول في كل محافظة',
    cropSources: [sources.tabukCrops],
  },
  'SA-08': {
    ...groundwaterContext,
    waterNote: 'الحدود الشمالية ضمن نطاق الرف الرسوبي الحامل للمياه الجوفية غير المتجددة وهذا وصف جيولوجي إقليمي وليس قياسًا لحصة الآبار في ري كل محافظة',
    crops: ['التمور', 'العنب'],
    cropNote: 'محصولان توثقهما المصادر للحدود الشمالية ولا تتوفر هنا قائمة كمية مستقلة لكل محافظة',
    cropSources: [sources.dates, sources.grapes],
  },
  'SA-09': {
    waterKind: 'rain',
    waterTitle: 'زراعة مطرية وحصاد للأمطار',
    waterNote: 'توثق الوزارة دور الأمطار في حبوب جازان ومدرجاتها الزراعية وهو سياق لجزء من زراعة المنطقة وليس المصدر الوحيد لري السهول والبساتين',
    crops: ['المانجو', 'البن', 'الذرة الرفيعة', 'الدخن', 'السمسم'],
    cropNote: 'المانجو محصول بارز إقليميًا والبن مرتبط بالمحافظات الجبلية والحبوب مذكورة في دراسة الزراعة المطرية',
    waterSources: [sources.rainCrops, sources.terraces],
    cropSources: [sources.mango, sources.terraces, sources.rainCrops],
    scope: 'region',
  },
  'SA-10': {
    ...groundwaterContext,
    crops: ['الحمضيات', 'التمور', 'العنب'],
    cropNote: 'محاصيل موثقة في منطقة نجران ولا تعني تماثل الزراعة بين الوادي والمحافظات الصحراوية',
    cropSources: [sources.citrus, sources.dates, sources.grapes],
  },
  'SA-11': {
    waterKind: 'rain',
    waterTitle: 'أمطار ومدرجات تحصد المياه',
    waterNote: 'تستفيد المدرجات من جمع الأمطار وتغذية الآبار القريبة مع تفاوت مصادر الري بين السراة وتهامة ولا تتوفر نسب مقارنة لكل محافظة',
    crops: ['الرمان', 'البن', 'الموز', 'الذرة الرفيعة', 'القمح', 'الدخن'],
    cropNote: 'تجمع القائمة محاصيل مبادرة المدرجات ومحاصيل الدراسة المطرية في منطقة الباحة',
    waterSources: [sources.terraces, sources.rainCrops],
    cropSources: [sources.terraces, sources.rainCrops],
    scope: 'region',
  },
  'SA-12': {
    waterKind: 'ground',
    waterTitle: 'مياه جوفية تُستخرج بالآبار',
    waterNote: 'توثق واس دور المياه الجوفية في زراعة الجوف وتقع المنطقة ضمن الرف الرسوبي دون بيانات هنا لترتيب مصادر الري داخل كل محافظة',
    crops: ['الزيتون', 'التمور', 'العنب', 'الخضروات'],
    cropNote: 'محاصيل موثقة إقليميًا ويختلف توزيع مزارعها بين محافظات الجوف',
    waterSources: [sources.jawf, sources.aquifers],
    cropSources: [sources.jawf, sources.grapes],
    scope: 'region',
  },
  'SA-14': {
    waterKind: 'rain',
    waterTitle: 'أمطار محصودة ومياه أودية',
    waterNote: 'للأمطار دور موثق في المدرجات والحبوب وتغذية المياه الجوفية ببيشة وتختلف وسائل الري بين مرتفعات عسير وأوديتها ومحافظاتها',
    crops: ['القمح', 'الذرة الرفيعة', 'الشعير', 'السمسم', 'البن', 'التمور'],
    cropNote: 'الحبوب من دراسة الزراعة المطرية والبن من مبادرة المدرجات والتمور موثقة إقليميًا',
    waterSources: [sources.rainCrops, sources.terraces, sources.bishahWater],
    cropSources: [sources.rainCrops, sources.terraces, sources.dates],
    scope: 'region',
  },
}

// Exact ADM2 names used by the local map dataset. Only source-backed local
// evidence belongs here; absent governorates use a visibly regional fallback.
export const localProfiles: Record<string, AgricultureProfile> = {
  'Al Ahsa Governorate': {
    waterKind: 'mixed',
    waterTitle: 'مياه جوفية وشبكات مياه مجددة',
    waterNote: 'واحة الأحساء ضمن نطاق المياه الجوفية وتخدمها مشاريع لنقل المياه المعالجة ثلاثيًا للري وتختلف التغطية بين المزارع ولا تشمل بالضرورة كامل المحافظة',
    crops: ['التمور', 'اللومي الحساوي', 'الخضروات'],
    cropNote: 'منتجات موثقة لمزارع الأحساء وتشتهر الواحة بالنخيل والليمون الحساوي',
    waterSources: [sources.aquifers, sources.ahsaWater, sources.ahsaReuse],
    cropSources: [sources.ahsaCrops, sources.ahsaLime],
    scope: 'local',
  },
  'Al Taif': {
    waterKind: 'rain',
    waterTitle: 'حصاد أمطار ومدرجات زراعية',
    waterNote: 'الطائف مشمولة بمبادرة حصاد الأمطار وتجميعها وتغذية الآبار القريبة وهي ممارسة موثقة للمزارع المستهدفة وليست إحصاءً لجميع مصادر الري بالمحافظة',
    crops: ['الورد الطائفي', 'العنب', 'القمح المطري'],
    cropNote: 'الورد والعنب ضمن محاصيل المدرجات والقمح موثق في حقول الدراسة المطرية بالطائف',
    waterSources: [sources.terraces, sources.rainCrops],
    cropSources: [sources.terraces, sources.rainCrops],
    scope: 'local',
  },
  'Al Ula': {
    waterKind: 'ground',
    waterTitle: 'آبار المياه الجوفية',
    waterNote: 'يوثق تقرير الهيئة الملكية الاعتماد على الآبار الجوفية والحاجة إلى رفع كفاءة الري وتقليل السحب ولا تعرض البطاقة حصصًا مائية لكل مزرعة',
    crops: ['التمور', 'الحمضيات'],
    cropNote: 'منتجان رئيسيان في برامج الزراعة بالهيئة الملكية لمحافظة العلا',
    waterSources: [sources.ulaWater],
    cropSources: [sources.ulaCrops],
    scope: 'local',
  },
  'Bishah': {
    waterKind: 'mixed',
    waterTitle: 'سيول وسدود تغذي المياه الجوفية',
    waterNote: 'توثق الوزارة دور أمطار بيشة وأوديتها وسدودها في زيادة المياه الجوفية المستفاد منها لري النخيل دون تحديد نسب بين مصادر الري',
    crops: ['التمور'],
    cropNote: 'بيشة من واحات النخيل الموثقة وتقتصر هذه البطاقة على المحصول المؤكد محليًا في المصادر',
    waterSources: [sources.bishahWater],
    cropSources: [sources.bishahWater, sources.palmOases],
    scope: 'local',
  },
  'Ad Dair': {
    waterKind: 'mixed',
    waterTitle: 'حصاد أمطار وري تكميلي بالخزانات',
    waterNote: 'توثق المصادر برامج حصاد الأمطار بالمدرجات وخزانات وشبكات ري لمزارع البن في الداير دون تحديد مصدر مياه جميع الخزانات أو حصص كل مصدر',
    crops: ['البن'],
    cropNote: 'مزارع البن موثقة على مستوى محافظة الداير ويختلف الإنتاج بين المزارع والمواسم',
    waterSources: [sources.dairHarvest, sources.dairIrrigation],
    cropSources: [sources.dairCoffee],
    scope: 'local',
  },
}
