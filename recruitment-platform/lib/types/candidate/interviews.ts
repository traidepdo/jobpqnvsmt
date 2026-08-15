export type InterviewType = 'ONLINE' | 'OFFLINE';
export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
export type CandidateInterviewStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED';
export type InterviewResult = 'PENDING' | 'PASSED' | 'FAILED';

export interface Interview {
    id: string;
    scheduledAt: string;
    type: InterviewType;
    location: string;
    notes: string | null;
    status: InterviewStatus;
    candidateStatus: CandidateInterviewStatus;
    result: InterviewResult;
    declineReason: string | null;
    application: {
        id: string;
        job: {
            title: string;
            category?: { name: string } | null;
            company: { name: string; logo: string | null; industry?: string | null };
        };
    };
}
