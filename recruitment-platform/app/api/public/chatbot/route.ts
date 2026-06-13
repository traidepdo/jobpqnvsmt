import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { companyPublicSelect } from "@/lib/prismaSafe";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let djangoResponse;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      // Forward form data to Django
      const djangoFormData = new FormData();
      const file = formData.get("file") as unknown as File;
      if (file) {
        const buffer = await file.arrayBuffer();
        const blob = new Blob([buffer], { type: file.type });
        djangoFormData.append("file", blob, file.name);
      }
      djangoResponse = await fetch("http://127.0.0.1:8000/api/chatbot/recommend/", {
        method: "POST",
        body: djangoFormData,
      });
    } else {
      const body = await req.json();
      djangoResponse = await fetch("http://127.0.0.1:8000/api/chatbot/recommend/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    }

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
    const recommendations = data.recommended_jobs || [];
    const message = data.message || "Hệ thống gợi ý thành công!";

    if (recommendations.length === 0) {
      return NextResponse.json({ message, recommended_jobs: [] }, { status: 200 });
    }

    const recommendedIds = recommendations.map((r: any) => r.id);

    // Retrieve full job details from database
    const jobs = await prisma.job.findMany({
      where: {
        id: { in: recommendedIds },
        isVisible: true
      },
      include: {
        company: { select: companyPublicSelect },
        category: { select: { name: true } },
        ward: { select: { name: true } }
      }
    });

    // Map job details with reasons from Gemini
    const enrichedRecommendations = recommendations.map((rec: any) => {
      const jobDetails = jobs.find((j: any) => j.id === rec.id);
      if (!jobDetails) return null;
      return {
        ...jobDetails,
        reason: rec.reason
      };
    }).filter(Boolean);

    return NextResponse.json({
      message,
      recommended_jobs: enrichedRecommendations
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error in Next.js chatbot proxy route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
