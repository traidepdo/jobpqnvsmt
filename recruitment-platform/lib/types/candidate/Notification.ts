export interface Notification {
    id: string;
    title: string;
    content: string;
    isRead: boolean;
    createdAt: string;
    refId?: string | null;
    type: string;
};
