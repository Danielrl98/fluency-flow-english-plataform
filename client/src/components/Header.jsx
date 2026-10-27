import React from 'react';
import {
  BookOpen,
  Headphones,
  Flame,
  Volume2,
  Bookmark,
  History,
  Globe,
  LogOut
} from 'lucide-react';

export default function Header({
  stats,
  activeTab,
  setActiveTab,
  onOpenHistory,
  onOpenVocab,
  accent,
  setAccent,
  vocabCount,
  currentUser,
  onLogout
}) {
  const initialLetter = (currentUser?.name || currentUser?.email || 'U').charAt(0).toUpperCase();

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-4">
        {/* Top Row: Logo & Profile / Main Tools */}
        <div className="w-full md:w-auto flex items-center justify-between gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  FluencyFlow
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block">
                Leitura Interativa & Ditado Diário
              </p>
            </div>
          </div>

          {/* User Profile & Logout (Mobile top right) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div
              className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center uppercase shadow-sm shrink-0"
              title={currentUser?.email || 'Usuário'}
            >
              {initialLetter}
            </div>
            {currentUser?.name && (
              <span className="hidden lg:inline text-xs font-medium text-slate-300 max-w-[100px] truncate">
                {currentUser.name.split(' ')[0]}
              </span>
            )}
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/30 transition cursor-pointer"
              title={`Sair (${currentUser?.email || 'Desconectar'})`}
            >
              <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher & Stats (Mobile row 2 / Desktop inline) */}
        <div className="w-full md:w-auto flex flex-wrap md:flex-nowrap items-center justify-between md:justify-end gap-2 overflow-x-auto no-scrollbar">
          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 shrink-0 w-full sm:w-auto justify-center">
            <button
              onClick={() => setActiveTab('reading')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'listening'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>2. Listening</span>
            </button>
          </div>

          {/* Quick stats & tools pill row */}
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar w-full sm:w-auto justify-center">
            {/* Audio Plays Counter */}
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold shrink-0"
              title="Total de áudios praticados salvos no banco SQLite"
            >
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              <span>{stats?.totalAudioPlays ?? 0}</span>
              <span className="hidden sm:inline text-[10px] font-normal text-sky-300/80">áudios</span>
            </div>

            {/* Streak */}
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold shrink-0"
              title="Dias seguidos de estudo"
            >
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{stats?.streakDays ?? 0}</span>
              <span className="hidden sm:inline text-[10px] font-normal text-amber-300/80">
                {stats?.streakDays === 1 ? 'dia' : 'dias'}
              </span>
            </div>

            {/* Accent toggle */}
            <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 text-xs text-slate-300 shrink-0">
              <Globe className="w-3 h-3 text-slate-400" />
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

            {/* Vocabulary button */}
            <button
              onClick={onOpenVocab}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/60 transition cursor-pointer shrink-0"
              title="Meu Banco de Vocabulário"
            >
              <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Vocab</span>
              {(vocabCount ?? 0) > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-600 text-white font-bold">
                  {vocabCount}
                </span>
              )}
            </button>

            {/* Completed History button */}
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/60 transition cursor-pointer shrink-0"
              title="Histórico de Aulas Concluídas"
            >
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Concluídos</span>
              {(stats?.completedLessons ?? 0) > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-600 text-white font-bold">
                  {stats.completedLessons}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}