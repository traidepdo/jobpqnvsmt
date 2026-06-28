import { InterviewStatus, CandidateInterviewStatus } from "./types/candidate/interviews";


export const STATUS_CFG: Record<InterviewStatus, { label: string; color: string; bg: string; border: string; icon: string }> = {
    SCHEDULED: { label: 'Sắp diễn ra', color: '#0052CC', bg: '#EFF4FF', border: '#C7D9FF', icon: 'event' },
    COMPLETED: { label: 'Hoàn thành', color: '#00875A', bg: '#E3FCEF', border: '#ABF5D1', icon: 'check_circle' },
    CANCELLED: { label: 'Đã hủy', color: '#DE350B', bg: '#FFEBE6', border: '#FFBDAD', icon: 'cancel' },
};

export const CANDIDATE_CFG: Record<CandidateInterviewStatus, { label: string; color: string; bg: string; icon: string }> = {
    PENDING: { label: 'Chờ xác nhận của bạn', color: '#FF8B00', bg: '#FFFAE6', icon: 'hourglass_empty' },
    CONFIRMED: { label: 'Bạn đã xác nhận', color: '#00875A', bg: '#E3FCEF', icon: 'thumb_up' },
    DECLINED: { label: 'Bạn đã từ chối', color: '#DE350B', bg: '#FFEBE6', icon: 'thumb_down' },
};