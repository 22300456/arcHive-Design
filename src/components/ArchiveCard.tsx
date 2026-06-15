import React from 'react';
import { motion } from 'motion/react';
import { Calendar, User, ArrowRight, FileText } from 'lucide-react';
import { ArchiveItem } from '../types';

interface ArchiveCardProps {
  key?: string;
  item: ArchiveItem;
  onClick: () => void;
}

const isPdfFile = (url: string) => {
  return url?.startsWith('data:application/pdf') || url?.endsWith('.pdf') || url?.includes('.pdf?');
};

export default function ArchiveCard({ item, onClick }: ArchiveCardProps) {
  const isPdf = isPdfFile(item.imageUrl);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className="group relative flex flex-col gap-3 rounded-xl overflow-hidden bg-transparent cursor-pointer transition-all duration-300"
    >
      {/* Sleek aspect container with deep gradient cover */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
        {!item.imageUrl ? (
          <div className="h-full w-full bg-zinc-50 dark:bg-zinc-950/40 flex flex-col items-center justify-center p-6 text-center select-none">
            <div className="p-2.5 bg-zinc-200/40 dark:bg-zinc-900 rounded-lg text-zinc-400 dark:text-zinc-600 mb-2">
              <FileText className="h-5 w-5" />
            </div>
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-bold">
              기록 사진 외부 배제됨
            </span>
          </div>
        ) : isPdf ? (
          <div className="h-full w-full bg-zinc-950 dark:bg-zinc-900 flex flex-col items-center justify-center p-6 text-center select-none transition-transform duration-750 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-102">
            <div className="p-3 bg-zinc-900 dark:bg-zinc-805 rounded-xl border border-zinc-800/80 dark:border-zinc-800 mb-3 group-hover:bg-zinc-850 dark:group-hover:bg-zinc-800 transition-colors">
              <FileText className="h-8 w-8 text-zinc-300 dark:text-zinc-200" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
              PDF Document
            </span>
            <span className="text-[12px] text-zinc-500 hover:text-zinc-400 mt-1.5 font-sans px-4 truncate max-w-full">
              {item.title}
            </span>
          </div>
        ) : (
          <img
            src={item.imageUrl}
            alt={item.title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
          />
        )}
        
        {/* Brand/Category Tag — Classic Sleek Solid Badge */}
        <span className="absolute top-3.5 left-3.5 bg-zinc-950/75 backdrop-blur-xs px-2.5 py-1 rounded font-mono text-[9px] uppercase tracking-widest font-bold text-white border border-white/10 shadow-sm select-none">
          {item.category}
        </span>

        {/* Lower Tags superimposed cleanly inside the image container */}
        <div className="absolute bottom-3.5 left-3.5 flex flex-wrap gap-1.5 max-w-[80%]">
          {item.tags.slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded bg-zinc-950/75 text-white border border-white/10 font-mono text-[8.5px] tracking-wider backdrop-blur-3xs"
            >
              #{tag}
            </span>
          ))}
          {item.tags.length > 2 && (
            <span className="text-[8.5px] font-mono text-zinc-300 pl-1">
              +{item.tags.length - 2}
            </span>
          )}
        </div>

        {/* Superimposed neat arrow on hover in corner */}
        <div className="absolute bottom-3.5 right-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 backdrop-blur-md border border-white/10 text-white opacity-0 transform translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Meta/Text descriptions */}
      <div className="px-1 py-1 flex flex-col">
        {/* Sleek Header & location / author */}
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-650 dark:group-hover:text-white transition-colors duration-200 line-clamp-1">
          {item.title}
        </h3>

        {/* Sleek Sub descriptor info resembling Berlin 1974 • Archive Vol 2 */}
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-mono tracking-tight flex items-center gap-1.5">
          <span>{item.date}</span>
          {item.author && (
            <>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="truncate max-w-[120px]">{item.author}</span>
            </>
          )}
          {item.location && (
            <>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="truncate max-w-[120px]">{item.location}</span>
            </>
          )}
        </p>
      </div>
    </motion.article>
  );
}
