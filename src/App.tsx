import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ArchiveGrid from './components/ArchiveGrid';
import DetailModal from './components/DetailModal';
import AddCardModal from './components/AddCardModal';
import { ArchiveItem, SortOption } from './types';
import { INITIAL_ARCHIVE_ITEMS } from './data';
import { SlidersHorizontal, Trash2, RotateCcw, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { safeSetLocalStorage } from './utils';
import { isFirebaseEnabled, db, handleFirestoreError, OperationType } from './firebase';
import { collection, query, onSnapshot, setDoc, doc, deleteDoc, getDocs } from 'firebase/firestore';

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

  // Initialize Dark Mode and Records on mount (integrated with Firestore real-time synchronization)
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
    if (isFirebaseEnabled) {
      const q = query(collection(db, 'archive-records'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items: ArchiveItem[] = [];
        snapshot.forEach((doc) => {
          items.push(doc.data() as ArchiveItem);
        });

        if (items.length === 0) {
          // Newly provisioned database - Seed with default items for user benefit
          console.log('Seeding cloud Firestore database with default archive cards...');
          INITIAL_ARCHIVE_ITEMS.forEach(async (initItem) => {
            try {
              await setDoc(doc(db, 'archive-records', initItem.id), initItem);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `archive-records/${initItem.id}`);
            }
          });
          setArchiveItems(INITIAL_ARCHIVE_ITEMS);
        } else {
          setArchiveItems(items);
        }
        setIsLoaded(true);
      }, (error) => {
        console.error('Snapshot stream error - dynamic fail to local state:', error);
        // Fallback to local storage if reading is block/insufficient permissions
        const savedRecords = localStorage.getItem('archive-records');
        if (savedRecords) {
          try { setArchiveItems(JSON.parse(savedRecords)); } catch (e) { setArchiveItems(INITIAL_ARCHIVE_ITEMS); }
        } else {
          setArchiveItems(INITIAL_ARCHIVE_ITEMS);
        }
        setIsLoaded(true);
      });

      return () => unsubscribe();
    } else {
      // Sync with custom Express Server DB
      const fetchServerRecords = async () => {
        try {
          const res = await fetch('/api/archive-records');
          if (res.ok) {
            const serverItems = await res.json();
            setArchiveItems(serverItems);
          } else {
            throw new Error('API server returned response error');
          }
        } catch (err) {
          console.warn('Backend server database load issue, falling back to local storage:', err);
          const savedRecords = localStorage.getItem('archive-records');
          if (savedRecords) {
            try { setArchiveItems(JSON.parse(savedRecords)); } catch (e) { setArchiveItems(INITIAL_ARCHIVE_ITEMS); }
          } else {
            setArchiveItems(INITIAL_ARCHIVE_ITEMS);
          }
        } finally {
          setIsLoaded(true);
        }
      };
      
      fetchServerRecords();

      // Secure and resilient WebSocket connection for instantaneous sync across all devices
      let socket: WebSocket | null = null;
      let reconnectTimeoutId: any = null;
      let lockReconnect = false;

      const connectWS = () => {
        if (lockReconnect) return;
        lockReconnect = true;

        try {
          const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const wsUrl = `${wsProtocol}//${window.location.host}`;
          console.log('[WebSocket] Connecting client sync socket:', wsUrl);
          socket = new WebSocket(wsUrl);

          socket.onopen = () => {
            console.log('[WebSocket] Sync established successfully');
            lockReconnect = false;
          };

          socket.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data && data.type === 'update' && Array.isArray(data.records)) {
                console.log('[WebSocket] Real-time sync update received:', data.records.length, 'cards updated');
                setArchiveItems(data.records);
              }
            } catch (err) {
              console.error('[WebSocket] Parsing message from server failed:', err);
            }
          };

          socket.onclose = () => {
            console.log('[WebSocket] Connection closed. Reconnecting shortly...');
            lockReconnect = false;
            reconnectTimeoutId = setTimeout(connectWS, 4000);
          };

          socket.onerror = (err) => {
            console.error('[WebSocket] Connection error:', err);
            socket?.close();
          };
        } catch (e) {
          console.error('[WebSocket] Initialization error:', e);
          lockReconnect = false;
          reconnectTimeoutId = setTimeout(connectWS, 5000);
        }
      };

      connectWS();

      // Return cleanup handler to correctly clean memory and connections on component re-mount
      return () => {
        if (socket) {
          socket.onclose = null;
          socket.onerror = null;
          socket.close();
        }
        if (reconnectTimeoutId) {
          clearTimeout(reconnectTimeoutId);
        }
      };
    }
  }, []);

  // Save records to localStorage on modify for offline cache security
  useEffect(() => {
    if (isLoaded && archiveItems.length > 0) {
      safeSetLocalStorage('archive-records', JSON.stringify(archiveItems));
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
  const handleAddNewItem = async (newItem: ArchiveItem) => {
    let finalItem = { ...newItem };

    // Upload base64 image statically if detected
    if (newItem.imageUrl && newItem.imageUrl.startsWith('data:')) {
      try {
        const filename = `${newItem.id}${newItem.imageUrl.startsWith('data:application/pdf') ? '.pdf' : '.jpg'}`;
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename,
            base64: newItem.imageUrl
          })
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          finalItem.imageUrl = data.url;
          console.log('[Upload] New item image captured statically:', data.url);
        }
      } catch (uploadErr) {
        console.error('[Upload] Failed to upload image to server, fallback to base64:', uploadErr);
      }
    }

    if (isFirebaseEnabled) {
      try {
        // Sanitize undefined fields from item (JSON parse stringify drops undefined properties)
        const cleanedItem = JSON.parse(JSON.stringify(finalItem));
        await setDoc(doc(db, 'archive-records', cleanedItem.id), cleanedItem);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `archive-records/${newItem.id}`);
      }
    } else {
      try {
        const res = await fetch('/api/archive-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalItem)
        });
        if (res.ok) {
          const updatedRecords = await res.json();
          setArchiveItems(updatedRecords);
        } else {
          throw new Error('Server returned save record error');
        }
      } catch (err) {
        console.error('API Server sync error, fallback to local state:', err);
        const updated = [finalItem, ...archiveItems];
        setArchiveItems(updated);
        safeSetLocalStorage('archive-records', JSON.stringify(updated));
      }
    }
  };

  // Delete Item from Archive
  const handleDeleteItem = async (id: string) => {
    if (isFirebaseEnabled) {
      try {
        await deleteDoc(doc(db, 'archive-records', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `archive-records/${id}`);
      }
    } else {
      try {
        const res = await fetch(`/api/archive-records/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          const updatedRecords = await res.json();
          setArchiveItems(updatedRecords);
        } else {
          throw new Error('Server returned delete error');
        }
      } catch (err) {
        console.error('API Server delete error, fallback to local:', err);
        const updated = archiveItems.filter(item => item.id !== id);
        setArchiveItems(updated);
        safeSetLocalStorage('archive-records', JSON.stringify(updated));
      }
    }
    setSelectedItem(null);
  };

  // Update Item in Archive
  const handleUpdateItem = async (updatedItem: ArchiveItem) => {
    let finalItem = { ...updatedItem };

    // Upload base64 image statically if detected and updated
    if (updatedItem.imageUrl && updatedItem.imageUrl.startsWith('data:')) {
      try {
        const filename = `${updatedItem.id}${updatedItem.imageUrl.startsWith('data:application/pdf') ? '.pdf' : '.jpg'}`;
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename,
            base64: updatedItem.imageUrl
          })
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          finalItem.imageUrl = data.url;
          console.log('[Upload] Updated image captured statically:', data.url);
        }
      } catch (uploadErr) {
        console.error('[Upload] Failed to upload updated image, fallback to base64:', uploadErr);
      }
    }

    if (isFirebaseEnabled) {
      try {
        // Sanitize undefined fields from item (JSON parse stringify drops undefined properties)
        const cleanedItem = JSON.parse(JSON.stringify(finalItem));
        await setDoc(doc(db, 'archive-records', cleanedItem.id), cleanedItem);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `archive-records/${updatedItem.id}`);
      }
    } else {
      try {
        const res = await fetch(`/api/archive-records/${updatedItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalItem)
        });
        if (res.ok) {
          const updatedRecords = await res.json();
          setArchiveItems(updatedRecords);
          const match = updatedRecords.find((x: ArchiveItem) => x.id === updatedItem.id);
          if (match && selectedItem && selectedItem.id === updatedItem.id) {
            setSelectedItem(match);
          }
        } else {
          throw new Error('Server update error');
        }
      } catch (err) {
        console.error('API Server update error, fallback to local:', err);
        const updated = archiveItems.map(item => item.id === finalItem.id ? finalItem : item);
        setArchiveItems(updated);
        safeSetLocalStorage('archive-records', JSON.stringify(updated));
      }
    }
    if (selectedItem && selectedItem.id === updatedItem.id) {
      setSelectedItem(finalItem);
    }
  };

  // Reset all local changes/restores default DB
  const handleResetToDefaults = async () => {
    if (confirm('아카이브를 기본 템플릿 데이터 상태로 초기화할까요? 추가된 카드들은 지워집니다.')) {
      if (isFirebaseEnabled) {
        try {
          const querySnapshot = await getDocs(collection(db, 'archive-records'));
          for (const document of querySnapshot.docs) {
            await deleteDoc(doc(db, 'archive-records', document.id));
          }
          for (const initItem of INITIAL_ARCHIVE_ITEMS) {
            await setDoc(doc(db, 'archive-records', initItem.id), initItem);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'archive-records');
        }
      } else {
        try {
          const res = await fetch('/api/archive-records/reset', {
            method: 'POST'
          });
          if (res.ok) {
            const initialData = await res.json();
            setArchiveItems(initialData);
          } else {
            throw new Error('Server returned reset error');
          }
        } catch (err) {
          console.error('API Server reset error, fallback to local:', err);
          setArchiveItems(INITIAL_ARCHIVE_ITEMS);
          safeSetLocalStorage('archive-records', JSON.stringify(INITIAL_ARCHIVE_ITEMS));
        }
      }
      setSearchQuery('');
      setSelectedCategory('All');
      setSelectedSort('newest');
    }
  };

  // Deduplicate and dynamically compile the total category tab filters dynamically
  const defaultCategories: string[] = ['Plane', 'Typography', 'Image', 'Collage', 'Theme'];
  const activeCategories: string[] = Array.from(new Set(archiveItems.map((item) => item.category).filter(Boolean)));
  const dynamicCategories: string[] = ['All', ...Array.from(new Set([...defaultCategories, ...activeCategories]))];

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
        categories={dynamicCategories}
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
                2026 Graphic Design
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                This is an archive of Graphic Design Posters made by Joohyung H. Oh. All the work has been done during the Lecture '2026 Graphic Design' by Professor Yena Park.
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
              <p className="mt-1 font-sans text-xs text-zinc-400 dark:text-zinc-505 bg-clip-text">
                {isFirebaseEnabled 
                  ? "✓ 포트폴리오 데이터가 클라우드 Firestore 데이터베이스에 실시간 영구 연동되어 보호받고 있습니다." 
                  : "✓ 포트폴리오 데이터가 서버 데이터베이스에 영구 연동되어 다른 기기들과 양방향 실시간 공유가 지원됩니다."}
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
        existingCategories={dynamicCategories.filter(c => c !== 'All')}
      />

      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddNewItem}
        existingCategories={dynamicCategories.filter(c => c !== 'All')}
      />
    </div>
  );
}
