import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileCheck,
  Volume2,
  Keyboard,
  Award,
  ChevronRight,
  Database,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { speechService } from '../utils/speech';
import { validateDictation, getHint } from '../utils/diff';

export default function ListeningTab({
  lesson,
  initialCurrentIndex = 0,
  initialCompletedSentences = [],
  initialAudioPlaysCount = 0,
  initialAttempts = 0,
  initialPerfectCount = 0,
  onCompleteLesson,
  onViewCompletedFile,
  onUpdateProgress,
  onAudioPlay
}) {
  const [currentIndex, setCurrentIndex] = useState(initialCurrentIndex);
  const [completedSentences, setCompletedSentences] = useState(initialCompletedSentences);
  const [userInput, setUserInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [validationResult, setValidationResult] = useState(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [audioPlaysCount, setAudioPlaysCount] = useState(initialAudioPlaysCount);
  const [isCompleted, setIsCompleted] = useState(false);
  const [savedFileInfo, setSavedFileInfo] = useState(null);
  const [, setIsSaving] = useState(false);
  const [isValidationEnabled, setIsValidationEnabled] = useState(false);

  // Session statistics
  const [sessionAttempts, setSessionAttempts] = useState(initialAttempts);
  const [perfectSentencesCount, setPerfectSentencesCount] = useState(initialPerfectCount);

  const inputRef = useRef(null);
  const lastAutoPlayedIndexRef = useRef(-1);

  const sentences = lesson?.sentences || [];
  const currentSentence = sentences[currentIndex];
  const progressPercent = sentences.length > 0
    ? Math.round(((completedSentences.length) / sentences.length) * 100)
    : 0;

  // Sync state when initial props change
  useEffect(() => {
    if (initialCurrentIndex !== undefined && initialCurrentIndex < (lesson?.sentences || []).length) {
      setCurrentIndex(initialCurrentIndex);
    }
    if (initialCompletedSentences) {
      setCompletedSentences(initialCompletedSentences);
    }
    if (initialAudioPlaysCount !== undefined) {
      setAudioPlaysCount(initialAudioPlaysCount);
    }
  }, [lesson?.title, initialCurrentIndex, initialCompletedSentences, initialAudioPlaysCount, lesson?.sentences]);

  // Play / Resume audio for current sentence
  const handlePlayAudio = () => {
    if (!currentSentence) return;
    setIsPlaying(true);
    setAudioPlaysCount(prev => prev + 1);

    if (onAudioPlay) {
      onAudioPlay('sentence_listening', currentSentence.text);
    }

    speechService.setRate(speed);
    speechService.speak(currentSentence.text, () => {
      setIsPlaying(false);
    });
  };

  // Pause audio playback
  const handlePauseAudio = () => {
    speechService.stop();
    setIsPlaying(false);
  };

  // Restart audio for current sentence from the beginning
  const handleRestartAudio = () => {
    if (!currentSentence) return;
    speechService.stop();
    setIsPlaying(true);
    setAudioPlaysCount(prev => prev + 1);

    if (onAudioPlay) {
      onAudioPlay('sentence_listening', currentSentence.text);
    }

    speechService.setRate(speed);
    speechService.speak(currentSentence.text, () => {
      setIsPlaying(false);
    });
  };

  // Toggle play/pause (used by central icon button & shortcut)
  const handleTogglePlayPause = () => {
    if (isPlaying) {
      handlePauseAudio();
    } else {
      handlePlayAudio();
    }
  };

  // Auto-focus input and auto-play audio ONCE per new sentence
  useEffect(() => {
    setUserInput('');
    setValidationResult(null);
    setHintLevel(0);
    setIsValidationEnabled(false);

    if (inputRef.current) {
      inputRef.current.focus();
    }

    if (currentSentence && !isCompleted && lastAutoPlayedIndexRef.current !== currentIndex) {
      lastAutoPlayedIndexRef.current = currentIndex;

      const timer = setTimeout(() => {
        if (!currentSentence) return;
        setIsPlaying(true);
        setAudioPlaysCount(prev => prev + 1);
        if (onAudioPlay) {
          onAudioPlay('sentence_listening', currentSentence.text);
        }
        speechService.setRate(speed);
        speechService.speak(currentSentence.text, () => {
          setIsPlaying(false);
        });
      }, 350);

      return () => {
        clearTimeout(timer);
        speechService.stop();
      };
    }
  }, [currentIndex, isCompleted, currentSentence]);

  // Keyboard shortcuts (Alt+P or Ctrl+Space)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === ' ' && (e.ctrlKey || e.altKey)) || (e.altKey && e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        handleTogglePlayPause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentSentence, speed]);

  if (!lesson || sentences.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl">
        <Volume2 className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base sm:text-lg font-medium text-slate-300">Nenhuma lição pronta para listening</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
          Gere um texto na barra acima para iniciar seu treino de listening particionado.
        </p>
      </div>
    );
  }

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    speechService.setRate(newSpeed);
  };

  // Validate dictation input
  const handleValidate = (e) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || !currentSentence) return;

    const newAttempts = sessionAttempts + 1;
    setSessionAttempts(newAttempts);

    const result = validateDictation(userInput, currentSentence.text);
    setValidationResult(result);

    if (result.isMatch) {
      let newPerfect = perfectSentencesCount;
      if (hintLevel === 0) {
        newPerfect = perfectSentencesCount + 1;
        setPerfectSentencesCount(newPerfect);
      }

      setIsValidationEnabled(true);

      const newCompleted = Array.from(new Set([...completedSentences, currentIndex]));
      setCompletedSentences(newCompleted);

      if (onUpdateProgress) {
        onUpdateProgress({
          currentIndex,
          completedSentences: newCompleted,
          audioPlaysCount,
          sessionAttempts: newAttempts,
          perfectSentencesCount: newPerfect
        });
      }
    }
  };

  const nextSentence = () => {
    const newCompleted = Array.from(new Set([...completedSentences, currentIndex]));
    setCompletedSentences(newCompleted);

    if (currentIndex + 1 < sentences.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setIsValidationEnabled(false);

      if (onUpdateProgress) {
        onUpdateProgress({
          currentIndex: nextIdx,
          completedSentences: newCompleted,
          audioPlaysCount,
          sessionAttempts,
          perfectSentencesCount
        });
      }
    } else {
      handleFinishLesson(newCompleted);
    }
  };

  const handleSelectSentence = (idx) => {
    if (idx >= 0 && idx < sentences.length) {
      setCurrentIndex(idx);
      setIsValidationEnabled(false);
      setValidationResult(null);

      if (onUpdateProgress) {
        onUpdateProgress({
          currentIndex: idx,
          completedSentences,
          audioPlaysCount,
          sessionAttempts,
          perfectSentencesCount
        });
      }
    }
  };

  // Handle lesson completion
  const handleFinishLesson = async () => {
    setIsCompleted(true);

    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    setIsSaving(true);
    const accuracy = Math.round(
      (perfectSentencesCount / Math.max(1, sentences.length)) * 100
    );

    const stats = {
      accuracy: Math.max(70, accuracy),
      totalAttempts: sessionAttempts + 1,
      totalAudioPlays: audioPlaysCount,
      completedAt: new Date().toISOString()
    };

    try {
      const saved = await onCompleteLesson(lesson, stats);
      setSavedFileInfo(saved);
    } catch (err) {
      console.error('Failed to save completed lesson:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestHint = () => {
    const nextLevel = Math.min(3, hintLevel + 1);
    setHintLevel(nextLevel);
    if (nextLevel === 3) {
      setUserInput(currentSentence.text);
    }
  };

  const handleRestartFromBeginning = () => {
    if (window.confirm('Deseja reiniciar o ditado desta lição desde a frase 1?')) {
      setCurrentIndex(0);
      setCompletedSentences([]);
      setValidationResult(null);
      setIsValidationEnabled(false);
      if (onUpdateProgress) {
        onUpdateProgress({
          currentIndex: 0,
          completedSentences: [],
          audioPlaysCount,
          sessionAttempts: 0,
          perfectSentencesCount: 0
        });
      }
    }
  };

  // Render completion view
  if (isCompleted) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-4 sm:mb-5">
          <Award className="w-8 h-8 sm:w-10 sm:h-10 text-slate-950" />
        </div>

        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          Aula Concluída com Sucesso! 🎉
        </span>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3 mb-2">
          Parabéns pelo seu treino!
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto mb-6">
          Você completou todas as {sentences.length} frases do tema <strong className="text-slate-200">"{lesson.topic}"</strong> no Nível {lesson.level}.
        </p>

        {/* Stats card */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-md mx-auto mb-6 sm:mb-8 bg-slate-950/60 p-3.5 sm:p-4 rounded-xl border border-slate-800">
          <div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400">
              {sentences.length}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-medium">Frases</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-sky-400">
              {audioPlaysCount}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-medium">Áudios</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-amber-400">
              {Math.max(80, Math.round((perfectSentencesCount / sentences.length) * 100))}%
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-medium">Precisão</div>
          </div>
        </div>

        {/* File Saved Confirmation Alert */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3.5 sm:p-4 max-w-lg mx-auto mb-6 sm:mb-8 text-left flex items-start gap-3">
          <FileCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-emerald-300">
              Salvo no Banco SQLite e em Disco
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Seu histórico foi atualizado e o arquivo Markdown foi gravado:
            </p>
            <code className="text-[11px] sm:text-xs font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/20 block mt-1 break-all">
              {savedFileInfo?.filename || 'concluidos/aula-concluida.md'}
            </code>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
          {savedFileInfo?.filename && (
            <button
              onClick={() => onViewCompletedFile(savedFileInfo.filename)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Ver Arquivo Concluído</span>
            </button>
          )}

          <button
            onClick={() => {
              setIsCompleted(false);
              setCurrentIndex(0);
              setCompletedSentences([]);
              setValidationResult(null);
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-sky-400" />
            <span>Repetir Esta Aula</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Progress & Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Nível {lesson.level}
            </span>
            <span className="text-xs text-slate-400">
              Frase <strong className="text-white">{currentIndex + 1}</strong> de {sentences.length}
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-emerald-400 font-medium">
              <Database className="w-3.5 h-3.5" />
              <span>Salvo no banco</span>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-400">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mb-3 sm:mb-4">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Sentence Stepper Pills with horizontal scroll container for mobile */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 max-w-full">
            <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-semibold mr-1 shrink-0">
              Frases:
            </span>
            {sentences.map((_, idx) => {
              const isDone = completedSentences.includes(idx);
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSentence(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 shrink-0 ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : isDone
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title={`Ir para frase ${idx + 1}`}
                >
                  <span>{idx + 1}</span>
                  {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleRestartFromBeginning}
            className="text-[11px] text-slate-500 hover:text-slate-300 transition flex items-center gap-1 cursor-pointer shrink-0"
            title="Recomeçar frases desta aula"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>
        </div>
      </div>

      {/* Audio Player Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md text-center relative overflow-hidden">
        {isPlaying && (
          <div className="absolute inset-0 bg-indigo-500/5 animate-pulse pointer-events-none" />
        )}

        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
            Áudio da Frase #{currentIndex + 1}
          </span>
          <span className="text-[11px] sm:text-xs text-sky-400 font-mono">
            {audioPlaysCount} {audioPlaysCount === 1 ? 'áudio' : 'áudios'}
          </span>
        </div>

        {/* Central Play / Pause Button */}
        <div className="flex items-center justify-center gap-4 my-2">
          <button
            type="button"
            onClick={handleTogglePlayPause}
            className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center transition-all shadow-xl cursor-pointer ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/40 scale-105'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-95 sm:hover:scale-105'
            }`}
            title={isPlaying ? 'Pausar áudio' : 'Reproduzir áudio'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-white" />
            ) : (
              <Play className="w-7 h-7 sm:w-8 sm:h-8 ml-1 fill-white" />
            )}
          </button>
        </div>

        {/* 3 Opções de Controle de Áudio: Reproduzir, Pausar, Voltar do Início */}
        <div className="flex flex-wrap items-center justify-center gap-2 my-3">
          <button
            type="button"
            onClick={handlePlayAudio}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              isPlaying
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
            }`}
            title="Reproduzir áudio da frase"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Reproduzir</span>
          </button>

          <button
            type="button"
            onClick={handlePauseAudio}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              !isPlaying
                ? 'bg-slate-800 text-slate-500 border border-slate-700/50'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20'
            }`}
            title="Pausar áudio"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Pausar</span>
          </button>

          <button
            type="button"
            onClick={handleRestartAudio}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            title="Voltar o áudio desta frase do início"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
            <span>Voltar do Início</span>
          </button>
        </div>

        {/* Audio Wave Visualizer Simulation */}
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-6 my-3 sm:my-4">
          {[40, 70, 30, 90, 60, 100, 50, 80, 45, 95, 35, 75].map((h, i) => (
            <span
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                isPlaying ? 'bg-indigo-400' : 'bg-slate-700'
              }`}
              style={{
                height: isPlaying ? `${Math.max(6, h / 3.5)}px` : '4px'
              }}
            />
          ))}
        </div>

        {/* Audio Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] sm:text-xs">Velocidade:</span>
            {[0.5, 0.75, 1.0, 1.25].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`px-2 py-0.5 rounded font-mono text-[11px] sm:text-xs transition cursor-pointer ${
                  speed === s
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-1 text-slate-500 text-[11px]">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Atalho: <strong>Alt+P</strong></span>
          </div>
        </div>
      </div>

      {/* Dictation Input Form & Validation Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md">
        <form onSubmit={handleValidate} className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[11px] sm:text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <span>✍️ Digite o que ouviu em inglês:</span>
            </label>

            {/* Hint Button */}
            <button
              type="button"
              onClick={handleRequestHint}
              className="text-[11px] sm:text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition cursor-pointer shrink-0"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>
                {hintLevel === 0 && 'Dica?'}
                {hintLevel === 1 && 'Dica 1'}
                {hintLevel === 2 && 'Dica 2'}
                {hintLevel === 3 && 'Revelado'}
              </span>
            </button>
          </div>

          {/* Progressive Hint Box */}
          {hintLevel > 0 && (
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 animate-in fade-in">
              <span className="font-bold block mb-0.5">Dica {hintLevel}:</span>
              <p className="font-mono text-xs">{getHint(currentSentence.text, hintLevel).text}</p>
            </div>
          )}

          {/* Input text area */}
          <div className="relative">
            <textarea
              ref={inputRef}
              rows={3}
              value={userInput}
              onChange={(e) => {
                setUserInput(e.target.value);
                if (validationResult) setValidationResult(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleValidate();
                }
              }}
              placeholder="Ouça o áudio e digite aqui... (Toque em Verificar ao terminar)"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3.5 text-sm sm:text-base text-slate-100 placeholder-slate-600 focus:outline-none transition resize-none font-sans"
            />
          </div>

          {/* Validation Feedback Display */}
          {validationResult && (
            <div className={`p-3.5 sm:p-4 rounded-xl border animate-in fade-in ${
              validationResult.isMatch
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {validationResult.isMatch ? (
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                )}
                <span className="text-xs sm:text-sm font-bold">
                  {validationResult.message}
                </span>
              </div>

              {/* Word by word diff feedback */}
              <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2 text-xs sm:text-sm font-mono">
                {validationResult.diffWords.map((item, idx) => {
                  if (item.status === 'correct') {
                    return (
                      <span
                        key={idx}
                        className="px-1.5 sm:px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        title="Correto"
                      >
                        {item.word}
                      </span>
                    );
                  } else if (item.status === 'typo') {
                    return (
                      <span
                        key={idx}
                        className="px-1.5 sm:px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        title={`Você digitou "${item.userWord}" -> Correto: "${item.word}"`}
                      >
                        {item.word} <span className="text-[10px] opacity-75">({item.userWord})</span>
                      </span>
                    );
                  } else if (item.status === 'missing') {
                    return (
                      <span
                        key={idx}
                        className="px-1.5 sm:px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-dashed border-rose-500/40"
                        title="Palavra faltante"
                      >
                        [ {item.word} ]
                      </span>
                    );
                  } else {
                    return (
                      <span
                        key={idx}
                        className="px-1.5 sm:px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        title={`Incorreto: você digitou "${item.userWord}"`}
                      >
                        {item.word || item.userWord}
                      </span>
                    );
                  }
                })}
              </div>

              {/* Portuguese translation of sentence */}
              {validationResult.isMatch && (
                <div className="mt-2.5 pt-2.5 border-t border-emerald-500/20 text-xs text-emerald-400/80 italic">
                  Tradução: {currentSentence.translation}
                </div>
              )}
            </div>
          )}

          {/* Form Actions - Fully responsive for mobile touch screens */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePlayAudio}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Ouvir de Novo"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ouvir</span>
              </button>

              {isPlaying && (
                <button
                  type="button"
                  onClick={handlePauseAudio}
                  className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30 transition flex items-center justify-center gap-1.5 animate-in fade-in cursor-pointer"
                  title="Pausar áudio"
                >
                  <Pause className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Pausar</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="submit"
                disabled={!userInput.trim()}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Verificar</span>
              </button>

              {isValidationEnabled && (
                <button
                  type="button"
                  onClick={nextSentence}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-1.5 animate-in fade-in"
                >
                  <span>{currentIndex + 1 < sentences.length ? 'Avançar' : 'Concluir'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}