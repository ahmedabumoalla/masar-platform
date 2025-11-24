// app/api/assistant/chat/route.ts
import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// دالة بسيطة لاستخراج نص المساعد من رد OpenAI
function extractAssistantText(choice: any): string {
  if (!choice) return "";
  const msg = choice.message || choice;
  if (!msg) return "";
  const content = msg.content;

  if (Array.isArray(content)) {
    return (
      content
        .map((p: any) => (typeof p.text === "string" ? p.text : ""))
        .join("\n")
        .trim() || ""
    );
  }

  if (typeof content === "string") return content;
  return "";
}

export async function POST(req: Request) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY غير مفعّل في .env.local" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);

    const {
      userQuestion,
      reportSummary,
      cropCategory,
      farmerNotes,
      inspectionId,
    } = body || {};

    if (!userQuestion) {
      return NextResponse.json(
        { error: "userQuestion مفقود في الطلب." },
        { status: 400 }
      );
    }

    const systemPrompt = `
أنت مساعد زراعي ذكي ضمن منصة "مسار".
دورك أن تشرح للمزارع حالة النباتات بلغة عربية بسيطة،
وتعطيه خطوات عملية واضحة لما يمكن أن يفعله اليوم في الري والتسميد والعناية.
لا تعطي وصفات أدوية قوية أو مبيدات خطيرة، بل ركّز على الممارسات الزراعية الآمنة
واذكر دائمًا أن هذه التوصيات لا تغني عن استشارة مهندس زراعي مرخّص.

ملخص آخر فحص متوفر (إن وجد):
${reportSummary || "لا يوجد تقرير مفصل محفوظ لهذا الفحص."}

نوع المحصول: ${cropCategory || "غير محدد"}
ملاحظات المزارع السابقة: ${farmerNotes || "لا توجد ملاحظات إضافية."}
`.trim();

    // استدعاء OpenAI (نفس مفتاح OPENAI_API_KEY اللي تستخدمه في تحليل الصور)
    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.4,
          max_tokens: 600,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userQuestion },
          ],
        }),
      }
    );

    const openaiJson = await openaiRes.json().catch(() => null);

    if (!openaiRes.ok || !openaiJson) {
      console.error("OpenAI error in /api/assistant/chat:", {
        status: openaiRes.status,
        body: openaiJson,
      });

      return NextResponse.json(
        {
          error:
            "تعذر الحصول على رد من نموذج الذكاء الاصطناعي في هذه اللحظة. حاول مرة أخرى لاحقاً.",
        },
        { status: 500 }
      );
    }

    const replyText =
      extractAssistantText(openaiJson.choices?.[0]) ||
      "تمت معالجة سؤالك، لكن لم يتم توليد رد واضح.";

    // لو حاب لاحقًا تحفظ الاستشارات في قاعدة البيانات،
    // نضيف كود Supabase هنا، بس حالياً نرجّع الرد فقط للفرونت.

    return NextResponse.json({ reply: replyText });
  } catch (err) {
    console.error("Unexpected error in /api/assistant/chat:", err);
    return NextResponse.json(
      {
        error:
          "حدث خطأ غير متوقع داخل /api/assistant/chat. حاول مرة أخرى لاحقاً.",
      },
      { status: 500 }
    );
  }
}
