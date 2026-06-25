import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface NotFoundPageProps {
  onBackToFeed: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onBackToFeed }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-12 font-sans select-none animate-fade-in">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="p-5 bg-rose-50 border border-rose-200 text-rose-600 rounded-3xl mb-6 shadow-sm flex items-center justify-center"
      >
        <ShieldAlert className="w-12 h-12 animate-pulse" />
      </motion.div>

      <motion.h1 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-3"
      >
        Civic Path Not Found
      </motion.h1>

      <motion.p 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-sm text-slate-500 max-w-md mx-auto mb-8 leading-relaxed"
      >
        The page, incident record, or community workspace path you are trying to visit does not exist or has been archived.
      </motion.p>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <button
          onClick={onBackToFeed}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl text-xs hover:bg-slate-800 transition-colors shadow-md hover:shadow cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard Hub</span>
        </button>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
