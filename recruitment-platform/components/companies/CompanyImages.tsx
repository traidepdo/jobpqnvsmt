'use client';

import React, { useState, useRef } from 'react';

interface CompanyImagesProps {
  images: string[];
  companyName: string;
}

export default function CompanyImages({ images, companyName }: CompanyImagesProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  if (!images || images.length === 0) return null;

  const handlePrev = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const showPrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
    }
  };

  const showNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % images.length);
    }
  };

  return (
    <section id="photos" className="pt-10 border-t border-slate-100 animate-fadeIn" aria-labelledby="company-photos-heading">
      <h2 id="company-photos-heading" className="text-lg font-bold text-slate-850 border-l-4 border-[#00b14f] pl-3 mb-6">
        Hình ảnh hoạt động
      </h2>

      <div className="relative group/carousel">
        {/* Navigation Buttons */}
        {images.length > 3 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md border border-slate-150 flex items-center justify-center text-slate-700 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 cursor-pointer"
              aria-label="Previous image"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md border border-slate-150 flex items-center justify-center text-slate-700 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 cursor-pointer"
              aria-label="Next image"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </>
        )}

        {/* Carousel Container */}
        <div
          ref={carouselRef}
          className="flex gap-4 overflow-x-auto snap-x scrollbar-none pb-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {images.map((img, idx) => (
            <div
              key={idx}
              onClick={() => openLightbox(idx)}
              className="min-w-[280px] sm:min-w-[320px] md:min-w-[360px] aspect-video rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group relative shadow-sm snap-start cursor-zoom-in"
            >
              <img
                src={img}
                alt={`${companyName} photo ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 w-11 h-11 flex items-center justify-center bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Close lightbox"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={showPrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                aria-label="Previous photo"
              >
                <span className="material-symbols-outlined text-[28px]">arrow_back_ios_new</span>
              </button>
              <button
                onClick={showNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                aria-label="Next photo"
              >
                <span className="material-symbols-outlined text-[28px]">arrow_forward_ios</span>
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-[80vh] flex flex-col items-center">
            <img
              src={images[lightboxIndex]}
              alt={`${companyName} full photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-[75vh] object-contain rounded-lg select-none"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-white/60 text-xs mt-4">
              Hình ảnh {lightboxIndex + 1} / {images.length}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
