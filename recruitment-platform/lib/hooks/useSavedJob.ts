import { useState, useEffect } from 'react';
import { SavedItem } from '@/lib/types/candidate/SavedJob';
import { useRouter } from 'next/navigation';
interface Metadata {
    total: number;
    page: number;
    limit: number;
    query?: string;
    totalPages: number;
}

export function useSavedJob(initialItems: SavedItem[], metadata: Metadata) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<SavedItem[]>(initialItems);
    const [searchQuery, setSearchQuery] = useState(metadata.query || '');

    useEffect(() => {
        setItems(initialItems);
        setLoading(false);
    }, [initialItems]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(window.location.search);
        params.set('page', '1');
        if (searchQuery.trim()) {
            params.set('query', searchQuery.trim());
        } else {
            params.delete('query');
        }
        router.push(`/candidate/saved?${params.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > metadata.totalPages) return;
        const params = new URLSearchParams(window.location.search);
        params.set('page', newPage.toString());
        router.push(`/candidate/saved?${params.toString()}`);
    };

    const handleUnsave = async (jobId: string) => {
        const res = await fetch(`/api/candidate/saved-jobs?jobId=${jobId}`, { method: 'DELETE' });
        if (res.ok) {
            setItems(prev => prev.filter(i => i.job.id !== jobId));
            router.refresh();
        }
    };

    const getPageNumbers = () => {
        const total = metadata.totalPages;
        const current = metadata.page;
        const pages = [];
        for (let i = 1; i <= total; i++) {
            if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== '...') {
                pages.push('...');
            }
        }
        return pages;
    };

    return { items, searchQuery, setSearchQuery, handleSearch, handlePageChange, handleUnsave, getPageNumbers, router }
}