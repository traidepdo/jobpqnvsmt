// app/blogs/[slug]/_components/HtmlViewer.tsx
'use client'

import React, { useRef } from 'react';

interface TocItem {
    id: string;
    text: string;
}

export default function HtmlViewer({ content, toc }: { content: string; toc: TocItem[] }) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const handleScrollToHeading = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        const iframe = iframeRef.current;
        if (!iframe) return;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;
        
        const target = iframeDoc.getElementById(id);
        if (target) {
            // Apply smooth scroll style dynamically inside iframe if not already set
            const htmlEl = iframeDoc.documentElement;
            if (htmlEl) {
                htmlEl.style.scrollBehavior = 'smooth';
                htmlEl.style.scrollPaddingTop = '20px';
            }
            target.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Inject <base target="_top"> to force all links inside the iframe to navigate the top-level window.
    let processedContent = content;
    if (content && !content.includes('<base target=')) {
        if (/HTML/i.test(content)) {
            if (/<head[^>]*>/i.test(content)) {
                processedContent = content.replace(/(<head[^>]*>)/i, '$1<base target="_top">');
            } else if (/<html[^>]*>/i.test(content)) {
                processedContent = content.replace(/(<html[^>]*>)/i, '$1<head><base target="_top"></head>');
            } else {
                processedContent = `<base target="_top">${content}`;
            }
        } else {
            processedContent = `<base target="_top">${content}`;
        }
    }

    return (
        <div className="fixed inset-0 w-full h-full my-15 bg-white flex">
            {/* Cột trái: Iframe hiển thị Landing Page */}
            <div className="flex-1 h-full">
                <iframe
                    ref={iframeRef}
                    srcDoc={processedContent}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation allow-top-navigation-by-user-activation"
                    title="Landing Page"
                />
            </div>

            {/* Cột phải: Mục lục bài viết (Sticky/Sidebar) */}
            {toc && toc.length > 0 && (
                <div className="w-80 h-full border-l border-gray-150 bg-gray-50/60 backdrop-blur-md p-6 overflow-y-auto hidden md:block">
                    <div className="mb-6">
                        <p className="font-extrabold text-[#041b3c] flex items-center gap-2 text-xs uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[20px] text-[#00b14f]">toc</span>
                            Mục lục bài viết
                        </p>
                        <div className="w-8 h-0.5 bg-[#00b14f] rounded-full mt-2" />
                    </div>
                    <ul className="space-y-3.5">
                        {toc.map((item) => (
                            <li key={item.id} className="group">
                                <button
                                    onClick={(e) => handleScrollToHeading(item.id, e)}
                                    className="w-full text-left text-xs font-semibold text-gray-600 hover:text-[#00b14f] transition-all duration-200 flex items-start gap-2.5 leading-relaxed cursor-pointer group-hover:translate-x-1"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-[#00b14f] group-hover:scale-125 transition-all duration-200 mt-1.5 flex-shrink-0" />
                                    <span className="flex-1">{item.text}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}