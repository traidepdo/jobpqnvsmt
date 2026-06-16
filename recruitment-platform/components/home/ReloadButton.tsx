'use client'; // Nút này cần tương tác với trình duyệt

export default function ReloadButton() {
    return (
        <button
            onClick={() => window.location.reload()}
            className="text-sm px-5 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer font-medium transition-colors"
        >
            Tải lại
        </button>
    );
}