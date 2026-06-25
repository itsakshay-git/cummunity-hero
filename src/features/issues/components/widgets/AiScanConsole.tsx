import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

interface AiScanConsoleProps {
  imageUrl: string;
  scanning: boolean;
  aiResult: any;
  onTriggerScan: () => void;
}

export const AiScanConsole: React.FC<AiScanConsoleProps> = ({
  imageUrl,
  scanning,
  aiResult,
  onTriggerScan
}) => {
  if (!imageUrl) return null;

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
          <span className="text-xs font-bold text-slate-800">Gemini AI Command Scan Module</span>
        </div>
        {!aiResult && !scanning && (
          <button
            id="btn-trigger-ai-scan"
            type="button"
            onClick={onTriggerScan}
            className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Run Gemini Diagnosis</span>
          </button>
        )}
      </div>

      {scanning && (
        <div className="flex items-center space-x-3 text-sm text-slate-600 font-medium py-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Gemini is analyzing issue image and text details...</span>
        </div>
      )}

      {aiResult && (
        <div className="space-y-3 pt-2 text-xs border-t border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
            <div className="bg-white p-2 rounded border border-slate-150">
              <span className="block text-slate-400 font-mono uppercase">Detected Cat</span>
              <span className="font-bold text-slate-900">{aiResult.category}</span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-150">
              <span className="block text-slate-400 font-mono uppercase">Severity Rank</span>
              <span className="font-bold text-amber-700">{aiResult.severity}</span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-150">
              <span className="block text-slate-400 font-mono uppercase">Priority Score</span>
              <span className="font-bold text-red-600">{aiResult.priorityScore} / 100</span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-150">
              <span className="block text-slate-400 font-mono uppercase">Confidence</span>
              <span className="font-bold text-emerald-600">{(aiResult.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div className="bg-emerald-50/50 p-2.5 rounded border border-emerald-100 text-[11px] text-emerald-950">
            <span className="block font-bold text-emerald-900 mb-0.5">Gemini Civic Abstract:</span>
            <span>{aiResult.summary}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiScanConsole;
