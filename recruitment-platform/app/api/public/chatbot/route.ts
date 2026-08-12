import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { companyPublicSelect } from "@/lib/prismaSafe";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    const djangoUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://severai-api.onrender.com';
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
      djangoResponse = await fetch(`${djangoUrl}/api/chatbot/recommend/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.INTERNAL_API_KEY || ""}`,
        },
        body: djangoFormData,
      });
    } else {
      const body = await req.json();
      djangoResponse = await fetch(`${djangoUrl}/api/chatbot/recommend/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.INTERNAL_API_KEY || ""}`,
        },
        body: JSON.stringify(body),
      });
    }

    if (!djangoResponse.ok) {
      const errText = await djangoResponse.text();
      let errorMessage = `Máy chủ SeverAI phản hồi lỗi (${djangoResponse.status}): ${errText}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error) errorMessage = errJson.error;
      } catch (e) {}
      console.error("[Chatbot CV AI Error]:", errorMessage);
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
