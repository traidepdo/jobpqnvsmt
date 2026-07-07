'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface ApplicationActionMenuProps {
  applicationId: string;
  jobSlug: string;
  companyName: string;
}

export default function ApplicationActionMenu({ applicationId, jobSlug, companyName }: ApplicationActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWithdraw = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn rút đơn ứng tuyển này?')) {
      try {
        const res = await fetch(`/api/candidate/applications/${applicationId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          alert('Đã rút đơn ứng tuyển thành công.');
          window.location.reload();
        } else {
          alert('Không thể rút đơn ứng tuyển lúc này.');
        }
      } catch (err) {
        console.error(err);
        alert('Lỗi hệ thống khi rút đơn.');
      }
    }
  };

  return (
    <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
        aria-label="Thao tác nhanh"
      >
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 z-40 animate-fadeIn">
          <Link
            href={`/jobs/${jobSlug}`}
            className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#00b14f] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            Xem chi tiết công việc
          </Link>
          <Link
            href="/candidate/messages"
            className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#00b14f] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            Nhắn tin nhà tuyển dụng
          </Link>
          <div className="h-px bg-slate-100 my-1" />
          <button
            onClick={handleWithdraw}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">cancel</span>
            Rút đơn ứng tuyển
          </button>
        </div>
      )}
    </div>
  );
}
