export interface ArchiveItem {
  id: string;
  title: string;
  description: string;
  content?: string;
  imageUrl: string;
  category: string;
  tags: string[];
  date: string; // e.g., '2026-06-12'
  createdAt: number; // Timestamp for custom sorting
  author?: string;
  location?: string;
  usedFonts?: string;
  colorCode?: string;
}

export type SortOption = 'newest' | 'oldest' | 'alphabetical';
