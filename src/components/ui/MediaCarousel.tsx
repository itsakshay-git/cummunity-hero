import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface MediaCarouselProps {
  attachments?: { type: 'image' | 'video'; url: string }[];
  fallbackUrl?: string;
  aspectRatioClassName?: string;
}

export default function MediaCarousel({
  attachments = [],
  fallbackUrl,
  aspectRatioClassName = 'aspect-video'
}: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playingVideo, setPlayingVideo] = useState(false);

  // If there are no attachments, show the fallback image
  if (attachments.length === 0) {
    if (!fallbackUrl) return null;
    return (
      <div className={`w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 ${aspectRatioClassName} transition-colors`}>
        <img
          src={fallbackUrl}
          alt="Civic post visual"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlayingVideo(false);
    setCurrentIndex((prev) => (prev === 0 ? attachments.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlayingVideo(false);
    setCurrentIndex((prev) => (prev === attachments.length - 1 ? 0 : prev + 1));
  };

  const currentMedia = attachments[currentIndex];

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-slate-900/5 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/60 group">
      {/* Media Display Panel */}
      <div className={`relative w-full ${aspectRatioClassName} flex items-center justify-center overflow-hidden`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            {currentMedia.type === 'video' ? (
              <div className="relative w-full h-full bg-black flex items-center justify-center">
                {playingVideo ? (
                  <video
                    src={currentMedia.url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center cursor-pointer" onClick={(e) => { e.stopPropagation(); setPlayingVideo(true); }}>
                    <img
                      src={`https://images.unsplash.com/photo-1516216628859-9bccecab13ca?w=600&auto=format&fit=crop&q=60`} // placeholder thumbnail
                      alt="Video thumbnail"
                      className="w-full h-full object-cover opacity-60 filter blur-[1px]"
                    />
                    <div className="absolute p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-transform transform hover:scale-105 shadow-lg flex items-center justify-center">
                      <Play className="w-6 h-6 fill-current text-white" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <img
                src={currentMedia.url}
                alt={`Media visual ${currentIndex + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      {attachments.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/70 hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer shadow-sm border-0"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/70 hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer shadow-sm border-0"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Indicators and Counter */}
      {attachments.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-950/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
          {attachments.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); setPlayingVideo(false); }}
              className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer border-0 p-0 ${
                idx === currentIndex ? 'bg-white w-3' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Item Counter Chip */}
      {attachments.length > 1 && (
        <span className="absolute top-3 right-3 text-[9px] font-bold text-white bg-slate-950/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
          {currentIndex + 1} / {attachments.length}
        </span>
      )}
    </div>
  );
}
