'use client'

export default function ButtonDelete({
    id,
    onDelete,
    isDeleting
}: {
    id: string;
    onDelete: (id: string) => void;
    isDeleting: boolean;
}) {
    return (
        <button
            onClick={() => onDelete(id)}
            disabled={isDeleting}
            className="px-3 py-2 text-xs font-semibold text-red-500 bg-red-50/60 hover:bg-red-50 hover:text-red-600 rounded-xl border border-red-100 transition-all cursor-pointer disabled:opacity-50"
            title="Xóa CV"
        >
            <span className="material-symbols-outlined text-[16px]">{isDeleting ? 'sync' : 'delete'}</span>
        </button>
    );
}