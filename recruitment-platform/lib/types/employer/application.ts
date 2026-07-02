export interface Application {
    id: string;
    status: string;
    coverLetter?: string | null;
    createdAt: string;
    isBookmarked: boolean;
    user: { id: string; name: string; email: string; phone: string | null; avatar: string | null };
    job: { id: string; title: string; slug: string; company?: { name: string } };
    resume: {
        id: string;
        title: string;
        summary: string | null;
        address: string | null;
        education: unknown;
        experience: unknown;
    } | null;
    cvUrl?: string | null;
    conversationId?: string | null;
    quizScore?: number | null;
    quizDuration?: number | null;
    matchScore?: number | null;
}