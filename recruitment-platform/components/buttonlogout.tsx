'use client'

import { useRouter } from 'next/navigation';

export default function ButtonLogout() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const res = await fetch('/api/auth/logout', {
                method: 'POST',
            });
            if (res.ok) {
                router.refresh();
                router.push('/')
            }
            router.push('/login');
        } catch (error) {
            console.log(error);
        }
    };
    return (
        <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-3xl hover:bg-red-50 transition-colors"
        >
            Logout
        </button>
    );
}