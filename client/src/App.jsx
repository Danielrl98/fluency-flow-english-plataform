import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import GeneratorBar from './components/GeneratorBar';
import ReadingTab from './components/ReadingTab';
import ListeningTab from './components/ListeningTab';
import HistoryModal from './components/HistoryModal';
import VocabularyModal from './components/VocabularyModal';
import LoginScreen from './components/LoginScreen';
import { speechService } from './utils/speech';

// Starter lesson to provide immediate interactivity
const STARTER_LESSON = {
  title: "Morning Coffee Routine",
  titlePt: "Rotina Matinal com Café",
  topic: "Morning routine and drinking coffee",
  level: "B",
  fullText: "Every morning, I wake up early and head straight to the kitchen to brew fresh coffee. The rich aroma instantly helps me wake up and start my day with positive energy. I sit near the window, take slow sips, and plan my daily schedule before starting to work.",
  fullTranslation: "Todas as manhãs, eu acordo cedo e vou direto para a cozinha preparar café fresco. O aroma encorpado me ajuda instantaneamente a acordar e começar meu dia com energia positiva. Eu me sento perto da janela, dou goles lentos e planejo minha rotina diária antes de começar a trabalhar.",
  sentences: [
    {
      id: 1,
      text: "Every morning, I wake up early and head straight to the kitchen to brew fresh coffee.",
      translation: "Todas as manhãs, eu acordo cedo e vou direto para a cozinha preparar café fresco.",
      words: [
        { word: "Every", translation: "Todas / A cada", phonetic: "/ˈɛvri/" },
        { word: "morning,", translation: "manhã", phonetic: "/ˈmɔːrnɪŋ/" },
        { word: "I", translation: "eu", phonetic: "/aɪ/" },
        { word: "wake", translation: "acordo", phonetic: "/weɪk/" },
        { word: "up", translation: "para cima (phrasal verb: wake up = acordar)", phonetic: "/ʌp/" },
        { word: "early", translation: "cedo", phonetic: "/ˈɜːrli/" },
        { word: "and", translation: "e", phonetic: "/ænd/" },
        { word: "head", translation: "vou / me dirijo", phonetic: "/hɛd/" },
        { word: "straight", translation: "direto", phonetic: "/streɪt/" },
        { word: "to", translation: "para", phonetic: "/tuː/" },
        { word: "the", translation: "a", phonetic: "/ðə/" },
        { word: "kitchen", translation: "cozinha", phonetic: "/ˈkɪtʃɪn/" },
        { word: "to", translation: "para", phonetic: "/tuː/" },
        { word: "brew", translation: "passar / preparar (café/chá)", phonetic: "/bruː/" },
        { word: "fresh", translation: "fresco", phonetic: "/frɛʃ/" },
        { word: "coffee.", translation: "café", phonetic: "/ˈkɔːfi/" }
      ]
    },
    {
      id: 2,
      text: "The rich aroma instantly helps me wake up and start my day with positive energy.",
      translation: "O aroma encorpado me ajuda instantaneamente a acordar e começar meu dia com energia positiva.",
      words: [
        { word: "The", translation: "O", phonetic: "/ðə/" },
        { word: "rich", translation: "rico / encorpado", phonetic: "/rɪtʃ/" },
        { word: "aroma", translation: "aroma", phonetic: "/əˈroʊmə/" },
        { word: "instantly", translation: "instantaneamente", phonetic: "/ˈɪnstəntli/" },
        { word: "helps", translation: "ajuda", phonetic: "/hɛlps/" },
        { word: "me", translation: "me", phonetic: "/miː/" },
        { word: "wake", translation: "acordar", phonetic: "/weɪk/" },
        { word: "up", translation: "para cima", phonetic: "/ʌp/" },
        { word: "and", translation: "e", phonetic: "/ænd/" },
        { word: "start", translation: "começar", phonetic: "/stɑːrt/" },
        { word: "my", translation: "meu", phonetic: "/maɪ/" },
        { word: "day", translation: "dia", phonetic: "/deɪ/" },
        { word: "with", translation: "com", phonetic: "/wɪð/" },
        { word: "positive", translation: "positiva", phonetic: "/ˈpɑːzətɪv/" },
        { word: "energy.", translation: "energia", phonetic: "/ˈɛnərdʒi/" }
      ]
    },
    {
      id: 3,
      text: "I sit near the window, take slow sips, and plan my daily schedule before starting to work.",
      translation: "Eu me sento perto da janela, dou goles lentos e planejo minha rotina diária antes de começar a trabalhar.",
      words: [
        { word: "I", translation: "Eu", phonetic: "/aɪ/" },
        { word: "sit", translation: "sento", phonetic: "/sɪt/" },
        { word: "near", translation: "perto de", phonetic: "/nɪr/" },
        { word: "the", translation: "a", phonetic: "/ðə/" },
        { word: "window,", translation: "janela", phonetic: "/ˈwɪndoʊ/" },
        { word: "take", translation: "tomo / dou", phonetic: "/teɪk/" },
        { word: "slow", translation: "lentos", phonetic: "/sloʊ/" },
        { word: "sips,", translation: "goles", phonetic: "/sɪps/" },
        { word: "and", translation: "e", phonetic: "/ænd/" },
        { word: "plan", translation: "planejo", phonetic: "/plæn/" },
        { word: "my", translation: "minha", phonetic: "/maɪ/" },
        { word: "daily", translation: "diária", phonetic: "/ˈdeɪli/" },
        { word: "schedule", translation: "agenda / programação", phonetic: "/ˈskɛdʒuːl/" },
        { word: "before", translation: "antes de", phonetic: "/bɪˈfɔːr/" },
        { word: "starting", translation: "começar", phonetic: "/ˈstɑːrtɪŋ/" },
        { word: "to", translation: "a", phonetic: "/tuː/" },
        { word: "work.", translation: "trabalhar", phonetic: "/wɜːrk/" }
      ]
    }
  ],
  keyExpressions: [
    {
      expression: "wake up",
      meaning: "Despertar do sono, acordar.",
      example: "I usually wake up around 6:30 AM every weekday.",
      examplePt: "Eu geralmente acordo por volta das 6h30 da manhã nos dias de semana."
    },
    {
      expression: "head straight to",
      meaning: "Ir diretamente para um lugar sem paradas.",
      example: "After the gym, I head straight to the shower.",
      examplePt: "Depois da academia, vou direto para o banho."
    },
    {
      expression: "brew coffee",
      meaning: "Fazer / coar / preparar café.",
      example: "My father loves to brew coffee in a French press.",
      examplePt: "Meu pai adora preparar café na prensa francesa."
    },
    {
      expression: "take a sip",
      meaning: "Dar um gole em uma bebida.",
      example: "Be careful, take a slow sip because the tea is boiling hot.",
      examplePt: "Cuidado, dê um gole lento porque o chá está fervendo."
    }
  ]
};

export default function App() {
  // Auth state
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('fluency_auth_token'));
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('fluency_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(true);

  // App state
  const [activeTab, setActiveTab] = useState('reading');
  const [topic, setTopic] = useState('Morning coffee routine');
  const [level, setLevel] = useState('B');
  const [lesson, setLesson] = useState(STARTER_LESSON);
  const [isLoading, setIsLoading] = useState(false);
  const [accent, setAccent] = useState('US');

  // Active lesson in-progress state (persisted in SQLite)
  const [activeProgress, setActiveProgress] = useState({
    currentIndex: 0,
    completedSentences: [],
    audioPlaysCount: 0,
    sessionAttempts: 0,
    perfectSentencesCount: 0
  });

  // Modals
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isVocabOpen, setIsVocabOpen] = useState(false);
  const [historySelectedFile, setHistorySelectedFile] = useState(null);

  // Stats and vocabulary
  const [stats, setStats] = useState({
    completedLessons: 0,
    totalAudioPlays: 0,
    streakDays: 1,
    xpPoints: 0,
    totalWordsSaved: 0
  });
  const [vocabulary, setVocabulary] = useState([]);

  // Verify auth on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('fluency_auth_token');
      if (!token) {
        setIsVerifyingAuth(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAuthToken(token);
          if (data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('fluency_user', JSON.stringify(data.user));
          }
        } else {
          handleLogout();
        }
      } catch (err) {
        console.warn('Auth verification error:', err);
      } finally {
        setIsVerifyingAuth(false);
      }
    };

    verifyToken();
  }, []);

  // On auth: load stats, vocabulary, and active lesson progress from SQLite
  useEffect(() => {
    if (authToken) {
      fetchStats();
      fetchVocabulary();
      fetchActiveLessonProgress();
    }
  }, [authToken]);

  // Update speech accent when selected
  useEffect(() => {
    speechService.setAccent(accent);
  }, [accent]);

  // Authenticated fetch wrapper
  const authFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${authToken}`
    };

    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      handleLogout();
      throw new Error('Sessão expirada. Por favor faça login novamente.');
    }
    return res;
  };

  const handleLoginSuccess = (token, user) => {
    setAuthToken(token);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('fluency_auth_token');
    localStorage.removeItem('fluency_user');
    setAuthToken(null);
    setCurrentUser(null);
  };

  const fetchStats = async () => {
    try {
      const res = await authFetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.warn('Could not fetch stats:', err);
    }
  };

  const fetchVocabulary = async () => {
    try {
      const res = await authFetch('/api/vocabulary');
      if (res.ok) {
        const data = await res.json();
        setVocabulary(data);
      }
    } catch (err) {
      console.warn('Could not fetch vocabulary:', err);
    }
  };

  // Fetch active lesson progress from SQLite (restores state on page refresh!)
  const fetchActiveLessonProgress = async () => {
    try {
      const res = await authFetch('/api/progress');
      if (res.ok) {
        const data = await res.json();
        if (data.hasProgress && data.progress && data.progress.lesson) {
          const p = data.progress;
          setLesson(p.lesson);
          if (p.topic) setTopic(p.topic);
          if (p.level) setLevel(p.level);
          if (p.activeTab) setActiveTab(p.activeTab);

          setActiveProgress({
            currentIndex: p.currentIndex || 0,
            completedSentences: p.completedSentences || [],
            audioPlaysCount: p.audioPlaysCount || 0,
            sessionAttempts: p.sessionAttempts || 0,
            perfectSentencesCount: p.perfectSentencesCount || 0
          });
        }
      }
    } catch (err) {
      console.warn('Could not fetch active lesson progress:', err);
    }
  };

  // Sync active lesson progress to SQLite
  const saveProgressToDb = async (updatedFields = {}) => {
    try {
      const payload = {
        topic: lesson?.topic || topic,
        level: lesson?.level || level,
        activeTab,
        lesson,
        ...activeProgress,
        ...updatedFields
      };

      await authFetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn('Could not sync progress to SQLite:', err);
    }
  };

  // Switch tab and persist tab choice in SQLite
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    saveProgressToDb({ activeTab: newTab });
  };

  // Record audio play event in SQLite and update real-time counters
  const handleAudioPlay = async (type = 'sentence_listening', context = '') => {
    // Optimistic UI update
    setStats(prev => ({
      ...prev,
      totalAudioPlays: (prev?.totalAudioPlays || 0) + 1,
      xpPoints: (prev?.xpPoints || 0) + 5
    }));
    setActiveProgress(prev => ({
      ...prev,
      audioPlaysCount: (prev?.audioPlaysCount || 0) + 1
    }));

    try {
      const res = await authFetch('/api/progress/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, context })
      });
      if (res.ok) {
        const data = await res.json();
        setStats(prev => ({
          ...prev,
          totalAudioPlays: data.totalAudioPlays,
          xpPoints: data.xpPoints
        }));
      }
    } catch (err) {
      console.warn('Failed to record audio play in SQLite:', err);
    }
  };

  // Generate lesson with AI
  const handleGenerate = async (customTopic = topic, customLevel = level) => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: customTopic, level: customLevel })
      });

      if (!res.ok) {
        throw new Error('Falha ao gerar aula');
      }

      const data = await res.json();
      setLesson(data);
      setActiveTab('reading');
      setActiveProgress({
        currentIndex: 0,
        completedSentences: [],
        audioPlaysCount: 0,
        sessionAttempts: 0,
        perfectSentencesCount: 0
      });
    } catch (err) {
      console.error('Error generating lesson:', err);
      alert('Erro ao gerar aula com IA: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update listening progress (current index, completed sentences, attempts)
  const handleUpdateListeningProgress = (progressUpdate) => {
    setActiveProgress(prev => {
      const merged = { ...prev, ...progressUpdate };
      saveProgressToDb(merged);
      return merged;
    });
  };

  // Add / Toggle word in vocabulary (SQLite backed)
  const handleToggleVocab = async (wordData) => {
    const isSaved = vocabulary.some(
      w => (w.word || '').toLowerCase().trim() === (wordData.word || '').toLowerCase().trim()
    );

    try {
      if (isSaved) {
        const res = await authFetch(`/api/vocabulary/${encodeURIComponent(wordData.word)}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          const updated = await res.json();
          setVocabulary(updated);
        }
      } else {
        const res = await authFetch('/api/vocabulary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: wordData.word,
            translation: wordData.translation,
            phonetic: wordData.phonetic,
            example: wordData.sentenceText,
            level: lesson?.level || level
          })
        });
        if (res.ok) {
          const updated = await res.json();
          setVocabulary(updated);
        }
      }
      fetchStats();
    } catch (err) {
      console.error('Failed to toggle vocab:', err);
    }
  };

  const handleDeleteVocabWord = async (word) => {
    try {
      const res = await authFetch(`/api/vocabulary/${encodeURIComponent(word)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const updated = await res.json();
        setVocabulary(updated);
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to delete vocab:', err);
    }
  };

  // Save completed lesson to server SQLite & concluidos folder
  const handleCompleteLesson = async (completedLesson, sessionStats) => {
    try {
      const res = await authFetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson: completedLesson,
          stats: sessionStats
        })
      });

      const data = await res.json();
      fetchStats();
      return data;
    } catch (err) {
      console.error('Failed to save completion:', err);
      throw err;
    }
  };

  const handleOpenCompletedFile = (filename) => {
    setHistorySelectedFile(filename);
    setIsHistoryOpen(true);
  };

  // If still checking auth state, show minimalist loader
  if (isVerifyingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not authenticated, render LoginScreen with SQLite Registration/Login
  if (!authToken) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Header */}
      <Header
        stats={stats}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenHistory={() => {
          setHistorySelectedFile(null);
          setIsHistoryOpen(true);
        }}
        onOpenVocab={() => setIsVocabOpen(true)}
        accent={accent}
        setAccent={setAccent}
        vocabCount={vocabulary.length}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Topic Input & Level Selector */}
        <GeneratorBar
          topic={topic}
          setTopic={setTopic}
          level={level}
          setLevel={setLevel}
          onGenerate={handleGenerate}
          isLoading={isLoading}
        />

        {/* Tab 1: Reading or Tab 2: Listening */}
        {activeTab === 'reading' ? (
          <ReadingTab
            lesson={lesson}
            savedWords={vocabulary}
            onToggleVocab={handleToggleVocab}
            onGoToListening={() => handleTabChange('listening')}
            onAudioPlay={handleAudioPlay}
          />
        ) : (
          <ListeningTab
            lesson={lesson}
            initialCurrentIndex={activeProgress.currentIndex}
            initialCompletedSentences={activeProgress.completedSentences}
            initialAudioPlaysCount={activeProgress.audioPlaysCount}
            initialAttempts={activeProgress.sessionAttempts}
            initialPerfectCount={activeProgress.perfectSentencesCount}
            onCompleteLesson={handleCompleteLesson}
            onRestartLesson={() => handleTabChange('listening')}
            onViewCompletedFile={handleOpenCompletedFile}
            onUpdateProgress={handleUpdateListeningProgress}
            onAudioPlay={handleAudioPlay}
          />
        )}
      </main>

      {/* Modals */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        selectedFilename={historySelectedFile}
        authFetch={authFetch}
      />

      <VocabularyModal
        isOpen={isVocabOpen}
        onClose={() => setIsVocabOpen(false)}
        vocabulary={vocabulary}
        onDeleteWord={handleDeleteVocabWord}
      />
    </div>
  );
}
