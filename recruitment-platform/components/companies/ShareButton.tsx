'use client';

import React, { useState } from 'react';

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: url,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="p-2.5 rounded-lg border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-all cursor-pointer relative"
      aria-label="Share company page"
      title="Chia sẻ trang này"
    >
      <span className="material-symbols-outlined text-[20px]">
        {copied ? 'check' : 'share'}
      </span>
      {copied && (
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2.5 py-1 rounded shadow-md whitespace-nowrap z-50">
          Đã sao chép link!
        </span>
      )}
    </button>
  );
}
