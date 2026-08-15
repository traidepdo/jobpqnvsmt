export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
export type CandidateInterviewStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED';
export type InterviewResult = 'PENDING' | 'PASSED' | 'FAILED';

export interface ApprovedApplication {
    applicationId: string;
    userId: string;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    jobTitle: string;
    jobId: string;
    appliedAt: string;
    isBookmarked: boolean;
}

export interface Interview {
    id: string;
    scheduledAt: string;
    type: 'ONLINE' | 'OFFLINE';
    location: string;
    notes: string | null;
    status: InterviewStatus;
    candidateStatus: CandidateInterviewStatus;
    result: InterviewResult;
    declineReason: string | null;
    application: {
        id: string;
        user: { id: string; name: string; email: string; phone: string | null; avatar: string | null };
        job: { id: string; title: string };
    };
}
export interface Job {
    id: string;
    title: string;
}