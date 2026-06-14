import React from 'react';
import { Search, Plus, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { CATEGORIES } from '../data';
import { SortOption } from '../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedSort: SortOption;
  setSelectedSort: (sort: SortOption) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onAddClick: () => void;
  totalCount: number;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedSort,
  setSelectedSort,
  darkMode,
  toggleDarkMode,
  onAddClick,
  totalCount,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/70 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/70 transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-center">
          
          {/* Slick Logo & Index Count */}
          <div className="flex items-center justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-lg font-bold tracking-wider text-zinc-400 dark:text-zinc-500 font-display select-none">
                  ARC<span className="text-zinc-950 dark:text-zinc-50 font-black text-2xl tracking-normal">H</span>IVE
                </span>
              </div>
            </div>

            {/* Mobile triggers always elegant */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={onAddClick}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 cursor-pointer"
                aria-label="Add new item"
              >
                <Plus className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Elegant Search Bar (center) */}
          <div className="flex justify-center w-full">
            <div className="relative w-full max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                <Search className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search archives, collections, artifacts..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-full py-2 pl-10 pr-9 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:ring-zinc-600 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-3.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Action Tools (Desktop mode) using pill button configuration */}
          <div className="hidden md:flex justify-end items-center gap-2.5">
            <button
              onClick={onAddClick}
              className="px-5 py-2 bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              Curate Item
            </button>
          </div>
        </div>

        {/* Collections Tab Bar Area matching exact border-b-2 hover transitions */}
        <div className="mt-7 flex flex-col gap-4 border-t border-zinc-200/50 pt-4.5 dark:border-zinc-800/60 sm:flex-row sm:items-center sm:justify-between">
          
          {/* Sliding category selections */}
          <div className="flex flex-wrap items-center gap-6 overflow-x-auto py-1.5 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-sm font-semibold transition-all duration-200 relative pb-1.5 cursor-pointer ${
                    active
                      ? 'text-zinc-950 dark:text-white'
                      : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
                  }`}
                >
                  {cat === 'All' ? 'All Collections' : cat}
                  {active && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 dark:bg-white fade-in" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Sorter Selector */}
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Display Order:</span>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as SortOption)}
              className="border-0 bg-transparent py-0.5 pr-8 text-xs font-semibold text-zinc-700 outline-none focus:ring-0 dark:text-zinc-300 cursor-pointer"
            >
              <option value="newest" className="dark:bg-zinc-950">Newest First</option>
              <option value="oldest" className="dark:bg-zinc-950">Oldest First</option>
              <option value="alphabetical" className="dark:bg-zinc-950">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
