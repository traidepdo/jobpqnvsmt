import { prisma } from "@/lib/prisma";
import { companyPublicSelect } from "@/lib/prismaSafe";

export const jobsDetailService = {
  async getJobMetadata(slug: string) {
    return prisma.job.findUnique({
      where: { slug },
      select: { title: true, description: true }
    });
  },

  async getJobDetail(slug: string) {
    return prisma.job.findUnique({
      where: { slug },
      include: {
        company: { select: companyPublicSelect },
        category: { select: { name: true, slug: true } },
        ward: { select: { name: true, slug: true } },
        _count: { select: { applications: true } }
      }
    });
  },

  async getUserJobState(jobId: string, userId: string) {
    const [resumes, savedRecord, applications] = await Promise.all([
      prisma.resume.findMany({ where: { userId } }),
      prisma.savedJob.findUnique({ where: { userId_jobId: { userId, jobId } } }),
      prisma.application.findMany({ where: { userId, jobId } })
    ]);

    return {
      userResumes: resumes.map(r => ({ id: r.id, title: r.title || 'CV', isDefault: r.isDefault })),
      initialSaved: !!savedRecord,
      initialApplications: applications.map(a => ({ id: a.id, jobId: a.jobId, status: a.status }))
    };
  },

  async getRelatedJobsByIds(recIds: string[]) {
    const dbJobs = await prisma.job.findMany({
      where: {
        id: { in: recIds }
      },
      include: {
        company: { select: companyPublicSelect },
        category: { select: { name: true } },
        ward: { select: { name: true } }
      }
    });
    return recIds.map((id: string) => dbJobs.find(j => j.id === id)).filter(Boolean);
  }
};
