import React from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploaderProps {
  imageUrl: string;
  dragActive: boolean;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
  onChangeImageUrl: (url: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageUrl,
  dragActive,
  onDrag,
  onDrop,
  onFileChange,
  onRemovePhoto,
  onChangeImageUrl
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Incident Image / Photo</label>
      
      {!imageUrl ? (
        <div 
          onDragEnter={onDrag}
          onDragOver={onDrag}
          onDragLeave={onDrag}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-4 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
            dragActive 
              ? "border-emerald-500 bg-emerald-50/30" 
              : "border-slate-300 hover:border-emerald-500 hover:bg-slate-50/50"
          }`}
        >
          <input
            id="report-input-file"
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />
          <label htmlFor="report-input-file" className="w-full h-full cursor-pointer flex flex-col items-center">
            <Upload className="w-6 h-6 text-slate-400 mb-2" />
            <span className="text-xs font-bold text-slate-800 block">Drag & drop photo here</span>
            <span className="text-[10px] text-slate-500 block mt-1">or <span className="text-emerald-600 underline font-semibold">browse files</span></span>
          </label>
        </div>
      ) : (
        <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 flex items-center space-x-3">
          <img 
            src={imageUrl} 
            alt="Uploaded incident" 
            className="w-16 h-16 object-cover rounded-lg border border-slate-100 flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-slate-800 block truncate">Photo Selected</span>
            <span className="text-[10px] text-slate-500 block truncate font-mono">
              {imageUrl.startsWith('data:') ? 'Local file uploaded (base64)' : imageUrl}
            </span>
          </div>
          <button
            id="btn-remove-photo"
            type="button"
            onClick={onRemovePhoto}
            className="w-8 h-8 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 rounded-lg flex items-center justify-center transition-all cursor-pointer"
            title="Remove Photo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* URL input option for advanced links / fast-tracking */}
      <div className="pt-1">
        <input 
          id="report-input-image-fallback"
          type="text" 
          placeholder="Or paste direct image URL (e.g. http://...)"
          value={imageUrl.startsWith('data:') ? '' : imageUrl}
          onChange={(e) => onChangeImageUrl(e.target.value)}
          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 text-[11px] rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
        />
      </div>
    </div>
  );
};

export default ImageUploader;
