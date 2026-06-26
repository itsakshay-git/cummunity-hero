import React, { useState } from 'react';
import { Upload, X, Play, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  attachments: { type: 'image' | 'video'; url: string }[];
  onAddAttachment: (type: 'image' | 'video', url: string) => void;
  onRemoveAttachment: (index: number) => void;
  dragActive: boolean;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  dragActive,
  onDrag,
  onDrop,
  onFileChange
}) => {
  const [urlInput, setUrlInput] = useState('');

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const isVideo = urlInput.match(/\.(mp4|webm|ogg|mov)$/i) || urlInput.includes('youtube.com') || urlInput.includes('youtu.be') || urlInput.includes('vimeo.com');
    onAddAttachment(isVideo ? 'video' : 'image', urlInput.trim());
    setUrlInput('');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider">
          Incident Media ({attachments.length} / 5)
        </label>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Max 5 images/videos</span>
      </div>

      {/* Thumbnails Grid */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {attachments.map((media, idx) => (
            <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shadow-sm flex items-center justify-center transition-all duration-300 hover:shadow-md">
              {media.type === 'video' ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
                  <video src={media.url} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-300" muted />
                  <Play className="w-4 h-4 text-white absolute group-hover:scale-110 transition-all duration-300" />
                </div>
              ) : (
                <img src={media.url} alt="thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
              )}
              
              {/* Hover Darken Overlay */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center" />

              <button
                type="button"
                onClick={() => onRemoveAttachment(idx)}
                className="absolute top-1.5 right-1.5 p-1 bg-red-600 hover:bg-red-750 text-white rounded-full transition-all duration-300 shadow border-0 cursor-pointer opacity-0 group-hover:opacity-100 flex items-center justify-center hover:scale-110"
                title="Remove Media"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Box (Only show if less than 5 attachments) */}
      {attachments.length < 5 ? (
        <div className="space-y-3">
          <div 
            onDragEnter={onDrag}
            onDragOver={onDrag}
            onDragLeave={onDrag}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group ${
              dragActive 
                ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10" 
                : "border-slate-300 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500/80 hover:bg-slate-50/30 dark:hover:bg-slate-900/10"
            }`}
          >
            <input
              id="report-input-file"
              type="file"
              accept="image/*,video/*"
              onChange={onFileChange}
              className="hidden"
            />
            <label htmlFor="report-input-file" className="w-full h-full cursor-pointer flex flex-col items-center select-none">
              <div className="p-3 bg-slate-100 dark:bg-slate-850/60 text-slate-400 dark:text-slate-500 rounded-xl mb-2.5 group-hover:scale-115 group-hover:text-emerald-600 dark:group-hover:text-emerald-450 transition-all">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-205 block">Drag & drop photo or video</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                or <span className="text-emerald-600 dark:text-emerald-450 underline font-bold group-hover:text-emerald-700">browse files</span>
              </span>
            </label>
          </div>

          {/* Paste URL Input */}
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
              <input 
                type="text" 
                placeholder="Or paste direct image/video URL..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleUrlSubmit(e);
                  }
                }}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400 dark:placeholder:text-slate-655"
              />
            </div>
            <button
              type="button"
              onClick={handleUrlSubmit}
              className="px-4 bg-slate-100 dark:bg-slate-850 hover:bg-slate-205 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border-0 cursor-pointer transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
          Media limit reached. Delete existing attachments to add more.
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
