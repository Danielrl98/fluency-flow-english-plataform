import React, { useState } from 'react';
import { X, Volume2, Trash2, Search, Sparkles, RotateCw, ArrowRight, ArrowLeft } from 'lucide-react';
import { speechService } from '../utils/speech';

export default function VocabularyModal({
  isOpen,
  onClose,
  vocabulary = [],
  onDeleteWord
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [mode, setMode] = useState('list'); // 'list' | 'flashcards'
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!isOpen) return null;

  const filteredWords = vocabulary.filter(w =>
    (w.word || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.translation || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentFlashcard = filteredWords[flashcardIndex];

  const handleNextFlashcard = () => {
    setIsFlipped(false);
    setFlashcardIndex(prev => (prev + 1) % filteredWords.length);
  };

  const handlePrevFlashcard = () => {
    setIsFlipped(false);
    setFlashcardIndex(prev => (prev - 1 + filteredWords.length) % filteredWords.length);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-4 px-4 sm:px-6 border-b border-slate-800 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">Meu Banco de Vocabulário</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {vocabulary.length} {vocabulary.length === 1 ? 'palavra salva' : 'palavras salvas'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Mode switch */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
              <button
                onClick={() => setMode('list')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  mode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Lista
              </button>
              <button
                onClick={() => {
                  setMode('flashcards');
                  setFlashcardIndex(0);
                  setIsFlipped(false);
                }}
                disabled={filteredWords.length === 0}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition disabled:opacity-40 cursor-pointer ${
                  mode === 'flashcards' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Flashcards
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode: List */}
        {mode === 'list' && (
          <>
            {/* Search filter */}
            <div className="p-3 sm:p-4 px-4 sm:px-6 border-b border-slate-800 bg-slate-950/40">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filtrar por palavra ou tradução..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            {/* Words list */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 px-4 sm:px-6 space-y-2">
              {filteredWords.length === 0 ? (
                <div className="text-center py-12 sm:py-16 text-slate-500 text-xs sm:text-sm">
                  {vocabulary.length === 0
                    ? 'Nenhuma palavra salva ainda. Na aba de Leitura, toque no marcador para salvar!'
                    : 'Nenhuma palavra encontrada para o filtro.'}
                </div>
              ) : (
                filteredWords.map((item) => (
                  <div
                    key={item.id || item.word}
                    className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl flex items-center justify-between gap-2.5 hover:border-slate-700 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{item.word}</span>
                        {item.phonetic && (
                          <span className="text-[11px] font-mono text-indigo-400">{item.phonetic}</span>
                        )}
                        <button
                          onClick={() => speechService.speak(item.word)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-300 transition cursor-pointer"
                          title="Ouvir"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-emerald-400 font-medium mt-0.5">
                        {item.translation}
                      </p>
                    </div>

                    <button
                      onClick={() => onDeleteWord(item.word)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer shrink-0"
                      title="Remover do vocabulário"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Mode: Flashcards */}
        {mode === 'flashcards' && (
          <div className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-center overflow-y-auto">
            {filteredWords.length === 0 ? (
              <div className="text-center text-slate-500 text-xs sm:text-sm">
                Adicione palavras ao vocabulário para usar o modo Flashcards!
              </div>
            ) : (
              <div className="w-full max-w-md space-y-4 sm:space-y-6">
                <div className="text-center text-xs text-slate-400">
                  Card {flashcardIndex + 1} de {filteredWords.length}
                </div>

                {/* Flip Card Container */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="w-full h-52 sm:h-64 bg-slate-950 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center cursor-pointer shadow-xl hover:border-indigo-500/60 transition-all select-none relative"
                >
                  <span className="text-[10px] uppercase font-bold text-slate-500 absolute top-3.5 left-3.5">
                    {isFlipped ? 'Tradução (Costas)' : 'Em Inglês (Frente)'}
                  </span>

                  {!isFlipped ? (
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                        {currentFlashcard.word}
                      </h3>
                      {currentFlashcard.phonetic && (
                        <p className="text-xs sm:text-sm font-mono text-indigo-400">
                          {currentFlashcard.phonetic}
                        </p>
                      )}
                      <p className="text-[11px] sm:text-xs text-slate-500 pt-3 flex items-center justify-center gap-1">
                        <RotateCw className="w-3.5 h-3.5" />
                        Toque para virar e ver a tradução
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-in fade-in">
                      <h4 className="text-xl sm:text-2xl font-bold text-emerald-400">
                        {currentFlashcard.translation}
                      </h4>
                      <div className="pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speechService.speak(currentFlashcard.word);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/30 text-indigo-300 text-xs font-medium hover:bg-indigo-600/50 transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Ouvir "{currentFlashcard.word}"</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={handlePrevFlashcard}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Anterior</span>
                  </button>
                  <button
                    onClick={handleNextFlashcard}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1 transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                  >
                    <span>Próximo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-3 px-4 sm:px-6 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}