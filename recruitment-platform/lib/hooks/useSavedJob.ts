import { useState, useEffect } from 'react';
import { SavedItem, SavedJobsResponse } from '@/lib/types/candidate/SavedJob';
import { useRouter } from 'next/navigation';
import { delectSaveJobAction } from '@/server/actions/candidate/savejob.action';
interface Metadata {
    total: number;
    page: number;
    limit: number;
    query?: string;
    category?: string;
    fromDate?: string;
    toDate?: string;
    period?: string;
    totalPages: number;
}

export function useSavedJob(initialItems: SavedItem[], metadata: Metadata, userId: string) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<SavedItem[]>(initialItems);
    const [searchQuery, setSearchQuery] = useState(metadata.query || '');
    const [fromDate, setFromDate] = useState(metadata.fromDate || '');
    const [toDate, setToDate] = useState(metadata.toDate || '');
    const [period, setPeriod] = useState(metadata.period || 'all');

    const [category, setCategory] = useState(metadata.category || '');

    useEffect(() => {
        setItems(initialItems);
        setLoading(false);
    }, [initialItems]);

    useEffect(() => {
        setFromDate(metadata.fromDate || '');
        setToDate(metadata.toDate || '');
        setPeriod(metadata.period || (metadata.fromDate || metadata.toDate ? 'custom' : 'all'));
        setCategory(metadata.category || '');
    }, [metadata.fromDate, metadata.toDate, metadata.period, metadata.category]);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const params = new URLSearchParams(window.location.search);
        params.set('page', '1');
        if (searchQuery.trim()) {
            params.set('query', searchQuery.trim());
        } else {
            params.delete('query');
        }
        router.push(`/candidate/saved?${params.toString()}`);
    };

    const handleCategoryChange = (newCategory: string) => {
        setCategory(newCategory);
        const params = new URLSearchParams(window.location.search);
        params.set('page', '1');
        if (newCategory && newCategory !== 'all') {
            params.set('category', newCategory);
        } else {
            params.delete('category');
        }
        router.push(`/candidate/saved?${params.toString()}`);
    };

    const handlePeriodChange = (newPeriod: string) => {
        setPeriod(newPeriod);
        const params = new URLSearchParams(window.location.search);
        params.set('page', '1');
        params.delete('fromDate');
        params.delete('toDate');

        if (newPeriod && newPeriod !== 'all' && newPeriod !== 'custom') {
            params.set('period', newPeriod);
        } else {
            params.delete('period');
        }
        router.push(`/candidate/saved?${params.toString()}`);
    };

    const handleDateRangeApply = (from: string, to: string) => {
        const params = new URLSearchParams(window.location.search);
        params.set('page', '1');
        params.delete('period');

        if (from) params.set('fromDate', from);
        else params.delete('fromDate');

        if (to) params.set('toDate', to);
        else params.delete('toDate');

        router.push(`/candidate/saved?${params.toString()}`);
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setFromDate('');
        setToDate('');
        setPeriod('all');
        setCategory('');
        router.push('/candidate/saved');
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > metadata.totalPages) return;
        const params = new URLSearchParams(window.location.search);
        params.set('page', newPage.toString());
        router.push(`/candidate/saved?${params.toString()}`);
    };

    const handleUnsave = async (jobId: string) => {
        const res = await delectSaveJobAction(jobId);
        if (res.success) {
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

    return {
        items,
        searchQuery,
        setSearchQuery,
        fromDate,
        setFromDate,
        toDate,
        setToDate,
        period,
        category,
        setCategory,
        handleSearch,
        handleCategoryChange,
        handlePeriodChange,
        handleDateRangeApply,
        handleResetFilters,
        handlePageChange,
        handleUnsave,
        getPageNumbers,
        router
    };
}