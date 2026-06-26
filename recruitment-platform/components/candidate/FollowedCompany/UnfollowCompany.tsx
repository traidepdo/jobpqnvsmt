import { useState } from "react";

export default function UnfollowCompany({
    unfollowingId,
    setUnfollowingId,
    confirmUnfollow,
}: {
    unfollowingId: string | null;
    setUnfollowingId: (id: string | null) => void;
    confirmUnfollow: () => Promise<void> | void;
}) {
    const [isPending, setIsPending] = useState(false);

    if (!unfollowingId) return null;

    const handleConfirm = async () => {
        if (isPending) return;
        setIsPending(true);
        try {
            await confirmUnfollow();
        } catch (error) {
            console.error("Lỗi khi bỏ theo dõi công ty:", error);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-[slideUp_0.2s_ease]">
                <div className="p-8 text-center">
                    <span className="material-symbols-outlined text-5xl text-red-500 mb-4 block animate-bounce">
                        warning
                    </span>
                    <h3 className="text-lg font-bold text-[#041b3c] mb-2">Xác nhận bỏ theo dõi</h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-6">
                        Bạn có chắc chắn muốn <span className="font-bold text-red-500">Bỏ theo dõi</span> công ty này?
                        <br />
                        Bạn sẽ không nhận được thông báo về các tin tuyển dụng mới từ công ty này nữa.
                    </p>

                    <div className="flex justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => setUnfollowingId(null)}
                            disabled={isPending}
                            className="px-6 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isPending}
                            className="px-6 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            {isPending ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Đang hủy...
                                </>
                            ) : (
                                "Xác nhận bỏ theo dõi"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}