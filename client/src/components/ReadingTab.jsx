import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, ArrowRight, Eye, EyeOff, BookOpen, Sparkles, HelpCircle } from 'lucide-react';
import { speechService } from '../utils/speech';
import WordTooltip from './WordTooltip';

export default function ReadingTab({
  lesson,
  savedWords = [],
  onToggleVocab,
  onGoToListening,
  onAudioPlay
}) {
  const [activeWord, setActiveWord] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [showFullTranslation, setShowFullTranslation] = useState(false);
  const [isPlayingFull, setIsPlayingFull] = useState(false);
  const [readingSentenceIndex, setReadingSentenceIndex] = useState(null);

  const containerRef = useRef(null);

  useEffect(() => {
    // Reset reading state on lesson change
    setIsPlayingFull(false);
    setReadingSentenceIndex(null);
    speechService.stop();
  }, [lesson]);

  if (!lesson) {
    return (
      <div className="text-center py-20 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl">
        <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-slate-300">Nenhuma lição carregada</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
          Digite um assunto acima ou selecione um tema rápido para gerar sua aula personalizada com IA!
        </p>
      </div>
    );
  }

  // Handle word hover/click
  const handleWordInteraction = (e, wordObj, sentence) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      top: rect.top - 6,
      left: rect.left + rect.width / 2
    });

    setActiveWord({
      ...wordObj,
      sentenceText: sentence.text
    });
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveWord(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Play full text continuously sentence by sentence
  const handleTogglePlayFull = () => {
    if (isPlayingFull) {
      speechService.stop();
      setIsPlayingFull(false);
      setReadingSentenceIndex(null);
      return;
    }

    setIsPlayingFull(true);
    let currentIdx = 0;

    const playNext = () => {
      if (currentIdx >= (lesson.sentences || []).length) {
        setIsPlayingFull(false);
        setReadingSentenceIndex(null);
        return;
      }

      setReadingSentenceIndex(currentIdx);
      const sentence = lesson.sentences[currentIdx];
      if (onAudioPlay) {
        onAudioPlay('full_text', sentence.text);
      }
      speechService.speak(sentence.text, () => {
        currentIdx++;
        // short delay between sentences
        setTimeout(playNext, 400);
      });
    };

    playNext();
  };

  const isWordSaved = (word) => {
    if (!word) return false;
    const clean = word.toLowerCase().trim();
    return savedWords.some(w => (w.word || '').toLowerCase().trim() === clean);
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Lesson Title & Top Actions Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Nível {lesson.level}
              </span>
              <span className="text-xs text-slate-400">Tema: {lesson.topic}</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{lesson.title}</h2>
            {lesson.titlePt && (
              <p className="text-sm text-slate-400">{lesson.titlePt}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePlayFull}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shadow cursor-pointer ${
                isPlayingFull
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {isPlayingFull ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>Parar Leitura</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Ouvir Texto Completo</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowFullTranslation(!showFullTranslation)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              {showFullTranslation ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ocultar Tradução</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ver Tradução</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Translation Banner (Accordion) */}
        {showFullTranslation && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 text-sm leading-relaxed animate-in fade-in duration-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block mb-1">
              Tradução Completa:
            </span>
            {lesson.fullTranslation}
          </div>
        )}

        {/* Interactive Text Sentences */}
        <div className="mt-6 space-y-4">
          <div className="text-xs uppercase font-bold tracking-wider text-slate-500 flex items-center justify-between">
            <span>Texto com Interação Palavra por Palavra (Passe o mouse ou toque para traduzir):</span>
          </div>

          <div className="space-y-3">
            {(lesson.sentences || []).map((sentence, sIdx) => {
              const isSentenceReading = readingSentenceIndex === sIdx;
              return (
                <div
                  key={sIdx}
                  className={`p-3.5 rounded-xl transition-all duration-200 border ${
                    isSentenceReading
                      ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono font-bold text-slate-500 mt-1 select-none">
                      {sIdx + 1}.
                    </span>

                    <div className="flex-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                      {(sentence.words || []).map((wordObj, wIdx) => {
                        const saved = isWordSaved(wordObj.word);
                        return (
                          <span
                            key={wIdx}
                            onClick={(e) => handleWordInteraction(e, wordObj, sentence)}
                            onMouseEnter={(e) => handleWordInteraction(e, wordObj, sentence)}
                            className={`cursor-pointer px-1 py-0.5 rounded transition-all text-base select-none ${
                              saved
                                ? 'bg-amber-500/20 text-amber-200 font-medium underline decoration-amber-500/40'
                                : 'text-slate-100 hover:bg-indigo-600/30 hover:text-indigo-200'
                            }`}
                          >
                            {wordObj.word}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Key Expressions & Vocabulary Highlight */}
      {(lesson.keyExpressions || []).length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg text-white">Expressões-Chave do Texto</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lesson.keyExpressions.map((expr, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-indigo-300 text-sm">
                    {expr.expression}
                  </span>
                  <button
                    onClick={() => {
                      if (onAudioPlay) onAudioPlay('word_tooltip', expr.expression);
                      speechService.speak(expr.expression);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-indigo-300 transition cursor-pointer"
                    title="Ouvir expressão"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 mb-2">{expr.meaning}</p>
                {expr.example && (
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 italic">
                    "{expr.example}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action to go to Listening Tab */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onGoToListening}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold shadow-lg shadow-indigo-600/25 transition cursor-pointer"
        >
          <span>Ir para o Treino de Listening e Ditado</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Word Tooltip Popover */}
      {activeWord && (
        <WordTooltip
          wordData={activeWord}
          position={tooltipPos}
          onClose={() => setActiveWord(null)}
          onToggleVocab={onToggleVocab}
          isSaved={isWordSaved(activeWord.word)}
          onAudioPlay={onAudioPlay}
        />
      )}
    </div>
  );
}
