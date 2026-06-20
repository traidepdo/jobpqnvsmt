'use client';

export default function EmployerLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full py-12">
      <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#0052CC] rounded-full animate-spin" />
      <p className="text-gray-400 text-sm mt-3 font-medium animate-pulse">Đang tải dữ liệu...</p>
    </div>
  );
}
