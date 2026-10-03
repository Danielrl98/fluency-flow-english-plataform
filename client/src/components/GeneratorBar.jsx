import React, { useState } from 'react';
import { Sparkles, Loader2, Compass, Layers } from 'lucide-react';

const QUICK_TOPICS = [
  { label: '☕ Morning Routine', query: 'Morning routine and drinking coffee' },
  { label: '💼 Tech Job Interview', query: 'Software engineer job interview introduction' },
  { label: '✈️ Airport & Travel', query: 'Checking in at the airport and boarding a flight' },
  { label: '🍕 Ordering at a Restaurant', query: 'Ordering dinner and drinks at a restaurant' },
  { label: '💡 AI & Future of Work', query: 'How artificial intelligence is changing jobs' },
  { label: '🏙️ Weekend in New York', query: 'Planning a weekend trip exploring New York City' }
];

const LEVELS = [
  { id: 'A', label: 'Nível A', tag: 'Básico (A1-A2)', desc: 'Vocabulário essencial, frases curtas e diretas' },
  { id: 'B', label: 'Nível B', tag: 'Intermediário (B1-B2)', desc: 'Phrasal verbs, expressões comuns e estruturas variadas' },
  { id: 'C', label: 'Nível C', tag: 'Avançado (C1-C2)', desc: 'Nuances ricas, vocabulário formal e coloquial apurado' }
];

export default function GeneratorBar({
  topic,
  setTopic,
  level,
  setLevel,
  onGenerate,
  isLoading
}) {
  const [customInput, setCustomInput] = useState(topic);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (customInput.trim() && !isLoading) {
      setTopic(customInput.trim());
      onGenerate(customInput.trim(), level);
    }
  };

  const handleSelectQuick = (query) => {
    setCustomInput(query);
    setTopic(query);
    onGenerate(query, level);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Level Selection Pills */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Seu Nível de Inglês:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {LEVELS.map((lvl) => {
            const isSelected = level === lvl.id;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setLevel(lvl.id)}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-sm shadow-indigo-500/20'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-bold text-sm ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>
                    {lvl.label}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {lvl.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1">{lvl.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Topic Prompt Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Qual assunto você quer praticar hoje? (Ex: Entrevista de emprego, pedindo comida, etc.)"
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all shadow-inner"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !customInput.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Gerando Lição com IA...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Gerar Aula</span>
            </>
          )}
        </button>
      </form>

      {/* Quick Suggestions */}
      <div>
        <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-400">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>Ou escolha um tema do cotidiano:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_TOPICS.map((qt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectQuick(qt.query)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition disabled:opacity-50"
            >
              {qt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
