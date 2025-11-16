// lib/mockData.ts

export type Consultant = {
  id: string;
  name: string;
  experienceYears: number;
  region: string;
  bio: string;
  services: string[];
  remotePrice: number;
  onSitePrice: number;
};

export const consultants: Consultant[] = [
  {
    id: "1",
    name: "م. أحمد القحطاني",
    experienceYears: 10,
    region: "منطقة عسير وما حولها",
    bio: "مهندس زراعي متخصص في محاصيل الخضار المكشوفة والبيوت المحمية، مع خبرة في تصميم برامج الري والتسميد.",
    services: [
      "استشارة عن بعد",
      "زيارة ميدانية",
      "إعداد برنامج تسميد",
      "تشخيص أمراض نباتية",
    ],
    remotePrice: 180,
    onSitePrice: 450,
  },
  {
    id: "2",
    name: "م. سارة العتيبي",
    experienceYears: 7,
    region: "الوسطى والشرقية",
    bio: "متخصصة في إدارة مزارع النخيل والخضار المنزلية، مع خبرة في الزراعة العضوية ومكافحة الآفات بطرق متكاملة.",
    services: [
      "استشارة عن بعد",
      "تصميم حديقة منزلية",
      "متابعة شهرية",
    ],
    remotePrice: 150,
    onSitePrice: 400,
  },
];

export const expertStats = {
  joinedAt: "يناير 2025",
  accountAge: "6 أشهر (تجريبية)",
  totalRequests: 24,
  pendingRequests: 3,
  totalEarned: 7200,
  servicesCount: 4,
};

export const expertRequests = [
  {
    id: "r1",
    clientName: "مزرعة الوادي الأخضر",
    type: "استشارة عن بعد",
    location: "عسير",
    status: "قيد التنفيذ",
    expectedTime: "خلال 48 ساعة",
  },
  {
    id: "r2",
    clientName: "مزرعة الروضة",
    type: "زيارة ميدانية",
    location: "المنطقة الجنوبية",
    status: "مكتمل",
    expectedTime: "تمت قبل 3 أيام",
  },
  {
    id: "r3",
    clientName: "مزرعة البيت الصغير",
    type: "استشارة عن بعد",
    location: "زراعة منزلية",
    status: "قيد المراجعة",
    expectedTime: "بانتظار جدولة الموعد",
  },
];

export const regionsStats = [
  {
    id: "reg1",
    name: "منطقة عسير (دائرة 100 كم)",
    farmsCount: 35,
    topPlants: ["طماطم", "خيار", "قمح", "محاصيل ورقية"],
    waterSources: ["آبار", "شبكة ري حكومية", "خزانات"],
    farmingTypes: ["تقليدية", "منازل", "بيوت محمية"],
  },
  {
    id: "reg2",
    name: "المنطقة الوسطى (دائرة 100 كم)",
    farmsCount: 22,
    topPlants: ["نخيل", "برسيم", "خضروات موسمية"],
    waterSources: ["آبار عميقة", "شبكات ري", "خزانات"],
    farmingTypes: ["تقليدية", "مزارع تجارية"],
  },
  {
    id: "reg3",
    name: "المنطقة الشرقية (دائرة 100 كم)",
    farmsCount: 18,
    topPlants: ["نخيل", "خضروات", "محاصيل علفية"],
    waterSources: ["آبار", "تحلية", "خزانات"],
    farmingTypes: ["تقليدية", "زراعة مكثفة"],
  },
];
