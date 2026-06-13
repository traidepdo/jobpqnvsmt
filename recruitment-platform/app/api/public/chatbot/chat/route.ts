import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const djangoResponse = await fetch("http://127.0.0.1:8000/api/chatbot/chat/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.INTERNAL_API_KEY || ""}`,
      },
      body: JSON.stringify(body),
    });

    if (!djangoResponse.ok) {
      const errText = await djangoResponse.text();
      let errorMessage = "Lỗi xử lý từ AI Service";
      try {
        const errJson = JSON.parse(errText);
        errorMessage = errJson.error || errorMessage;
      } catch (e) {}
      return NextResponse.json({ error: errorMessage }, { status: djangoResponse.status });
    }

    const data = await djangoResponse.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error("Error in Next.js chatbot proxy chat route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
