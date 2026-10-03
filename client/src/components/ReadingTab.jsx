import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, ArrowRight, Eye, EyeOff, BookOpen, Sparkles, HelpCircle } from 'lucide-react';
import { speechService } from '../utils/speech';
import WordTooltip from './WordTooltip';

export default function ReadingTab({
  lesson,
  savedWords = [],
  onToggleVocab,
  onGoToListening
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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shadow ${
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              title="Mostrar tradução em português"
            >
              {showFullTranslation ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-indigo-400" />}
              <span>{showFullTranslation ? 'Ocultar Tradução' : 'Ver Tradução'}</span>
            </button>
          </div>
        </div>

        {/* Helpful tip banner */}
        <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-xl bg-indigo-950/40 border border-indigo-900/50 text-indigo-300 text-xs">
          <HelpCircle className="w-4 h-4 shrink-0 text-indigo-400" />
          <span>
            Passe o mouse ou toque em qualquer palavra em inglês para ver a tradução, pronúncia e salvar no vocabulário!
          </span>
        </div>

        {/* Interactive Text Display */}
        <div className="mt-6 space-y-4 text-lg leading-relaxed font-sans">
          {(lesson.sentences || []).map((sentence, sIdx) => {
            const isSentenceReading = readingSentenceIndex === sIdx;

            return (
              <div
                key={sentence.id || sIdx}
                className={`p-3 rounded-xl transition-all ${
                  isSentenceReading
                    ? 'bg-indigo-950/60 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono font-semibold text-slate-500 select-none pt-1">
                    {sIdx + 1}.
                  </span>

                  <div className="flex-1">
                    <p className="text-slate-100 flex flex-wrap gap-x-1.5 gap-y-1 items-baseline">
                      {(sentence.words || []).map((wordObj, wIdx) => {
                        const saved = isWordSaved(wordObj.word);
                        return (
                          <span
                            key={wIdx}
                            onMouseEnter={(e) => handleWordInteraction(e, wordObj, sentence)}
                            onClick={(e) => handleWordInteraction(e, wordObj, sentence)}
                            className={`cursor-pointer rounded px-1 py-0.5 transition-all select-none ${
                              saved
                                ? 'bg-amber-500/20 text-amber-200 border-b-2 border-amber-400'
                                : 'hover:bg-indigo-600/30 hover:text-indigo-200 border-b border-transparent hover:border-indigo-400'
                            }`}
                          >
                            {wordObj.word}
                          </span>
                        );
                      })}
                    </p>

                    {/* Sentence translation if toggled or shown */}
                    {showFullTranslation && (
                      <p className="mt-2 text-sm text-slate-400 italic font-sans border-l-2 border-slate-700 pl-3">
                        {sentence.translation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Portuguese Translation Accordion */}
        {showFullTranslation && lesson.fullTranslation && (
          <div className="mt-6 pt-6 border-t border-slate-800 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
              🇧🇷 Tradução Completa do Texto
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {lesson.fullTranslation}
            </p>
          </div>
        )}
      </div>

      {/* Floating Word Tooltip */}
      {activeWord && (
        <WordTooltip
          wordData={activeWord}
          position={tooltipPos}
          onClose={() => setActiveWord(null)}
          onToggleVocab={onToggleVocab}
          isSaved={isWordSaved(activeWord.word)}
        />
      )}

      {/* Key Expressions & Idioms Section */}
      {lesson.keyExpressions && lesson.keyExpressions.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">
              Expressões-Chave & Vocabulário Destaque
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lesson.keyExpressions.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-base text-indigo-300">
                    {item.expression}
                  </span>
                  <button
                    onClick={() => speechService.speak(item.expression)}
                    className="p-1 rounded text-slate-400 hover:text-indigo-300 transition"
                    title="Ouvir expressão"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm font-medium text-emerald-400 mb-2">
                  {item.meaning}
                </p>
                {item.example && (
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs">
                    <p className="text-slate-200 italic mb-1 font-serif">
                      "{item.example}"
                    </p>
                    {item.examplePt && (
                      <p className="text-slate-400">{item.examplePt}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call to Action: Proceed to Listening Practice */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-bold text-white mb-1">
            Pronto para testar seu ouvido?
          </h4>
          <p className="text-xs text-slate-400">
            Avance para a Aba de Listening: ouça o áudio fatiado frase por frase e digite o que escutar!
          </p>
        </div>
        <button
          onClick={onGoToListening}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition cursor-pointer"
        >
          <span>Ir para o Listening</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
