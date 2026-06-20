export default function Loading() {
    return (
        <div className="min-h-[85vh] w-full flex flex-col items-center justify-center bg-[#f0fdf4]/60 backdrop-blur-sm px-4">
            <div className="relative flex flex-col items-center max-w-sm w-full bg-white/80 border border-green-100/80 rounded-3xl p-10 shadow-[0_20px_50px_rgba(22,163,74,0.05)] backdrop-blur-md">
                {/* Logo and Spinner Area */}
                <div className="relative flex items-center justify-center w-24 h-24 mb-8">
                    {/* Pulsing Outer Ring */}
                    <div className="absolute inset-0 rounded-full bg-green-100/80 animate-ping opacity-75" />
                    
                    {/* Spinning Gradient Border Ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-600 border-r-emerald-400 animate-spin" />
                    
                    {/* Inner Solid Circle with Icon */}
                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-green-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-green-500/25">
                        <span className="material-symbols-outlined text-white text-3xl font-bold">work</span>
                    </div>
                </div>

                {/* Title & Brand */}
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                        Phú Quốc <span className="text-green-600">Jobs</span>
                    </h2>
                    <p className="text-sm font-semibold text-gray-500 animate-pulse">
                        Đang kết nối dữ liệu...
                    </p>
                </div>

                {/* Progress bar loader */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-8 relative">
                    <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full absolute top-0 left-0 w-full origin-left animate-[loading_1.5s_infinite_ease-in-out]" 
                    />
                </div>

                {/* Nice small tip/message */}
                <span className="text-[11px] text-gray-400 mt-6 text-center font-medium">
                    Hệ thống đang tìm kiếm cơ hội tốt nhất cho bạn
                </span>
            </div>

            {/* Inject custom keyframe in standard CSS */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes loading {
                    0% {
                        transform: scaleX(0.05) translateX(-10%);
                    }
                    50% {
                        transform: scaleX(0.4) translateX(120%);
                    }
                    100% {
                        transform: scaleX(0.05) translateX(2000%);
                    }
                }
            `}} />
        </div>
    );
}
