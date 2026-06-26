import { useState } from 'react';

export default function Cancel({
    cancelTargetId,
    setCancelTargetId,
    confirmCancelApplication
}: {
    cancelTargetId: string | null;
    setCancelTargetId: (cancelTargetId: string | null) => void;
    confirmCancelApplication: () => Promise<void>;
}) {
    const [isPending, setIsPending] = useState(false);

    const handleConfirm = async () => {
        if (isPending) return;
        setIsPending(true);
        try {
            await confirmCancelApplication();
        } finally {
            setIsPending(false);
        }
    };

    return (
        <>
            {cancelTargetId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-gray-100 animate-[slideUp_0.25s_ease]"
                        style={{ animation: 'slideUp 0.2s ease' }}>
                        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 text-center mb-2">Hủy ứng tuyển</h3>
                        <p className="text-xs text-gray-500 text-center mb-6 leading-relaxed">
                            Bạn có chắc chắn muốn hủy đơn ứng tuyển cho công việc này? Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setCancelTargetId(null)}
                                disabled={isPending}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isPending}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                {isPending ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Đang hủy...
                                    </>
                                ) : (
                                    'Xác nhận hủy'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}