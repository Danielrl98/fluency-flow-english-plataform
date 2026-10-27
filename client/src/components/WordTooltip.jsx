import React from 'react';
import { Volume2, Bookmark, BookmarkCheck, X } from 'lucide-react';
import { speechService } from '../utils/speech';

export default function WordTooltip({
  wordData,
  position,
  onClose,
  onToggleVocab,
  isSaved,
  onAudioPlay
}) {
  if (!wordData) return null;

  // Viewport bounds calculation to prevent tooltip going off-screen
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 360;
  const isNearTop = position.top < 140;

  // Clamp horizontal center so tooltip stays comfortably within screen bounds
  const tooltipWidth = Math.min(256, viewportWidth - 24);
  const clampedLeft = Math.max(
    tooltipWidth / 2 + 12,
    Math.min(viewportWidth - tooltipWidth / 2 - 12, position.left)
  );

  // Arrow offset relative to tooltip center
  const arrowOffset = position.left - clampedLeft;

  const handleSpeak = (e) => {
    e.stopPropagation();
    if (onAudioPlay) {
      onAudioPlay('word_tooltip', wordData.word);
    }
    speechService.speak(wordData.word);
  };

  const handleSave = (e) => {
    e.stopPropagation();
    onToggleVocab(wordData);
  };

  return (
    <div
      style={{
        top: isNearTop ? `${position.top + 28}px` : `${position.top - 8}px`,
        left: `${clampedLeft}px`,
        width: `${tooltipWidth}px`
      }}
      className={`fixed z-50 -translate-x-1/2 bg-slate-900 border border-indigo-500/50 rounded-xl p-3 shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-150 ${
        isNearTop ? '' : '-translate-y-full'
      }`}
    >
      {/* Arrow indicator pointing to the clicked word */}
      <div
        style={{ transform: `translateX(${arrowOffset}px) rotate(45deg)` }}
        className={`absolute left-1/2 w-3 h-3 bg-slate-900 border-indigo-500/50 ${
          isNearTop
            ? '-top-1.5 border-t border-l'
            : '-bottom-1.5 border-r border-b'
        }`}
      />

      {/* Header of tooltip */}
      <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800 relative z-10">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-base text-white">{wordData.word}</span>
            <button
              onClick={handleSpeak}
              className="p-1 rounded-md text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/20 transition cursor-pointer"
              title="Ouvir pronúncia"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          {wordData.phonetic && (
            <span className="text-[11px] font-mono text-indigo-300 block">
              {wordData.phonetic}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              isSaved
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
            }`}
            title={isSaved ? 'Salvo no Vocabulário' : 'Salvar no Vocabulário'}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4 text-amber-400" /> : <Bookmark className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Translation in Portuguese */}
      <div className="pt-2 relative z-10">
        <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
          Tradução no contexto:
        </span>
        <p className="text-sm font-medium text-emerald-400">
          {wordData.translation || 'Sem tradução'}
        </p>
      </div>
    </div>
  );
}