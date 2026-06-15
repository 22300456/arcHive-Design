import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Image, Tag, Calendar, User, MapPin, Check, Sparkles, Upload, FileText } from 'lucide-react';
import { ArchiveItem } from '../types';
import { CATEGORIES } from '../data';
import { compressImage } from '../utils';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: ArchiveItem) => void;
  existingCategories: string[];
}

const PRESET_IMAGES = [
  {
    name: '모던 하우스',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    tag: 'Architecture'
  },
  {
    name: '카메라 & 오브젝트',
    url: 'https://images.unsplash.com/photo-1558089687-f282ffcbd1d5?auto=format&fit=crop&w=800&q=80',
    tag: 'Objects'
  },
  {
    name: '테크 인포메이션',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    tag: 'Tech'
  },
  {
    name: '신비한 숲',
    url: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=800&q=80',
    tag: 'Nature'
  }
];

const isPdfFile = (url: string) => {
  return url?.startsWith('data:application/pdf') || url?.endsWith('.pdf') || url?.includes('.pdf?');
};

export default function AddCardModal({ isOpen, onClose, onSubmit, existingCategories }: AddCardModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [usedFonts, setUsedFonts] = useState('');
  const [colorCode, setColorCode] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [author, setAuthor] = useState('');
  const [location, setLocation] = useState('');
  const [fileName, setFileName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset fields when open/close
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setCategory(existingCategories && existingCategories.length > 0 ? existingCategories[0] : 'Plane');
      setCustomCategory('');
      setShowCustomInput(false);
      setImageUrl('');
      setDescription('');
      setUsedFonts('');
      setColorCode('');
      setTagsInput('');
      setDate(new Date().toISOString().split('T')[0]);
      setAuthor('');
      setLocation('');
      setFileName('');
    }
  }, [isOpen, existingCategories]);

  if (!isOpen) return null;

  // Handle uploaded file and convert to Base64 (Data URL)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 50MB Max Limit (50 * 1024 * 1024 bytes)
      const MAX_SIZE_BYTES = 50 * 1024 * 1024;
      if (file.size > MAX_SIZE_BYTES) {
        alert(`⚠️ 파일 크기가 너무 큽니다! (현재 용량: ${(file.size / 1024 / 1024).toFixed(1)}MB)\n웹사이트 안정이 보장되는 최대 50MB 이하의 이미지 또는 PDF만 업로드할 수 있습니다.`);
        return;
      }

      setFileName(file.name);
      try {
        const compressedBase64 = await compressImage(file);
        setImageUrl(compressedBase64);
      } catch (err) {
        console.error('Image compression failed, fallback to raw load:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleCategoryChange = (val: string) => {
    if (val === '__custom__') {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      setCategory(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const finalCategory = showCustomInput ? customCategory.trim() : category;
    if (!finalCategory) {
      alert('카테고리를 입력하거나 선택해 주세요.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t !== '');

    const newItem: ArchiveItem = {
      id: `custom-${Date.now()}`,
      title,
      description,
      usedFonts: usedFonts.trim() || undefined,
      colorCode: colorCode.trim() || undefined,
      imageUrl: imageUrl || PRESET_IMAGES[0].url,
      category: finalCategory,
      tags: tags.length ? tags : [finalCategory],
      date,
      createdAt: Date.now(),
      author: author.trim() || undefined,
      location: location.trim() || undefined,
    };

    onSubmit(newItem);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-950 dark:border dark:border-zinc-800/80 shadow-2xl overflow-hidden transition-all duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 px-6 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
                <h3 className="font-display font-bold text-zinc-900 dark:text-white uppercase text-base">
                  새 아카이브 기록 등록
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              
              {/* Category & Title */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="sm:col-span-1 border-0">
                  <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    카테고리 *
                  </label>
                  <select
                    value={showCustomInput ? '__custom__' : category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 focus:border-zinc-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-350 dark:focus:border-white dark:focus:bg-zinc-950 transition-colors cursor-pointer"
                  >
                    {existingCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__custom__" className="font-semibold text-zinc-900 dark:text-zinc-100">+ 직접 입력...</option>
                  </select>
                </div>
                
                <div className="sm:col-span-3">
                  <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    기록 타이틀 *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 리얼 아날로그 턴테이블 복각"
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 focus:border-zinc-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:bg-zinc-950 transition-colors"
                  />
                </div>
              </div>

              {/* Custom Category Input if selected */}
              {showCustomInput && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 space-y-1.5"
                >
                  <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    직접 입력할 카테고리명 *
                  </label>
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="예: Architecture, Nature 등 입력한 가치 그대로 보존됩니다"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-805 dark:bg-zinc-950 dark:text-white dark:focus:border-white transition-all font-sans"
                  />
                </motion.div>
              )}

              {/* Cover presets AND Image Upload file field / or Custom Remote URL */}
              <div>
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  아카이브 파일 등록 (이미지 또는 PDF 직접 업로드) *
                </label>

                {/* Upload Section / Preset Choice Grid side-by-side */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3.5">
                  {/* File Upload zone (takes 2 sections) */}
                  <div className="sm:col-span-2">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-650 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-zinc-50/50 dark:bg-zinc-900/20 hover:bg-zinc-100/30 dark:hover:bg-zinc-900/40 transition-all h-full min-h-[120px]"
                    >
                      <Upload className="h-5 w-5 text-zinc-400 mb-1.5" />
                      <p className="font-sans text-xs font-semibold text-zinc-800 dark:text-zinc-300">
                        {fileName ? `업로드됨: ${fileName}` : '이미지 또는 PDF 파일 업로드'}
                      </p>
                      <p className="font-mono text-[9px] text-zinc-400 mt-0.5">
                        최대 50MB 이미지 & PDF 파일 지원 (초고화질 및 자동압축 최적화)
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        onClick={(e) => e.stopPropagation()}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Thumbnail Preview Panel */}
                  <div className="sm:col-span-1">
                    <div className="border border-zinc-200 dark:border-zinc-800/80 rounded-xl aspect-[4/3] sm:aspect-auto sm:h-full p-1 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                      {imageUrl ? (
                        <div className="relative w-full h-full rounded-lg overflow-hidden group">
                          {isPdfFile(imageUrl) ? (
                            <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-center p-4">
                              <FileText className="h-9 w-9 text-zinc-400 mb-1" />
                              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 text-center truncate w-full px-2" title={fileName || 'PDF Document'}>
                                {fileName || 'PDF 문서'}
                              </span>
                            </div>
                          ) : (
                            <img
                              src={imageUrl}
                              alt="등록 미리보기"
                              className="w-full h-full object-cover"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setImageUrl('');
                              setFileName('');
                            }}
                            className="absolute top-1 right-1 bg-zinc-950/80 hover:bg-zinc-900 text-white rounded-full p-1 cursor-pointer transition"
                            title="삭제"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-450 dark:text-zinc-600">
                          <Image className="h-6 w-6 opacity-40 mb-1" />
                          <span className="text-[10px] font-mono uppercase tracking-wider select-none">No Preview</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preset List option block */}
                <div className="space-y-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                    또는 클래식 디자인 프리셋에서 고르기:
                  </span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {PRESET_IMAGES.map((preset) => {
                      const isSelected = imageUrl === preset.url;
                      return (
                        <button
                          type="button"
                          key={preset.url}
                          onClick={() => {
                            setImageUrl(preset.url);
                            setFileName('');
                          }}
                          className={`group relative flex flex-col overflow-hidden rounded-lg aspect-[10/7] border-2 text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'border-zinc-900 dark:border-white ring-2 ring-zinc-100 dark:ring-zinc-900'
                              : 'border-transparent opacity-80 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950/80 to-transparent p-1 pt-3">
                            <p className="font-sans text-[9px] text-white truncate font-medium">
                              {preset.name}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
                              <Check className="h-2 w-2" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cover URL Input (Optional helper) */}
                <div className="relative mt-2.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Image className="h-3.5 w-3.5 text-zinc-400" />
                  </div>
                  <input
                    type="url"
                    value={imageUrl.startsWith('data:') ? '' : imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setFileName('');
                    }}
                    placeholder="또는 사용자 정의 이미지 웹 URL 주소를 수동 기입하세요"
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-9 pr-3 text-xs text-zinc-800 focus:border-zinc-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:bg-zinc-950 transition-colors"
                  />
                </div>
              </div>

              {/* Summary Description */}
              <div>
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  요약 설명 *
                </label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="카드의 메인 화면에 간략히 노출될 핵심 요약 문장을 입력해 주세요."
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 focus:border-zinc-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:bg-zinc-950 transition-colors resize-none"
                />
              </div>

              {/* Used Fonts and Color Codes fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    사용한 폰트
                  </label>
                  <input
                    type="text"
                    value={usedFonts}
                    onChange={(e) => setUsedFonts(e.target.value)}
                    placeholder="예: Inter, Space Grotesk, Playfair Display"
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 focus:border-zinc-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:bg-zinc-950 transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    컬러코드 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    placeholder="예: #000000, #FFFFFF, #E4E4E7"
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 focus:border-zinc-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:bg-zinc-950 transition-colors"
                  />
                </div>
              </div>

              {/* Tag / Date */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    태그 목록 (쉼표로 구분)
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Tag className="h-3.5 w-3.5 text-zinc-400" />
                    </div>
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="Minimal, Braun, Retro"
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-9 pr-3 text-sm text-zinc-800 focus:border-zinc-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:bg-zinc-950 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    기록 날짜 *
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                    </div>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-9 pr-3 text-sm text-zinc-800 focus:border-zinc-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:bg-zinc-950 transition-colors cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Creator / Location */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    작성자/제작자 (선택)
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-3.5 w-3.5 text-zinc-400" />
                    </div>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="예: Studio Mono"
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-9 pr-3 text-sm text-zinc-800 focus:border-zinc-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:bg-zinc-950 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    기록 위도/지역 (선택)
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                    </div>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="예: Seoul, Korea"
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-9 pr-3 text-sm text-zinc-800 focus:border-zinc-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:bg-zinc-950 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-900 pt-5 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-4.5 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-md cursor-pointer transition-all"
                >
                  영구 아카이브 등록하기
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
