import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ArchiveGrid from './components/ArchiveGrid';
import DetailModal from './components/DetailModal';
import AddCardModal from './components/AddCardModal';
import { ArchiveItem, SortOption } from './types';
import { INITIAL_ARCHIVE_ITEMS } from './data';
import { SlidersHorizontal, Trash2, RotateCcw, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState<SortOption>('newest');
  
  // States persistent in localStorage
  const [archiveItems, setArchiveItems] = useState<ArchiveItem[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Modal controls
  const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Initialize Dark Mode and Records on mount
  useEffect(() => {
    // 1. Dark Mode setup
    const savedTheme = localStorage.getItem('archive-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    
    setDarkMode(initialDark);
    if (initialDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 2. Archive Records setup
    const savedRecords = localStorage.getItem('archive-records');
    if (savedRecords) {
      try {
        setArchiveItems(JSON.parse(savedRecords));
      } catch (e) {
        setArchiveItems(INITIAL_ARCHIVE_ITEMS);
      }
    } else {
      setArchiveItems(INITIAL_ARCHIVE_ITEMS);
      localStorage.setItem('archive-records', JSON.stringify(INITIAL_ARCHIVE_ITEMS));
    }
    setIsLoaded(true);
  }, []);

  // Save records to localStorage on modify
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('archive-records', JSON.stringify(archiveItems));
    }
  }, [archiveItems, isLoaded]);

  // Dark mode toggle service
  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const nextMode = !prev;
      localStorage.setItem('archive-theme', nextMode ? 'dark' : 'light');
      if (nextMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return nextMode;
    });
  };

  // Add Item to Archive
  const handleAddNewItem = (newItem: ArchiveItem) => {
    const updated = [newItem, ...archiveItems];
    setArchiveItems(updated);
    localStorage.setItem('archive-records', JSON.stringify(updated));
  };

  // Delete Item from Archive
  const handleDeleteItem = (id: string) => {
    const updated = archiveItems.filter(item => item.id !== id);
    setArchiveItems(updated);
    localStorage.setItem('archive-records', JSON.stringify(updated));
    setSelectedItem(null);
  };

  // Update Item in Archive
  const handleUpdateItem = (updatedItem: ArchiveItem) => {
    const updated = archiveItems.map(item => item.id === updatedItem.id ? updatedItem : item);
    setArchiveItems(updated);
    localStorage.setItem('archive-records', JSON.stringify(updated));
    if (selectedItem && selectedItem.id === updatedItem.id) {
      setSelectedItem(updatedItem);
    }
  };

  // Reset all local changes/restores default DB
  const handleResetToDefaults = () => {
    if (confirm('아카이브를 기본 템플릿 데이터 상태로 초기화할까요? 추가된 카드들은 지워집니다.')) {
      setArchiveItems(INITIAL_ARCHIVE_ITEMS);
      localStorage.setItem('archive-records', JSON.stringify(INITIAL_ARCHIVE_ITEMS));
      setSearchQuery('');
      setSelectedCategory('All');
      setSelectedSort('newest');
    }
  };

  // Filter & Search computation
  const filteredItems = archiveItems
    .filter((item) => {
      // 1. Category search matches
      const categoryMatches = selectedCategory === 'All' || item.category === selectedCategory;
      
      // 2. Query search matches
      const searchLower = searchQuery.toLowerCase().trim();
      const queryMatches =
        searchLower === '' ||
        item.title.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        (item.content || '').toLowerCase().includes(searchLower) ||
        (item.usedFonts || '').toLowerCase().includes(searchLower) ||
        (item.colorCode || '').toLowerCase().includes(searchLower) ||
        item.tags.some((t) => t.toLowerCase().includes(searchLower)) ||
        item.category.toLowerCase().includes(searchLower);

      return categoryMatches && queryMatches;
    })
    .sort((a, b) => {
      // 3. Sorting criteria
      if (selectedSort === 'newest') {
        return b.createdAt - a.createdAt;
      }
      if (selectedSort === 'oldest') {
        return a.createdAt - b.createdAt;
      }
      if (selectedSort === 'alphabetical') {
        return a.title.localeCompare(b.title, 'ko');
      }
      return 0;
    });

  // Check if any filters are engaged
  const hasFilters = searchQuery !== '' || selectedCategory !== 'All';

  const resetSearchAndFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
  };

  return (
    <div className="min-h-screen bg-zinc-50/40 text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedSort={selectedSort}
        setSelectedSort={setSelectedSort}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onAddClick={() => setIsAddModalOpen(true)}
        totalCount={archiveItems.length}
      />

      {/* Main viewport */}
      <main className="flex-1 flex flex-col justify-start">
        {/* Banner section if filters are not active to establish visual depth */}
        {!hasFilters && (
          <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8 w-full">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="border-l-2 border-zinc-900 dark:border-zinc-100 pl-5 py-2 max-w-2xl"
            >
              <h2 className="font-serif text-3xl font-extrabold tracking-tight sm:text-4xl text-zinc-900 dark:text-white leading-tight">
                사물과 영감의 영속적 기록
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                건축적 유산, 일상 도구, 기술적 기재, 영적 풍경 속에서 가려 뽑은 미학적 편린들을 한자리에 보관합니다. 카드를 클릭해 깊은 비하인드 스토리와 지향점을 읽어보세요.
              </p>
            </motion.div>
          </div>
        )}

        {/* Dynamic Card Grid */}
        <ArchiveGrid
          items={filteredItems}
          onCardClick={(item) => setSelectedItem(item)}
          onResetFilters={resetSearchAndFilters}
          hasFilters={hasFilters}
        />
      </main>

      {/* Master Action Footer */}
      <footer className="border-t border-zinc-200 bg-white/50 py-8 dark:border-zinc-900 dark:bg-zinc-950/50 mt-12 transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                © 2026 DIGITAL ARCHIVAL LABS. ALL RECONSTRUCTIONS MAINTAINED.
              </p>
              <p className="mt-1 font-sans text-xs text-zinc-400 dark:text-zinc-500">
                본 웹앱은 브라우저 공간 내 영구 보존(localStorage) 엔진을 내포하고 있습니다.
              </p>
            </div>
            
            {/* Database Reset button */}
            <button
              onClick={handleResetToDefaults}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 dark:border-zinc-900 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200 cursor-pointer transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>시스템 데이터 리셋</span>
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <DetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onDelete={handleDeleteItem}
        onUpdateItem={handleUpdateItem}
        allArchiveItems={archiveItems}
        onSelectRelated={(item) => setSelectedItem(item)}
      />

      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddNewItem}
      />
    </div>
  );
}
