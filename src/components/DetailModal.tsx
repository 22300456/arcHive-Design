import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, User, MapPin, Copy, Check, Trash2, ArrowUpRight, FileText, Download } from 'lucide-react';
import { ArchiveItem } from '../types';

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
}

export default function DetailModal({
  item,
  onClose,
  onDelete,
  onUpdateItem,
  allArchiveItems,
  onSelectRelated,
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

  if (!item) return null;

  const handleCopyLink = () => {
    const fakeUrl = `${window.location.origin}/archive/${item.id}`;
    navigator.clipboard.writeText(fakeUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
                      <span className="font-mono text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-bold mb-4">
                        등록된 아카이브 사진이나 파일이 없습니다
                      </span>
                      <button
                        onClick={() => {
                          const fileInput = document.createElement('input');
                          fileInput.type = 'file';
                          fileInput.accept = 'image/*,application/pdf';
                          fileInput.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const updated = { ...item, imageUrl: reader.result as string };
                                onUpdateItem?.(updated);
                              };
                              reader.readAsDataURL(file);
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
                      <div className="p-4 bg-zinc-900 dark:bg-zinc-800 rounded-xl border border-zinc-850 dark:border-zinc-750 mb-4 shadow-md">
                        <FileText className="h-12 w-12 text-zinc-300 dark:text-zinc-100" />
                      </div>
                      <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 font-bold mb-1">
                        PDF 아카이브 문서
                      </span>
                      <span className="text-xs text-zinc-500 font-mono mb-6 max-w-[90%] truncate block">
                        {item.title}
                      </span>
                      
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        {/* Action to download/open PDF */}
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

                        {/* File delete action */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('등록된 PDF 아카이브 문서를 정말로 삭제할까요?')) {
                              onUpdateItem?.({ ...item, imageUrl: '' });
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 px-5 py-2.5 text-xs font-bold transition-all border border-rose-100 dark:border-rose-950/60 cursor-pointer shadow-xs"
                        >
                          <span>PDF 임포트 해제</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-auto min-h-[300px] flex items-center justify-center group/img">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-auto object-contain max-h-[520px] sm:max-h-[600px] pointer-events-none"
                      />
                      {/* Interactive Delete action overlay */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('등록된 아카이브 사진을 정말로 삭제하시겠습니까?')) {
                              onUpdateItem?.({ ...item, imageUrl: '' });
                            }
                          }}
                          className="flex items-center gap-1.5 rounded-full bg-zinc-950/85 hover:bg-rose-600 dark:bg-zinc-900/90 dark:hover:bg-rose-950 text-white dark:text-zinc-100 py-1.5 px-3.5 text-xs font-semibold cursor-pointer transition-all shadow-md"
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/10 rounded-xl p-4 border border-zinc-200/40 dark:border-zinc-850">
                  <div className="flex flex-col gap-0.5 sm:border-r border-zinc-200/60 dark:border-zinc-800/80 pr-2">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-bold flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 opacity-60" /> 기록 일자
                    </span>
                    <strong className="text-zinc-850 dark:text-zinc-200 text-sm font-semibold">{item.date}</strong>
                  </div>
                  {item.author && (
                    <div className="flex flex-col gap-0.5 sm:border-r border-zinc-200/60 dark:border-zinc-800/80 pr-2">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-bold flex items-center gap-1">
                        <User className="h-3.5 w-3.5 opacity-60" /> 기록 작가
                      </span>
                      <strong className="text-zinc-850 dark:text-zinc-200 text-sm font-semibold">{item.author}</strong>
                    </div>
                  )}
                  {item.location && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-bold flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 opacity-60" /> 보관 공간
                      </span>
                      <strong className="text-zinc-850 dark:text-zinc-200 text-sm font-semibold truncate" title={item.location}>{item.location}</strong>
                    </div>
                  )}
                </div>

                {/* 4. Sequential Narrative Sections */}
                <div className="space-y-6">
                  {/* Detailed Description */}
                  <div className="space-y-2">
                    <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold">
                      감상 및 개요 설명
                    </span>
                    <p className="font-sans text-base leading-relaxed text-zinc-850 dark:text-zinc-200 text-justify whitespace-pre-line font-medium">
                      {item.description}
                    </p>
                  </div>

                  {/* Behind Story Content */}
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
                                className="font-sans text-xs font-semibold px-2.5 py-1 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-850 text-zinc-800 dark:text-zinc-200 rounded-md shadow-xs select-all"
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
                                  className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-850 rounded-md shadow-xs"
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
                        className="rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1 font-mono text-[10px] text-zinc-605 dark:text-zinc-400"
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
                          <div className="h-11 w-11 rounded-md bg-zinc-950 dark:bg-zinc-900 border border-zinc-805 dark:border-zinc-800 flex items-center justify-center flex-shrink-0">
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
                          <p className="truncate text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white">
                            {relItem.title}
                          </p>
                          <span className="inline-flex items-center gap-1 mt-0.5 font-mono text-[9px] text-zinc-400 dark:text-zinc-500">
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
