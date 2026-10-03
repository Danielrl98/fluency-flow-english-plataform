import React from 'react';
import { BookOpen, Headphones, Flame, Trophy, Bookmark, History, Globe, LogOut } from 'lucide-react';

export default function Header({
  stats,
  activeTab,
  setActiveTab,
  onOpenHistory,
  onOpenVocab,
  accent,
  setAccent,
  vocabCount,
  userEmail,
  onLogout
}) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Headphones className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                FluencyFlow
              </span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AI English
              </span>
            </div>
            <p className="text-xs text-slate-400">Leitura Interativa & Ditado Diário</p>
          </div>
        </div>

        {/* Tab Switcher (when a lesson is active) */}
        <div className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('reading')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'reading'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>1. Leitura</span>
          </button>
          <button
            onClick={() => setActiveTab('listening')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'listening'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>2. Listening</span>
          </button>
        </div>

        {/* Right side tools: Accent, Streak, Vocab, History */}
        <div className="flex items-center gap-2">
          {/* Accent toggle */}
          <div className="flex items-center gap-1 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800 text-xs text-slate-300">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
              title="Sotaque do áudio"
            >
              <option value="US" className="bg-slate-900 text-slate-200">US 🇺🇸</option>
              <option value="UK" className="bg-slate-900 text-slate-200">UK 🇬🇧</option>
            </select>
          </div>

          {/* Streak */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold"
            title="Dias seguidos de estudo"
          >
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>{stats?.streakDays ?? 0} {stats?.streakDays === 1 ? 'dia' : 'dias'}</span>
          </div>

          {/* Vocabulary button */}
          <button
            onClick={onOpenVocab}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/60 transition"
            title="Meu Banco de Vocabulário"
          >
            <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Vocabulário</span>
            {(vocabCount ?? 0) > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-600 text-white font-bold">
                {vocabCount}
              </span>
            )}
          </button>

          {/* Completed History button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/60 transition"
            title="Aulas Concluídas na pasta concluidos/"
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Concluídos</span>
            {(stats?.completedLessons ?? 0) > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-600 text-white font-bold">
                {stats.completedLessons}
              </span>
            )}
          </button>

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/30 transition"
            title={`Sair (${userEmail || 'Desconectar'})`}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
