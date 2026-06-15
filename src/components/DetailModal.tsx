import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, User, MapPin, Copy, Check, Trash2, ArrowUpRight, FileText, Download, Edit2, Upload } from 'lucide-react';
import { ArchiveItem } from '../types';
import { compressImage } from '../utils';
import { CATEGORIES } from '../data';

const isPdfFile = (url: string) => {
  return url?.startsWith('data:application/pdf') || url?.endsWith('.pdf') || url?.includes('.pdf?');
};

interface DetailModalProps {
  item: ArchiveItem | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onUpdateItem?: (updatedItem: ArchiveItem) => void;
  allArchiveItems: ArchiveItem[];
  onSelectRelated: (item: ArchiveItem) => void;
  existingCategories: string[];
}

export default function DetailModal({
  item,
  onClose,
  onDelete,
  onUpdateItem,
  allArchiveItems,
  onSelectRelated,
  existingCategories,
}: DetailModalProps) {
  const [copied, setCopied] = useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!item) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [item]);

  // Edit states for fields
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Plane');
  const [editCustomCategory, setEditCustomCategory] = useState('');
  const [editShowCustomInput, setEditShowCustomInput] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editUsedFonts, setEditUsedFonts] = useState('');
  const [editColorCode, setEditColorCode] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editFileName, setEditFileName] = useState('');

  // Sync edit fields when 'item' prop changes
  useEffect(() => {
    if (item) {
      setEditTitle(item.title);
      setEditCategory(item.category);
      setEditDate(item.date);
      setEditAuthor(item.author || '');
      setEditLocation(item.location || '');
      setEditDescription(item.description);
      setEditContent(item.content || '');
      setEditUsedFonts(item.usedFonts || '');
      setEditColorCode(item.colorCode || '');
      setEditTags(item.tags.join(', '));
      setEditImageUrl(item.imageUrl);
      setEditFileName('');
      setEditCustomCategory('');
      setEditShowCustomInput(false);
      setIsEditing(false); // Reset to view mode on change
    }
  }, [item]);

  if (!item) return null;

  const handleCopyLink = () => {
    const fakeUrl = `${window.location.origin}/archive/${item.id}`;
    navigator.clipboard.writeText(fakeUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleEditCategoryChange = (val: string) => {
    if (val === '__custom__') {
      setEditShowCustomInput(true);
    } else {
      setEditShowCustomInput(false);
      setEditCategory(val);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle || !editDescription) return;

    const finalCategory = editShowCustomInput ? editCustomCategory.trim() : editCategory;
    if (!finalCategory) {
      alert('카테고리를 입력하거나 선택해 주세요.');
      return;
    }

    const parsedTags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t !== '');

    const updatedItem: ArchiveItem = {
      ...item,
      title: editTitle,
      category: finalCategory,
      date: editDate,
      author: editAuthor.trim() || undefined,
      location: editLocation.trim() || undefined,
      description: editDescription,
      content: editContent.trim() || undefined,
      usedFonts: editUsedFonts.trim() || undefined,
      colorCode: editColorCode.trim() || undefined,
      tags: parsedTags.length ? parsedTags : [finalCategory],
      imageUrl: editImageUrl,
    };

    onUpdateItem?.(updatedItem);
    setIsEditing(false);
  };

  // Find related items (exclude current item, match category, max 3 items)
  const relatedItems = allArchiveItems
    .filter((v) => v.category === item.category && v.id !== item.id)
    .slice(0, 3);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm transition-opacity duration-300"
        />

        {/* Modal Outer shell */}
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white dark:bg-zinc-950 dark:border dark:border-zinc-800/80 shadow-2xl transition-all duration-300"
          >
            {/* Main scrollable body */}
            <div className="max-h-[85vh] overflow-y-auto px-6 py-8 sm:px-10 sm:py-10 md:px-12 md:py-12">
              
              {/* Top Bar Controls */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900/10 dark:bg-zinc-100/10 px-3 hover:bg-zinc-900/20 dark:hover:bg-zinc-100/20 text-zinc-700 dark:text-zinc-200 text-xs font-semibold cursor-pointer transition-all"
                  title="기록 주소 복사"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-500">주소 복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>복사</span>
                    </>
                  )}
                </button>
                {onUpdateItem && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold cursor-pointer transition-all ${
                      isEditing
                        ? 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900'
                        : 'bg-zinc-900/10 dark:bg-zinc-100/10 hover:bg-zinc-900/20 dark:hover:bg-zinc-100/20 text-zinc-700 dark:text-zinc-200'
                    }`}
                    title={isEditing ? "상세 정보 보기" : "정보 수정하기"}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>{isEditing ? "보기" : "수정"}</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900/10 dark:bg-zinc-100/10 hover:bg-zinc-900/20 dark:hover:bg-zinc-100/20 text-zinc-700 dark:text-zinc-200 cursor-pointer transition-all"
                  aria-label="닫기"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Sequential Details Layout */}
              <div className="space-y-8 mt-4">
                {isEditing ? (
                  <form onSubmit={handleSaveEdit} className="space-y-6">
                    <div className="border-b border-zinc-100 dark:border-zinc-900 pb-3">
                      <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-white">기록 정보 자유롭게 수정</h3>
                      <p className="text-[11px] text-zinc-500 mt-1 font-sans">아카이브 카드의 모든 정보를 실시간으로 편집할 수 있습니다.</p>
                    </div>

                    {/* Title & Category Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-505 mb-1.5">
                          기록 제목 <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-white focus:border-zinc-900 focus:outline-none dark:focus:border-zinc-100/40 transition-all font-sans"
                          placeholder="제목을 입력하세요"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-505 mb-1.5">
                          카테고리 <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={editShowCustomInput ? '__custom__' : editCategory}
                          onChange={(e) => handleEditCategoryChange(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-805 bg-white dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-white focus:border-zinc-900 focus:outline-none dark:focus:border-zinc-100/40 transition-all font-sans cursor-pointer"
                        >
                          {existingCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                          <option value="__custom__" className="font-semibold text-zinc-900 dark:text-zinc-100">+ 직접 입력...</option>
                        </select>
                      </div>
                    </div>

                    {/* Custom Category Input if selected in edit view */}
                    {editShowCustomInput && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800 space-y-1"
                      >
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-400">
                          직접 입력할 카테고리명 *
                        </label>
                        <input
                          type="text"
                          required
                          value={editCustomCategory}
                          onChange={(e) => setEditCustomCategory(e.target.value)}
                          placeholder="새로운 카테고리명을 직접 기입하세요"
                          className="w-full rounded-lg border border-zinc-200 bg-white dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-white focus:border-zinc-900 focus:outline-none dark:focus:border-zinc-100/40 transition-all font-sans"
                        />
                      </motion.div>
                    )}

                    {/* Image/PDF file upload */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-505 mb-1.5">
                        대표 이미지 또는 PDF 파일 수정
                      </label>
                      <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 p-4 flex flex-col items-center justify-center text-center">
                        {editImageUrl ? (
                          <div className="mb-3 relative max-h-[140px] overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            {isPdfFile(editImageUrl) ? (
                              <div className="p-4 flex items-center gap-3">
                                <FileText className="h-10 w-10 text-zinc-400" />
                                <div className="text-left font-mono">
                                  <span className="text-xs font-bold block text-zinc-700 dark:text-zinc-300">PDF 아카이브 파일</span>
                                  <span className="text-[9px] text-zinc-400 truncate block max-w-[180px]">{editFileName || '업로드된 문서'}</span>
                                </div>
                              </div>
                            ) : (
                              <img src={editImageUrl} alt="Preview" className="h-[120px] w-auto object-contain" />
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditImageUrl('');
                                setEditFileName('');
                              }}
                              className="absolute top-1 right-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white p-1 shadow-sm cursor-pointer transition-colors"
                              title="삭제"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="py-2 flex flex-col items-center">
                            <Upload className="h-6 w-6 text-zinc-400 mb-1.5" />
                            <span className="text-xs text-zinc-400 font-sans mb-2">최대 50MB 이미지 & PDF 파일 지원</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const fileInput = document.createElement('input');
                            fileInput.type = 'file';
                            fileInput.accept = 'image/*,application/pdf';
                            fileInput.onchange = async (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                const MAX_SIZE_BYTES = 50 * 1024 * 1024;
                                if (file.size > MAX_SIZE_BYTES) {
                                  alert(`⚠️ 파일 크기가 너무 큽니다! (현재 용량: ${(file.size / 1024 / 1024).toFixed(1)}MB)\n웹사이트 안정이 보장되는 최대 50MB 이하의 이미지 또는 PDF만 업로드할 수 있습니다.`);
                                  return;
                                }
                                setEditFileName(file.name);
                                try {
                                  const base64 = await compressImage(file);
                                  setEditImageUrl(base64);
                                } catch (err) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setEditImageUrl(reader.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }
                            };
                            fileInput.click();
                          }}
                          className="rounded bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 px-3 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          새 파일 업로드
                        </button>
                      </div>
                    </div>

                    {/* Metadata Row: Date, Author, Location */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-505 mb-1.5">
                          기록 일자 <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-white focus:border-zinc-900 focus:outline-none dark:focus:border-zinc-100/40 transition-all font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-505 mb-1.5">
                          기록 작가 / 크리에이터
                        </label>
                        <input
                          type="text"
                          value={editAuthor}
                          onChange={(e) => setEditAuthor(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-white focus:border-zinc-900 focus:outline-none dark:focus:border-zinc-100/40 transition-all font-sans"
                          placeholder="작가 이름"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-505 mb-1.5">
                          보관 공간 / 위치
                        </label>
                        <input
                          type="text"
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-white focus:border-zinc-900 focus:outline-none dark:focus:border-zinc-100/40 transition-all font-sans"
                          placeholder="보관 위치"
                        />
                      </div>
                    </div>

                    {/* Description Description */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-505 mb-1.5">
                        감상 및 개요 설명 <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-950 dark:text-white focus:border-zinc-900 focus:outline-none dark:focus:border-zinc-100/40 transition-all font-sans"
                        placeholder="기록에 대한 미니멀한 설명을 작성해 주세요."
                      />
                    </div>

                    {/* Behind Story Content */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-505 mb-1.5">
                        배경 소장 메커니즘 / 세부 사색 내용
                      </label>
                      <textarea
                        rows={4}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-955 dark:text-white focus:border-zinc-900 focus:outline-none dark:focus:border-zinc-100/40 transition-all font-sans"
                        placeholder="작품의 기원, 작업 비하인드 스토리, 혹은 관련 사색 내용을 심도 있게 작성해 주세요."
                      />
                    </div>

                    {/* Design specs: usedFonts, colorCode */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-505 mb-1.5">
                          정의된 서체 / 폰트 (쉼표로 구분)
                        </label>
                        <input
                          type="text"
                          value={editUsedFonts}
                          onChange={(e) => setEditUsedFonts(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-white focus:border-zinc-900 focus:outline-none dark:focus:border-zinc-100/40 transition-all font-sans"
                          placeholder="예: Playfair Display, Inter"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-505 mb-1.5">
                          컬러 보드 규격 (#RGB 또는 #RRGGBB 쉼표 구분)
                        </label>
                        <input
                          type="text"
                          value={editColorCode}
                          onChange={(e) => setEditColorCode(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-white focus:border-zinc-900 focus:outline-none dark:focus:border-zinc-100/40 transition-all font-mono"
                          placeholder="예: #18181B, #E4E4E7"
                        />
                      </div>
                    </div>

                    {/* Tags input */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-505 mb-1.5">
                        기록 분류 태그 (쉼표로 구분)
                      </label>
                      <input
                        type="text"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-white focus:border-zinc-900 focus:outline-none dark:focus:border-zinc-100/40 transition-all font-sans"
                        placeholder="예: Brutalism, Concrete, Geometry"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-5 py-2.5 text-xs font-bold transition-all border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                      >
                        변경 취소
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 px-6 py-2.5 text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        변경 내용 저장
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {/* 1. Header (Category & Title) */}
                    <div className="space-y-2 border-b border-zinc-100 dark:border-zinc-900 pb-5">
                      <span className="inline-flex rounded-md bg-zinc-100 dark:bg-zinc-900 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                        {item.category}
                      </span>
                      <h2 className="font-serif text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl leading-tight">
                        {item.title}
                      </h2>
                    </div>

                    {/* 2. Hero Visual Showcase */}
                    <div className="relative overflow-hidden rounded-xl bg-zinc-50 dark:bg-zinc-900 shadow-xs border border-zinc-150/80 dark:border-zinc-800/60 max-h-[520px] sm:max-h-[600px] flex items-center justify-center group/card-view">
                      {!item.imageUrl ? (
                        <div className="w-full min-h-[220px] flex flex-col items-center justify-center p-10 text-center select-none">
                          <FileText className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-2.5" />
                          <span className="font-mono text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-505 font-bold mb-4">
                            등록된 아카이브 사진이나 파일이 없습니다
                          </span>
                          <button
                            onClick={() => {
                              const fileInput = document.createElement('input');
                              fileInput.type = 'file';
                              fileInput.accept = 'image/*,application/pdf';
                              fileInput.onchange = async (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) {
                                  // 50MB Max Limit (50 * 1024 * 1024 bytes)
                                  const MAX_SIZE_BYTES = 50 * 1024 * 1024;
                                  if (file.size > MAX_SIZE_BYTES) {
                                    alert(`⚠️ 파일 크기가 너무 큽니다! (현재 용량: ${(file.size / 1024 / 1024).toFixed(1)}MB)\n웹사이트 안정이 보장되는 최대 50MB 이하의 이미지 또는 PDF만 업로드할 수 있습니다.`);
                                    return;
                                  }

                                  try {
                                    const compressedBase64 = await compressImage(file);
                                    const updated = { ...item, imageUrl: compressedBase64 };
                                    onUpdateItem?.(updated);
                                  } catch (err) {
                                    console.error('Image compression failed inside details, fallback to raw load:', err);
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      const updated = { ...item, imageUrl: reader.result as string };
                                      onUpdateItem?.(updated);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }
                              };
                              fileInput.click();
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 px-5 py-2.5 text-xs font-bold transition-all shadow-md cursor-pointer"
                          >
                            <span>사진 / 파일 등록하기</span>
                          </button>
                        </div>
                      ) : isPdfFile(item.imageUrl) ? (
                        <div className="w-full bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center p-10 text-center select-none rounded-xl relative">
                          <div className="p-4 bg-zinc-900 dark:bg-zinc-850 rounded-xl border border-zinc-800 dark:border-zinc-750 mb-4 shadow-md">
                            <FileText className="h-12 w-12 text-zinc-300 dark:text-zinc-100" />
                          </div>
                          <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 font-bold mb-1">
                            PDF 아카이브 문서
                          </span>
                          <span className="text-xs text-zinc-500 font-mono mb-6 max-w-[90%] truncate block">
                            {item.title}
                          </span>
                          
                          <div className="flex flex-wrap items-center justify-center gap-3">
                            <a
                              href={item.imageUrl}
                              download={`${item.title}.pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 px-5 py-2.5 text-xs font-bold transition-all border border-zinc-200 dark:border-zinc-700 shadow-sm cursor-pointer"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>다운로드 / 뷰어로 열기</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('등록된 PDF 아카이브 문서를 정말로 삭제할까요?')) {
                                  onUpdateItem?.({ ...item, imageUrl: '' });
                                }
                              }}
                              className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-950/60 cursor-pointer shadow-xs"
                            >
                              <span>PDF 임포트 해제</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full overflow-hidden rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-center">
                          {/* Pristine high-quality image presenting available ratio without cropping or distortion */}
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-auto block object-contain rounded-xl max-h-[75vh]"
                          />
                          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('등록된 아카이브 사진을 정말로 삭제하시겠습니까?')) {
                                  onUpdateItem?.({ ...item, imageUrl: '' });
                                }
                              }}
                              className="flex items-center gap-1.5 rounded-full bg-zinc-950/85 hover:bg-rose-600 dark:bg-zinc-900/90 dark:hover:bg-rose-900 text-white dark:text-zinc-100 py-1.5 px-3.5 text-xs font-semibold cursor-pointer transition-all shadow-md"
                              title="사진 삭제"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>사진 삭제</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3. Core Credentials & Metadata Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/10 rounded-xl p-4 border border-zinc-200/40 dark:border-zinc-800">
                      <div className="flex flex-col gap-0.5 sm:border-r border-zinc-200/60 dark:border-zinc-800/80 pr-2">
                        <span className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-bold flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 opacity-60" /> 기록 일자
                        </span>
                        <strong className="text-zinc-800 dark:text-zinc-200 text-sm font-semibold">{item.date}</strong>
                      </div>
                      {item.author && (
                        <div className="flex flex-col gap-0.5 sm:border-r border-zinc-200/60 dark:border-zinc-800/80 pr-2">
                          <span className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-bold flex items-center gap-1">
                            <User className="h-3.5 w-3.5 opacity-60" /> 기록 작가
                          </span>
                          <strong className="text-zinc-800 dark:text-zinc-200 text-sm font-semibold">{item.author}</strong>
                        </div>
                      )}
                      {item.location && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-bold flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 opacity-60" /> 보관 공간
                          </span>
                          <strong className="text-zinc-800 dark:text-zinc-200 text-sm font-semibold truncate" title={item.location}>{item.location}</strong>
                        </div>
                      )}
                    </div>

                    {/* 4. Sequential Narrative Sections */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold">
                          감상 및 개요 설명
                        </span>
                        <p className="font-sans text-base leading-relaxed text-zinc-800 dark:text-zinc-200 text-justify whitespace-pre-line font-medium text-slate-800 dark:text-slate-205">
                          {item.description}
                        </p>
                      </div>

                      {item.content && (
                        <div className="space-y-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                          <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold">
                            배경 소장 매카니즘 / 세부 사색 내용
                          </span>
                          <p className="font-sans text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 whitespace-pre-line border-l-2 border-zinc-200 dark:border-zinc-800 pl-4 py-0.5 text-justify italic">
                            {item.content}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 5. Typography and Archetypal Specifications */}
                    {(item.usedFonts || item.colorCode) && (
                      <div className="border-t border-zinc-100 dark:border-zinc-900 pt-6 space-y-4">
                        <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold">
                          비주얼 디자인 속성 (Design Specs)
                        </span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {item.usedFonts && (
                            <div className="rounded-xl border border-zinc-200/50 dark:border-zinc-800 p-4 bg-zinc-50/20 dark:bg-zinc-900/10 flex flex-col gap-2">
                              <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-bold">
                                정의된 서체 (Typography)
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {item.usedFonts.split(',').map((font, fIdx) => (
                                  <span
                                    key={fIdx}
                                    className="font-sans text-xs font-semibold px-2.5 py-1 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-md shadow-xs select-all"
                                  >
                                    {font.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {item.colorCode && (
                            <div className="rounded-xl border border-zinc-200/50 dark:border-zinc-800 p-4 bg-zinc-50/20 dark:bg-zinc-900/10 flex flex-col gap-2">
                              <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-bold">
                                컬러 보드 규격 (Palette)
                              </span>
                              <div className="flex items-center gap-2 flex-wrap">
                                {item.colorCode.split(',').map((colorOption, cIdx) => {
                                  const color = colorOption.trim();
                                  const isValidHex = /^#[0-9a-fA-F]{3,8}$/.test(color);
                                  return (
                                    <div
                                      key={cIdx}
                                      className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-md shadow-xs"
                                    >
                                      <span
                                        className="inline-block w-3 h-3 rounded-md border border-black/10 dark:border-white/10"
                                        style={{ backgroundColor: isValidHex ? color : '#CCCCCC' }}
                                      />
                                      <span className="font-mono text-[10px] uppercase text-zinc-700 dark:text-zinc-350 tracking-wider select-all">
                                        {color}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 6. Tags Segment */}
                    <div className="border-t border-zinc-100 dark:border-zinc-900 pt-5 flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold mr-1">
                        분류 태그
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1 font-mono text-[10px] text-zinc-600 dark:text-zinc-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 7. Footer Administrative Controls */}
                    {onDelete && (
                      <div className="pt-6 border-t border-zinc-150 dark:border-zinc-900 flex items-center justify-between">
                        <p className="font-mono text-[8px] uppercase tracking-wider text-zinc-400/80">
                          IDENTIFIER: {item.id}
                        </p>
                        <button
                          onClick={() => {
                            if (confirm('이 아카이브 기록을 목록에서 정말로 삭제할까요? 데이터 복구는 불가능합니다.')) {
                              onDelete(item.id);
                            }
                          }}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 cursor-pointer transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>기록 영구 삭제</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Related collections block */}
              {relatedItems.length > 0 && (
                <div className="mt-12 border-t border-zinc-100 dark:border-zinc-900 pt-8">
                  <h4 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                    동일 카테고리의 연관 아카이브
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {relatedItems.map((relItem) => (
                      <div
                        key={relItem.id}
                        onClick={() => onSelectRelated(relItem)}
                        className="group flex items-center gap-3.5 rounded-xl border border-zinc-100 dark:border-zinc-900 p-3 bg-zinc-50/50 hover:bg-zinc-50 dark:bg-zinc-900/20 dark:hover:bg-zinc-900/50 cursor-pointer transition-all duration-200"
                      >
                        {isPdfFile(relItem.imageUrl) ? (
                          <div className="h-11 w-11 rounded-md bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 dark:border-zinc-800 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-zinc-400 dark:text-zinc-300" />
                          </div>
                        ) : (
                          <img
                            src={relItem.imageUrl}
                            alt={relItem.title}
                            className="h-11 w-11 rounded-md object-cover flex-shrink-0 bg-zinc-100"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-zinc-805 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white">
                            {relItem.title}
                          </p>
                          <span className="inline-flex items-center gap-1 mt-0.5 font-mono text-[9px] text-zinc-400 dark:text-zinc-505">
                            <span>{relItem.date}</span>
                            <ArrowUpRight className="h-2 w-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
