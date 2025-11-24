// pages/api/assistant-chat.ts
import type { NextApiRequest, NextApiResponse } from "next";

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY غير مفعّل في .env.local",
      });
    }

    const {
      userQuestion,
      reportSummary,
      cropCategory,
      farmerNotes,
      inspectionId,
    } = req.body || {};

    if (!userQuestion) {
      return res
        .status(400)
        .json({ error: "userQuestion مفقود في الطلب." });
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
معرّف الفحص (اختياري فقط للسجل): ${inspectionId || "غير محدد"}
`.trim();

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
      console.error("OpenAI error in /api/assistant-chat:", {
        status: openaiRes.status,
        body: openaiJson,
      });

      return res.status(500).json({
        error:
          "تعذر الحصول على رد من نموذج الذكاء الاصطناعي في هذه اللحظة. حاول مرة أخرى لاحقاً.",
      });
    }

    const replyText =
      extractAssistantText(openaiJson.choices?.[0]) ||
      "تمت معالجة سؤالك، لكن لم يتم توليد رد واضح.";

    return res.status(200).json({ reply: replyText });
  } catch (err) {
    console.error("Unexpected error in /api/assistant-chat:", err);
    return res.status(500).json({
      error:
        "حدث خطأ غير متوقع داخل /api/assistant-chat. حاول مرة أخرى لاحقاً.",
    });
  }
}
