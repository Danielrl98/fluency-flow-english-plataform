import React, { useState, useEffect, useCallback } from 'react';
import { X, FileText, Calendar, BookOpen, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function HistoryModal({ isOpen, onClose, selectedFilename = null, authFetch }) {
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchFn = authFetch || fetch;
      const res = await fetchFn('/api/history');
      const data = await res.json();
      setHistoryList(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  const loadLessonContent = useCallback(async (filename) => {
    setLoadingContent(true);
    try {
      const fetchFn = authFetch || fetch;
      const res = await fetchFn(`/api/history/${encodeURIComponent(filename)}`);
      const data = await res.json();
      setSelectedLesson(data);
    } catch (err) {
      console.error('Failed to load lesson content:', err);
    } finally {
      setLoadingContent(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      if (selectedFilename) {
        loadLessonContent(selectedFilename);
      }
    } else {
      setSelectedLesson(null);
    }
  }, [isOpen, selectedFilename, loadHistory, loadLessonContent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-4 px-4 sm:px-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">Aulas Concluídas</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Arquivos salvos automaticamente na pasta <code className="text-emerald-400">concluidos/</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Two columns (List on Left, Viewer on Right) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0">
          {/* Left Column: List of completed files */}
          <div className={`md:col-span-5 border-r border-slate-800 overflow-y-auto p-3 sm:p-4 space-y-2 ${
            selectedLesson ? 'hidden md:block' : 'block'
          }`}>
            {isLoading ? (
              <div className="text-center py-12 text-slate-500 text-xs sm:text-sm">
                Carregando histórico...
              </div>
            ) : historyList.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs sm:text-sm">
                <FileText className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 text-slate-600" />
                Nenhuma lição concluída ainda.
                <p className="text-[11px] sm:text-xs text-slate-600 mt-1">
                  Complete uma sessão de listening para salvar seu primeiro arquivo!
                </p>
              </div>
            ) : (
              historyList.map((item) => {
                const isSelected = selectedLesson?.filename === item.filename;
                return (
                  <button
                    key={item.filename}
                    onClick={() => loadLessonContent(item.filename)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Nível {item.level}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.completedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <h4 className="font-semibold text-xs sm:text-sm line-clamp-1 mb-0.5 text-slate-100">
                      {item.title || item.topic}
                    </h4>

                    <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1">
                      Tema: {item.topic}
                    </p>

                    <code className="text-[10px] text-slate-500 block mt-1 truncate">
                      {item.filename}
                    </code>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Viewer for selected markdown */}
          <div className={`md:col-span-7 overflow-y-auto p-4 sm:p-6 bg-slate-950/40 ${
            selectedLesson ? 'block' : 'hidden md:block'
          }`}>
            {loadingContent ? (
              <div className="text-center py-16 text-slate-500 text-xs sm:text-sm">
                Abrindo arquivo Markdown...
              </div>
            ) : selectedLesson ? (
              <div className="prose prose-invert max-w-none text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                <div className="pb-3 mb-3 border-b border-slate-800 flex items-center justify-between gap-2 text-xs text-slate-400">
                  <button
                    onClick={() => setSelectedLesson(null)}
                    className="md:hidden flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Voltar para lista</span>
                  </button>

                  <span className="font-mono text-emerald-400 text-[11px] sm:text-xs font-semibold truncate">
                    concluidos/{selectedLesson.filename}
                  </span>
                </div>
                {selectedLesson.content}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 text-xs sm:text-sm">
                <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-slate-700" />
                Selecione uma lição à esquerda para visualizar o arquivo completo salvo.
              </div>
            )}
          </div>
        </div>

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