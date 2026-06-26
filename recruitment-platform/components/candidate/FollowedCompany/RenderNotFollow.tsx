import Link from "next/link";

export default function RenderNotFollow() {
    return (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-gray-300 block mb-3">business</span>
            <p className="font-semibold text-gray-600 mb-1">Chưa theo dõi công ty nào</p>
            <p className="text-sm text-gray-400 mb-6">
                Theo dõi các công ty để cập nhật tin tuyển dụng mới nhất
            </p>
            <Link
                href="/companies"
                className="inline-flex px-6 py-2.5 bg-[#00b14f] text-white font-bold rounded-lg text-sm hover:bg-[#009940] transition-colors"
            >
                Khám phá công ty
            </Link>
        </div>
    );
}