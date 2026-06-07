'use client';

import React from 'react';
import { FaArrowUp, FaArrowDown, FaGripVertical } from 'react-icons/fa';

interface SectionItem {
  id: string;
  name: string;
}

interface SectionOrderManagerProps {
  sections: SectionItem[];
  onChange: (newSections: SectionItem[]) => void;
}

export default function SectionOrderManager({ sections, onChange }: SectionOrderManagerProps) {
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index - 1];
    newSections[index - 1] = temp;
    onChange(newSections);
  };

  const moveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index + 1];
    newSections[index + 1] = temp;
    onChange(newSections);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 font-medium leading-relaxed">
        Thứ tự hiển thị các phần trên bản in CV. Sử dụng các nút mũi tên để điều chỉnh vị trí hiển thị lên trên hoặc xuống dưới.
      </p>
      <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FaGripVertical className="text-gray-300 cursor-grab active:cursor-grabbing shrink-0" size={14} />
              <span className="text-sm font-semibold text-gray-700">
                {section.name}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="p-1.5 text-gray-400 hover:text-[#00b14f] hover:bg-gray-100 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent rounded-lg transition-all cursor-pointer"
                title="Di chuyển lên"
              >
                <FaArrowUp size={12} />
              </button>
              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={index === sections.length - 1}
                className="p-1.5 text-gray-400 hover:text-[#00b14f] hover:bg-gray-100 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent rounded-lg transition-all cursor-pointer"
                title="Di chuyển xuống"
              >
                <FaArrowDown size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
