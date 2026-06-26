import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Server, Cpu, ShieldCheck } from 'lucide-react';

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
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  
  // Simulated diagnostic logging stream during scanning
  useEffect(() => {
    if (!scanning) {
      setScanLogs([]);
      return;
    }
    
    const logs = [
      'Initializing Gemini API endpoint connection...',
      'Deconstructing media payloads & checking integrity...',
      'Running computer vision filters on incident images...',
      'Detecting structural anomalies & environmental patterns...',
      'Calculating localized civic priority values...',
      'Routing recommendations to corresponding municipalities...'
    ];
    
    setScanLogs([logs[0]]);
    
    const timers = logs.slice(1).map((log, idx) => {
      return setTimeout(() => {
        setScanLogs(prev => [...prev, log]);
      }, (idx + 1) * 800);
    });
    
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [scanning]);

  if (!imageUrl) return null;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 rounded-lg">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Gemini AI Incident Scan Module</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Neural diagnostics, priority index scoring, and department assignment routing</span>
          </div>
        </div>
        {!aiResult && !scanning && (
          <button
            id="btn-trigger-ai-scan"
            type="button"
            onClick={onTriggerScan}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer border-0 shadow-sm self-start sm:self-auto hover:-translate-y-0.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Run Gemini Diagnosis</span>
          </button>
        )}
      </div>

      {scanning && (
        <div className="space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-900 font-mono text-[10px] text-emerald-400 relative overflow-hidden select-none">
          {/* Scan Line effect */}
          <div className="absolute inset-x-0 h-0.5 bg-emerald-500/30 shadow-[0_0_10px_#10B981] animate-scan-line z-10" />
          
          <div className="flex items-center space-x-2 text-emerald-500 font-bold border-b border-slate-800 pb-2">
            <Cpu className="w-4 h-4 animate-spin text-emerald-500" />
            <span>SYSTEM SCAN IN PROGRESS...</span>
          </div>
          
          <div className="space-y-1.5 min-h-[90px] max-h-[120px] overflow-y-auto">
            {scanLogs.map((log, idx) => (
              <div key={idx} className="flex items-center space-x-2 animate-fade-in">
                <span className="text-emerald-600">&gt;</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {aiResult && (
        <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-850 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
              <span className="block text-slate-400 dark:text-slate-500 font-mono text-[9px] uppercase tracking-wider">Detected Category</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs block mt-0.5">{aiResult.category}</span>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
              <span className="block text-slate-400 dark:text-slate-500 font-mono text-[9px] uppercase tracking-wider">Severity Rank</span>
              <span className={`font-extrabold text-xs block mt-0.5 ${
                aiResult.severity === 'Critical' ? 'text-rose-600 dark:text-rose-400' :
                aiResult.severity === 'High' ? 'text-amber-500 dark:text-amber-400' :
                aiResult.severity === 'Medium' ? 'text-emerald-600 dark:text-emerald-450' : 'text-blue-500'
              }`}>{aiResult.severity}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
              <span className="block text-slate-400 dark:text-slate-500 font-mono text-[9px] uppercase tracking-wider">Priority Score</span>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">{aiResult.priorityScore} <span className="text-[10px] text-slate-400 font-normal">/100</span></span>
                <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      aiResult.priorityScore > 80 ? 'bg-red-500' :
                      aiResult.priorityScore > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} 
                    style={{ width: `${aiResult.priorityScore}%` }} 
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
              <span className="block text-slate-400 dark:text-slate-500 font-mono text-[9px] uppercase tracking-wider">Neural Confidence</span>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">{(aiResult.confidence * 100).toFixed(0)}%</span>
                <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${aiResult.confidence * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30 text-[11px] text-slate-700 dark:text-slate-300 md:col-span-2">
              <span className="block font-bold text-emerald-900 dark:text-emerald-400 mb-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Gemini Civic Abstract
              </span>
              <p className="leading-relaxed">{aiResult.summary}</p>
            </div>
            
            <div className="bg-slate-100/55 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 flex flex-col justify-center">
              <span className="block text-slate-400 dark:text-slate-500 font-mono text-[8px] uppercase tracking-wider mb-1">Recommended Agency</span>
              <span className="font-bold text-slate-850 dark:text-slate-200 flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-indigo-500" />
                {aiResult.suggestedDepartment || 'Civic Works Department'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiScanConsole;
