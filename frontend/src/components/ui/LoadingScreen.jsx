import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingScreen({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-8">
      <motion.div 
        className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-tr from-primary-500 to-emerald-400 p-[2px] shadow-lg shadow-primary-500/30 flex items-center justify-center"
        animate={{ 
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{ 
          rotate: { duration: 2, repeat: Infinity, ease: "linear" },
          scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <div className="w-full h-full bg-white dark:bg-dark-900 rounded-[14px] flex items-center justify-center overflow-hidden bg-white">
          <img src="/logo.png" alt="School Logo" className="w-full h-full object-contain p-1" />
        </div>
      </motion.div>
      <h2 className="text-xl font-display font-bold text-slate-800 dark:text-white mb-2 tracking-wide">
        Sir Solomon's
      </h2>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
        {text}
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >...</motion.span>
      </p>
    </div>
  );
}
