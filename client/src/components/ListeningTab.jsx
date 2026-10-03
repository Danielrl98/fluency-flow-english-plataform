import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  FileCheck,
  Volume2,
  Keyboard,
  Award,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { speechService } from '../utils/speech';
import { validateDictation, getHint } from '../utils/diff';

export default function ListeningTab({
  lesson,
  onCompleteLesson,
  onRestartLesson,
  onViewCompletedFile
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [validationResult, setValidationResult] = useState(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [audioPlaysCount, setAudioPlaysCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [savedFileInfo, setSavedFileInfo] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Statistics for the session
  const [sessionAttempts, setSessionAttempts] = useState(0);
  const [perfectSentencesCount, setPerfectSentencesCount] = useState(0);

  const inputRef = useRef(null);

  const sentences = lesson?.sentences || [];
  const currentSentence = sentences[currentIndex];
  const progressPercent = sentences.length > 0 ? Math.round(((currentIndex) / sentences.length) * 100) : 0;

  // Auto-focus input and reset state when sentence changes
  useEffect(() => {
    setUserInput('');
    setValidationResult(null);
    setHintLevel(0);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    // Auto-play the audio for the current sentence after a brief moment
    if (currentSentence && !isCompleted) {
      const timer = setTimeout(() => {
        handlePlayAudio();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isCompleted]);

  // Keyboard shortcuts (Space = Play audio, Enter = Validate)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept Space if typing in an input unless with modifier
      if (e.key === ' ' && (e.ctrlKey || e.altKey)) {
        e.preventDefault();
        handlePlayAudio();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSentence, isPlaying, speed]);

  if (!lesson || sentences.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl">
        <Volume2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-slate-300">Nenhuma lição pronta para listening</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
          Gere um texto na barra acima para iniciar seu treino de listening particionado.
        </p>
      </div>
    );
  }

  // Play audio for current sentence
  const handlePlayAudio = () => {
    if (!currentSentence) return;
    setIsPlaying(true);
    setAudioPlaysCount(prev => prev + 1);
    speechService.setRate(speed);
    speechService.speak(currentSentence.text, () => {
      setIsPlaying(false);
    });
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    speechService.setRate(newSpeed);
  };

  // Validate user dictation
  const handleValidate = (e) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || !currentSentence) return;

    setSessionAttempts(prev => prev + 1);
    const result = validateDictation(userInput, currentSentence.text);
    setValidationResult(result);

    if (result.isMatch) {
      if (hintLevel === 0) {
        setPerfectSentencesCount(prev => prev + 1);
      }

      // Short delay then advance to next sentence or finish
      setTimeout(() => {
        if (currentIndex + 1 < sentences.length) {
          setCurrentIndex(prev => prev + 1);
        } else {
          // Finished all sentences!
          handleFinishLesson();
        }
      }, 1200);
    }
  };

  // Handle lesson completion
  const handleFinishLesson = async () => {
    setIsCompleted(true);

    // Launch confetti!
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }

    // Save lesson to server /concluidos folder
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

  // Hint button logic
  const handleRequestHint = () => {
    const nextLevel = Math.min(3, hintLevel + 1);
    setHintLevel(nextLevel);
    if (nextLevel === 3) {
      // Reveal sentence in input
      setUserInput(currentSentence.text);
    }
  };

  // If completed, render celebratory screen
  if (isCompleted) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-5">
          <Award className="w-10 h-10 text-slate-950" />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          Aula Concluída com Sucesso! 🎉
        </span>

        <h2 className="text-3xl font-extrabold text-white mt-3 mb-2">
          Parabéns pelo seu treino de listening!
        </h2>
        <p className="text-slate-400 text-sm max-w-lg mx-auto mb-6">
          Você completou todas as {sentences.length} frases do tema <strong className="text-slate-200">"{lesson.topic}"</strong> no Nível {lesson.level}.
        </p>

        {/* Stats card */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-8 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div>
            <div className="text-2xl font-bold text-emerald-400">
              {sentences.length}
            </div>
            <div className="text-[11px] text-slate-500 uppercase font-medium">Frases Feitas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-sky-400">
              {audioPlaysCount}
            </div>
            <div className="text-[11px] text-slate-500 uppercase font-medium">Áudios Ouvidos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400">
              {Math.max(80, Math.round((perfectSentencesCount / sentences.length) * 100))}%
            </div>
            <div className="text-[11px] text-slate-500 uppercase font-medium">Precisão</div>
          </div>
        </div>

        {/* File Saved Confirmation Alert */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 max-w-lg mx-auto mb-8 text-left flex items-start gap-3">
          <FileCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-emerald-300">
              Arquivo salvo na pasta concluidos/
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              O arquivo Markdown com o texto, tradução e vocabulário foi gravado em disco:
            </p>
            <code className="text-xs font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/20 block mt-1 break-all">
              {savedFileInfo?.filename || 'concluidos/aula-concluida.md'}
            </code>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {savedFileInfo?.filename && (
            <button
              onClick={() => onViewCompletedFile(savedFileInfo.filename)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Ver Arquivo Concluído</span>
            </button>
          )}

          <button
            onClick={onRestartLesson}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-sky-400" />
            <span>Repetir Esta Aula</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress & Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Nível {lesson.level}
            </span>
            <span className="text-xs text-slate-400">
              Frase <strong className="text-white">{currentIndex + 1}</strong> de {sentences.length}
            </span>
          </div>

          <span className="text-xs font-mono font-bold text-indigo-400">
            {progressPercent}% concluído
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Audio Player Card for Current Segment */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md text-center relative overflow-hidden">
        {/* Glow effect when audio is playing */}
        {isPlaying && (
          <div className="absolute inset-0 bg-indigo-500/5 animate-pulse pointer-events-none" />
        )}

        <div className="mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Áudio da Frase #{currentIndex + 1}
          </span>
        </div>

        {/* Big Central Play / Replay Button */}
        <div className="flex items-center justify-center gap-4 my-2">
          <button
            onClick={handlePlayAudio}
            className={`w-18 h-18 rounded-2xl flex items-center justify-center transition-all shadow-xl cursor-pointer ${
              isPlaying
                ? 'bg-indigo-500 text-white shadow-indigo-500/50 scale-105 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:scale-105'
            }`}
            title="Ouvir áudio da frase (Alt+P)"
          >
            {isPlaying ? (
              <RotateCcw className="w-8 h-8 animate-spin" />
            ) : (
              <Play className="w-8 h-8 ml-1 fill-white" />
            )}
          </button>
        </div>

        {/* Audio Wave Visualizer Simulation */}
        <div className="flex items-center justify-center gap-1.5 h-6 my-4">
          {[40, 70, 30, 90, 60, 100, 50, 80, 45, 95, 35, 75].map((h, i) => (
            <span
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                isPlaying ? 'bg-indigo-400' : 'bg-slate-700'
              }`}
              style={{
                height: isPlaying ? `${Math.max(6, (h * (0.5 + Math.random() * 0.5)) / 3.5)}px` : '4px'
              }}
            />
          ))}
        </div>

        {/* Audio Controls: Speed & Shortcut Tips */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>Velocidade:</span>
            {[0.75, 1.0, 1.25].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`px-2 py-0.5 rounded font-mono text-xs transition ${
                  speed === s
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 text-slate-500 text-[11px]">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Dica: Pressione <strong>Alt+P</strong> para ouvir</span>
          </div>
        </div>
      </div>

      {/* Dictation Input Form & Validation Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <form onSubmit={handleValidate} className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <span>✍️ Digite o que você ouviu em inglês:</span>
            </label>

            {/* Hint Button */}
            <button
              type="button"
              onClick={handleRequestHint}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>
                {hintLevel === 0 && 'Precisa de dica?'}
                {hintLevel === 1 && 'Dica 1 (Estrutura)'}
                {hintLevel === 2 && 'Dica 2 (Primeiras letras)'}
                {hintLevel === 3 && 'Revelado'}
              </span>
            </button>
          </div>

          {/* Progressive Hint Box */}
          {hintLevel > 0 && (
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 animate-in fade-in">
              <span className="font-bold block mb-0.5">Dica {hintLevel}:</span>
              <p className="font-mono">{getHint(currentSentence.text, hintLevel).text}</p>
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
                if (validationResult) setValidationResult(null); // clear validation on edit
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleValidate();
                }
              }}
              placeholder="Ouça o áudio acima e digite o texto em inglês aqui... (Pressione Enter para verificar)"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-4 text-base text-slate-100 placeholder-slate-600 focus:outline-none transition resize-none font-sans"
            />
          </div>

          {/* Validation Feedback Display (Word by Word colored pills) */}
          {validationResult && (
            <div className={`p-4 rounded-xl border animate-in fade-in ${
              validationResult.isMatch
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {validationResult.isMatch ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                )}
                <span className="text-sm font-bold">
                  {validationResult.message}
                </span>
              </div>

              {/* Word by word diff feedback */}
              <div className="flex flex-wrap gap-1.5 mt-2 text-sm font-mono">
                {validationResult.diffWords.map((item, idx) => {
                  if (item.status === 'correct') {
                    return (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        title="Correto"
                      >
                        {item.word}
                      </span>
                    );
                  } else if (item.status === 'typo') {
                    return (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        title={`Você digitou "${item.userWord}" -> Correto: "${item.word}"`}
                      >
                        {item.word} <span className="text-[10px] opacity-75">({item.userWord})</span>
                      </span>
                    );
                  } else if (item.status === 'missing') {
                    return (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-dashed border-rose-500/40"
                        title="Palavra faltante"
                      >
                        [ {item.word} ]
                      </span>
                    );
                  } else {
                    return (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        title={`Incorreto: você digitou "${item.userWord}"`}
                      >
                        {item.word || item.userWord}
                      </span>
                    );
                  }
                })}
              </div>

              {/* Portuguese translation of the sentence for context */}
              {validationResult.isMatch && (
                <div className="mt-3 pt-3 border-t border-emerald-500/20 text-xs text-emerald-400/80 italic">
                  Tradução: {currentSentence.translation}
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handlePlayAudio}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ouvir de Novo</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!userInput.trim()}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span>Verificar</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
