
import React, { useState } from 'react';
import { WineEntry, WineType } from '../types';
import PhotoCarouselModal from './PhotoCarouselModal';

interface WineCardProps {
  wine: WineEntry;
  onEdit: (wine: WineEntry) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
}

const WineCard: React.FC<WineCardProps> = ({ 
  wine, 
  onEdit, 
  onDelete, 
  onRestore, 
  onPermanentDelete 
}) => {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const isDeleted = !!wine.deletedAt;

  const getTypeColor = (type: WineType) => {
    switch (type) {
      case WineType.RED: return 'bg-red-100 text-red-800 border-red-200';
      case WineType.WHITE: return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case WineType.CHAMPAGNE: return 'bg-amber-100 text-amber-800 border-amber-200';
      case WineType.ROSE: return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const mainImage = wine.imageUrls?.[0];

  return (
    <>
      <div className={`bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md transition-all group flex flex-col h-full ${isDeleted ? 'opacity-75 grayscale-[0.5]' : ''}`}>
        <div className="relative h-56 overflow-hidden cursor-pointer bg-stone-100" onClick={() => setIsGalleryOpen(true)}>
          {mainImage ? (
            <img 
              src={mainImage} 
              alt={wine.name} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-stone-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[10px] uppercase font-bold tracking-widest">No Image</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>

          {/* Wine Type Badge */}
          <div className={`absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shadow-sm ${getTypeColor(wine.type)}`}>
            {wine.type}
          </div>

          {/* Deleted Label */}
          {isDeleted && (
            <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-widest shadow-lg">
              Deleted
            </div>
          )}

          {/* Photo Count Badge */}
          {!isDeleted && wine.imageUrls.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-stone-900/75 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-md border border-white/10 font-bold flex items-center gap-1.5 shadow-lg group-hover:bg-stone-900 transition-colors">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{wine.imageUrls.length} Photos</span>
            </div>
          )}

          {/* View Gallery Overlay */}
          {!isDeleted && wine.imageUrls.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="bg-white/90 text-stone-900 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                View Gallery
              </div>
            </div>
          )}
        </div>
        
        <div className="p-5 flex flex-col flex-grow">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="text-xl font-bold text-stone-900 leading-tight serif line-clamp-2">{wine.name}</h3>
          </div>
          <p className="text-sm text-stone-600 font-medium mb-3">{wine.maker} {wine.year && `· ${wine.year}`}</p>
          
          <p className="text-xs text-stone-500 line-clamp-3 italic mb-4 flex-grow leading-relaxed">
            {wine.description || "No description provided."}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <div className="flex flex-col">
              <span className="text-stone-400 text-[10px] uppercase font-bold tracking-widest">Est. Value</span>
              <span className="text-stone-900 font-bold text-base">
                {wine.price ? `$${wine.price}` : '---'}
              </span>
            </div>
            <div className="flex gap-1.5">
              {isDeleted ? (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onRestore?.(wine.id); }}
                    className="p-2 text-stone-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                    title="Restore to Cellar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onPermanentDelete?.(wine.id); }}
                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete Permanently"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(wine); }}
                    className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-all"
                    title="Edit Details"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(wine.id); }}
                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete Entry"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {isGalleryOpen && wine.imageUrls.length > 0 && (
        <PhotoCarouselModal 
          images={wine.imageUrls}
          onClose={() => setIsGalleryOpen(false)}
          wineName={wine.name}
        />
      )}
    </>
  );
};

export default WineCard;
