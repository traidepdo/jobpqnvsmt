import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message || (typeof message === 'string' && !message.trim())) {
      return NextResponse.json({ response: "Xin chào! Bạn có thể đặt câu hỏi về tìm kiếm việc làm hoặc tư vấn tuyển dụng tại Phú Quốc." }, { status: 200 });
    }

    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json({ response: "Xin chào! Rất vui được hỗ trợ bạn tìm kiếm cơ hội nghề nghiệp phù hợp tại Phú Quốc." }, { status: 200 });
    }

    const contents = [];
    if (Array.isArray(history)) {
      for (const turn of history) {
        if (turn.text) {
          contents.push({
            role: turn.sender === "user" ? "user" : "model",
            parts: [{ text: turn.text }]
          });
        }
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const systemPrompt = "Bạn là trợ lý tư vấn tuyển dụng và hỗ trợ việc làm Phú Quốc Jobs thông minh, thân thiện. Hãy trả lời ngắn gọn, súc tích bằng tiếng Việt, xưng 'tôi' hoặc 'mình' và gọi khách hàng là 'bạn'.";
    
    const formattedContents = [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nCâu hỏi từ ứng viên: ${message}` }]
      }
    ];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: formattedContents
      })
    });

    if (!response.ok) {
      return NextResponse.json({ response: "Chào bạn! Tôi là Trợ lý AI Phú Quốc Jobs. Hiện tại tôi có thể hỗ trợ bạn tìm kiếm các vị trí tuyển dụng mới nhất trên hệ thống!" }, { status: 200 });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Xin chào! Tôi có thể giúp gì cho bạn về định hướng nghề nghiệp hôm nay?";

    return NextResponse.json({ response: replyText }, { status: 200 });

  } catch (error: any) {
    console.error("Error in direct Gemini Chatbot route:", error);
    return NextResponse.json({ response: "Chào bạn! Rất vui được hỗ trợ bạn tìm kiếm cơ hội nghề nghiệp phù hợp tại Phú Quốc." }, { status: 200 });
  }
}
