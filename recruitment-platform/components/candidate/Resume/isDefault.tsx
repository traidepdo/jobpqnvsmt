export default function IsDefault({ id, handleSetDefault, isDefault }: { id: string, handleSetDefault: (id: string) => void, isDefault: boolean }) {
    return (
        <>
            {!isDefault && (
                <button
                    onClick={() => handleSetDefault(id)}
                    className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-cyan-600 bg-cyan-50 border border-cyan-200/60 rounded-xl hover:bg-cyan-100 transition-all cursor-pointer"
                    title="Đặt làm CV mặc định để nộp nhanh"
                >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Mặc định
                </button>
            )}

        </>
    )
}
