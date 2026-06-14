import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArchiveX, RefreshCw } from 'lucide-react';
import { ArchiveItem } from '../types';
import ArchiveCard from './ArchiveCard';

interface ArchiveGridProps {
  items: ArchiveItem[];
  onCardClick: (item: ArchiveItem) => void;
  onResetFilters?: () => void;
  hasFilters: boolean;
}

export default function ArchiveGrid({ items, onCardClick, onResetFilters, hasFilters }: ArchiveGridProps) {
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600 mb-4 shadow-inner">
          <ArchiveX className="h-8 w-8" />
        </div>
        <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-100">
          검색 기록을 찾을 수 없습니다
        </h3>
        <p className="mt-1.5 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          다른 검색어를 입력하시거나 활성화된 카테고리 필터를 변경하여 원하는 보관 기록을 탐색해 보세요.
        </p>
        
        {hasFilters && onResetFilters && (
          <button
            onClick={onResetFilters}
            className="mt-6 flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            <span>필터 및 검색 초기화</span>
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Grid container */}
      <motion.div 
        layout 
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <ArchiveCard
              key={item.id}
              item={item}
              onClick={() => onCardClick(item)}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
