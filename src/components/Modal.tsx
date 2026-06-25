import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'alert' | 'confirm' | 'error' | 'success';
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export default function CustomModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'alert',
  confirmText = 'OK',
  cancelText = 'Cancel',
  danger = false
}: CustomModalProps) {
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-emerald-600" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'confirm':
        return danger 
          ? <AlertTriangle className="w-6 h-6 text-rose-600 animate-pulse" /> 
          : <Info className="w-6 h-6 text-indigo-600" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
    }
  };

  const getHeaderBg = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50';
      case 'error':
        return 'bg-red-50';
      case 'confirm':
        return danger ? 'bg-rose-50' : 'bg-indigo-50';
      default:
        return 'bg-amber-50';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
          {/* Backdrop with soft blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative bg-white w-full max-w-md rounded-2xl overflow-hidden border border-slate-100 shadow-xl z-10"
          >
            {/* Header section */}
            <div className={`p-4 flex items-center justify-between border-b border-slate-100 ${getHeaderBg()}`}>
              <div className="flex items-center space-x-3">
                {getIcon()}
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body text */}
            <div className="p-6">
              <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              {type === 'confirm' ? (
                <>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={() => {
                      if (onConfirm) onConfirm();
                      onClose();
                    }}
                    className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      danger 
                        ? 'bg-rose-600 hover:bg-rose-500' 
                        : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    {confirmText}
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                >
                  {confirmText}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
