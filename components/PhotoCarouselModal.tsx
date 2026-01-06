
import React, { useState, useEffect } from 'react';

interface PhotoCarouselModalProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
  wineName: string;
}

const PhotoCarouselModal: React.FC<PhotoCarouselModalProps> = ({ images, initialIndex = 0, onClose, wineName }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [currentIndex]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-stone-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center text-white z-10">
        <div className="flex flex-col">
          <h3 className="text-xl font-bold serif line-clamp-1">{wineName}</h3>
          <div className="flex items-center gap-3">
            <p className="text-stone-400 text-xs uppercase tracking-widest">Photo {currentIndex + 1} of {images.length}</p>
            <div className="hidden sm:flex items-center gap-1 opacity-40">
              <span className="px-1.5 py-0.5 border border-white/30 rounded text-[9px] font-mono">ESC</span>
              <span className="text-[9px] uppercase tracking-tighter">to close</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-3 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close Gallery"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main Image & Navigation */}
      <div className="relative w-full max-w-4xl h-full flex items-center justify-center group">
        <img 
          src={images[currentIndex]} 
          alt={`${wineName} label ${currentIndex + 1}`}
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300 select-none"
        />

        {images.length > 1 && (
          <>
            {/* Left Nav */}
            <div className="absolute left-0 sm:-left-20 flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                onClick={prevImage}
                className="p-4 text-white hover:text-stone-300 transition-all focus:outline-none"
                aria-label="Previous Image"
              >
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="hidden sm:flex flex-col items-center gap-1">
                <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-stone-400 font-mono">←</kbd>
              </div>
            </div>

            {/* Right Nav */}
            <div className="absolute right-0 sm:-right-20 flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                onClick={nextImage}
                className="p-4 text-white hover:text-stone-300 transition-all focus:outline-none"
                aria-label="Next Image"
              >
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="hidden sm:flex flex-col items-center gap-1">
                <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-stone-400 font-mono">→</kbd>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Thumbnails Tray */}
      {images.length > 1 && (
        <div className="absolute bottom-8 flex flex-col items-center gap-4 w-full">
          <div className="flex gap-2 max-w-full overflow-x-auto px-4 py-2 no-scrollbar scroll-smooth">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-16 h-16 rounded-md overflow-hidden border-2 transition-all flex-shrink-0 group/thumb ${
                  idx === currentIndex ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <img src={img} className="w-full h-full object-cover" alt={`thumbnail ${idx + 1}`} />
                {idx === currentIndex && (
                   <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-stone-500 uppercase tracking-[0.2em] font-bold sm:hidden">Swipe or tap to navigate</p>
        </div>
      )}
    </div>
  );
};

export default PhotoCarouselModal;
