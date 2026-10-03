import React from 'react';
import { Volume2, Bookmark, BookmarkCheck, X } from 'lucide-react';
import { speechService } from '../utils/speech';

export default function WordTooltip({
  wordData,
  position,
  onClose,
  onToggleVocab,
  isSaved
}) {
  if (!wordData) return null;

  const handleSpeak = (e) => {
    e.stopPropagation();
    speechService.speak(wordData.word);
  };

  const handleSave = (e) => {
    e.stopPropagation();
    onToggleVocab(wordData);
  };

  return (
    <div
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      className="fixed z-50 -translate-x-1/2 -translate-y-full mb-3 w-64 bg-slate-900 border border-indigo-500/40 rounded-xl p-3 shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Little arrow indicator at bottom */}
      <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-indigo-500/40 rotate-45" />

      {/* Header of tooltip */}
      <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base text-white">{wordData.word}</span>
            <button
              onClick={handleSpeak}
              className="p-1 rounded-md text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/20 transition"
              title="Ouvir pronúncia"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {wordData.phonetic && (
            <span className="text-[11px] font-mono text-indigo-300">
              {wordData.phonetic}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            className={`p-1.5 rounded-lg border transition ${
              isSaved
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
            }`}
            title={isSaved ? 'Salvo no Vocabulário' : 'Salvar no Vocabulário'}
          >
            {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-slate-300 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Translation in Portuguese */}
      <div className="pt-2">
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
