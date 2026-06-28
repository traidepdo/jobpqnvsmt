export type InterviewType = 'ONLINE' | 'OFFLINE';
export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
export type CandidateInterviewStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED';

export interface Interview {
    id: string;
    scheduledAt: string;
    type: InterviewType;
    location: string;
    notes: string | null;
    status: InterviewStatus;
    candidateStatus: CandidateInterviewStatus;
    declineReason: string | null;
    application: {
        id: string;
        job: {
            title: string;
            company: { name: string; logo: string | null };
        };
    };
}
