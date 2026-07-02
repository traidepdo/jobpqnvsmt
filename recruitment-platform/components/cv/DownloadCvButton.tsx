'use client';

import { useState } from 'react';

interface DownloadCvButtonProps {
  fileName?: string;
}

export default function DownloadCvButton({ fileName = 'CV' }: DownloadCvButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // Dynamic import để tránh lỗi SSR
      const html2pdf = (await import('html2pdf.js')).default;

      const element = document.querySelector('.cv-viewer-container > div');
      if (!element) {
        alert('Không tìm thấy nội dung CV để tải.');
        setLoading(false);
        return;
      }

      const opt = {
        margin: [10, 12, 10, 12] as [number, number, number, number],
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
      };

      // Tạo một style tag tạm thời chứa toàn bộ CSS đã được dọn sạch oklch/oklab
      const tempStyle = document.createElement('style');
      tempStyle.setAttribute('id', 'html2pdf-temp-clean-css');
      
      const originalSheets = Array.from(document.styleSheets);
      const disabledElements: (HTMLStyleElement | HTMLLinkElement)[] = [];
      let combinedCss = "";

      const cleanColorFn = (cssText: string) => {
        return cssText.replace(/(oklch|oklab)\([\s\S]*?\)/g, 'rgb(80, 80, 80)');
      };

      try {
        originalSheets.forEach((sheet) => {
          try {
            const ownerNode = sheet.ownerNode as HTMLStyleElement | HTMLLinkElement;
            if (!ownerNode) return;

            let sheetCss = "";
            for (let i = 0; i < sheet.cssRules.length; i++) {
              sheetCss += sheet.cssRules[i].cssText + "\n";
            }

            if (sheetCss.includes("oklch") || sheetCss.includes("oklab")) {
              const cleanCss = cleanColorFn(sheetCss);
              combinedCss += cleanCss + "\n";
              
              ownerNode.disabled = true;
              disabledElements.push(ownerNode);
            }
          } catch (e) {
            const ownerNode = sheet.ownerNode as HTMLStyleElement | HTMLLinkElement;
            if (ownerNode) {
              ownerNode.disabled = true;
              disabledElements.push(ownerNode);
            }
          }
        });

        if (combinedCss) {
          tempStyle.textContent = combinedCss;
          document.head.appendChild(tempStyle);
        }
      } catch (e) {
        console.warn("Could not patch stylesheets:", e);
      }

      // Clone element để clean inline styles có chứa oklch/oklab (bao gồm cả css variables inline)
      const cleanElement = element.cloneNode(true) as HTMLElement;
      const cleanInlineStyles = (el: HTMLElement) => {
        const styleAttr = el.getAttribute('style');
        if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab'))) {
          el.setAttribute('style', cleanColorFn(styleAttr));
        }
        Array.from(el.children).forEach((child) => {
          cleanInlineStyles(child as HTMLElement);
        });
      };
      cleanInlineStyles(cleanElement);

      await html2pdf().set(opt).from(cleanElement).save();

      // Khôi phục lại trạng thái ban đầu
      if (tempStyle.parentNode) {
        tempStyle.parentNode.removeChild(tempStyle);
      }
      disabledElements.forEach((el) => {
        el.disabled = false;
      });
    } catch (err) {
      console.error('Lỗi khi tải CV:', err);
      alert('Có lỗi xảy ra khi tải CV. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      id="download-cv-btn"
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 bg-[#00b14f] hover:bg-[#009940] disabled:bg-[#00b14f]/60 text-white font-bold px-5 py-3 rounded-full shadow-lg transition transform hover:scale-105 active:scale-95 disabled:scale-100 text-sm cursor-pointer border-none"
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Đang tải...
        </>
      ) : (
        <>
          <span className="material-symbols-outlined text-lg">download</span>
          Tải CV (PDF)
        </>
      )}
    </button>
  );
}
