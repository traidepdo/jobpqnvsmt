'use client';

import { useEffect } from 'react';

interface BlogViewTrackerProps {
    blogId: string;
}

export default function BlogViewTracker({ blogId }: BlogViewTrackerProps) {
    useEffect(() => {
        if (!blogId) return;

        // Prevent incrementing view multiple times in the same session
        const sessionKey = `viewed_blog_${blogId}`;
        if (typeof window !== 'undefined' && sessionStorage.getItem(sessionKey)) {
            return;
        }

        let accumulatedTime = 0; // in milliseconds
        let lastTimestamp = Date.now();
        let timer: NodeJS.Timeout | null = null;
        let isViewCounted = false;

        const TARGET_TIME = 25000; // 25 seconds

        const recordView = async () => {
            if (isViewCounted) return;
            isViewCounted = true;
            try {
                sessionStorage.setItem(sessionKey, 'true');
                await fetch(`/api/blogs/${blogId}/view`, { method: 'POST' });
            } catch (error) {
                console.error('Failed to increment blog view:', error);
            }
        };

        const tick = () => {
            if (document.visibilityState === 'visible') {
                const now = Date.now();
                accumulatedTime += now - lastTimestamp;
                lastTimestamp = now;

                if (accumulatedTime >= TARGET_TIME) {
                    recordView();
                    if (timer) clearInterval(timer);
                    return;
                }
            } else {
                lastTimestamp = Date.now();
            }
        };

        lastTimestamp = Date.now();
        timer = setInterval(tick, 1000);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                lastTimestamp = Date.now();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (timer) clearInterval(timer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [blogId]);

    return null;
}
