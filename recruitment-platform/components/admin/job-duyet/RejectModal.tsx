import React from "react";
import { FiX } from "react-icons/fi";

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionLoading: boolean;
  customRejectReason: string;
  setCustomRejectReason: (val: string) => void;
}

export default function RejectModal({
  isOpen,
  onClose,
  onConfirm,
  actionLoading,
  customRejectReason,
  setCustomRejectReason,
}: RejectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div 
        className="w-full max-w-lg bg-[#0e121d] border border-white/15 rounded-2xl p-6 shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white text-xl"
        >
          ×
        </button>
        
        <div className="w-12 h-12 bg-red-500/15 rounded-xl flex items-center justify-center text-red-400 text-xl mb-4">
          <FiX />
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          Từ Chối Tuyển Dụng
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          Nhập lý do cụ thể gửi về email/dashboard cho doanh nghiệp để họ có thể sửa đổi tin.
        </p>

        <textarea
          rows={4}
          value={customRejectReason}
          onChange={e => setCustomRejectReason(e.target.value)}
          className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:bg-white/8 transition-all resize-none mb-6"
          placeholder="Nhập lý do từ chối..."
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold text-sm rounded-xl transition-all cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={actionLoading}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            {actionLoading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              "Xác Nhận Từ Chối"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
