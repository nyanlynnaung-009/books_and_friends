import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { BookOpenText, UsersRound, MessageSquareText, PlusSquare, LogOut, Globe, LibraryBig, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import CreateSessionModal from './components/CreateSessionModal';
import SessionDetail from './components/SessionDetail';
import ProfileSettings from './components/ProfileSettings';
import Library from './components/Library';

// Simple Dashboard Page
function Dashboard({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = async () => {
    console.log('Fetching sessions...');
    setIsLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('reading_sessions')
        .select(`
          id,
          book:books(title, author),
          participants:session_participants(user_id),
          comments:comments(id)
        `);
        
      if (error) {
        console.error('Error fetching sessions:', error);
        setFetchError(error.message);
        if (error.message?.includes('JWT expired')) {
          supabase.auth.signOut();
        }
      } else if (data) {
        console.log('Fetched sessions:', data);
        const processedData = data.map(session => {
          const bookData = Array.isArray(session.book) ? session.book[0] : session.book;
          return {
            ...session,
            bookTitle: bookData?.title || t('unknown_book'),
            bookAuthor: bookData?.author || t('unknown_author'),
            participantsCount: Array.isArray(session.participants) ? session.participants.length : 0,
            commentsCount: Array.isArray(session.comments) ? session.comments.length : 0
          };
        });
        setSessions(processedData);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setFetchError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t('reading_sessions')}</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <PlusSquare className="w-5 h-5" />
          {t('create_session')}
        </button>
      </div>
      
      {fetchError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>{t('error_loading_sessions')}</strong> {fetchError}
        </div>
      )}

      {isLoading ? (
        <div className="text-slate-500 dark:text-slate-400 text-center py-12">{t('loading_sessions')}</div>
      ) : sessions.length === 0 && !fetchError ? (
        <div className="text-slate-500 dark:text-slate-400 text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed">
          {t('no_sessions_found')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session: any) => (
            <Link to={`/session/${session.id}`} key={session.id} className="block group">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 group-hover:shadow-md group-hover:border-indigo-200 dark:group-hover:border-indigo-500 transition h-full">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{session.bookTitle}</h3>
                <p className="text-slate-600 dark:text-slate-300 mt-1">{session.bookAuthor}</p>
                <div className="mt-4 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1"><UsersRound className="w-4 h-4" /> {session.participantsCount} {t('members')}</div>
                  <div className="flex items-center gap-1"><MessageSquareText className="w-4 h-4" /> {session.commentsCount} {t('posts')}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateSessionModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={fetchSessions}
        userId={userId}
      />
    </div>
  );
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_url, is_admin')
      .eq('id', userId)
      .single();
    if (data) setProfile(data);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'my' : 'en';
    i18n.changeLanguage(newLang);
  };

  if (!session) {
    console.log('No session, showing Auth');
    return <Auth />;
  }

  console.log('Session exists, showing Dashboard');
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 transition-colors duration-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <BookOpenText className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight dark:text-white">{t('app_name')}</h1>
            </div>
            <nav className="flex items-center gap-4 sm:gap-6">
              <button onClick={toggleTheme} className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium flex items-center gap-1">
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button onClick={toggleLanguage} className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium flex items-center gap-1">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{i18n.language === 'en' ? 'မြန်မာ' : 'English'}</span>
              </button>
              <Link to="/" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium hidden sm:block">{t('dashboard')}</Link>
              <Link to="/library" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium flex items-center gap-1">
                <LibraryBig className="w-4 h-4" /> <span className="hidden sm:inline">{t('library')}</span>
              </Link>
              <Link to="/profile" className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium group">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 overflow-hidden flex items-center justify-center group-hover:border-indigo-300 dark:group-hover:border-indigo-500 transition">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-slate-400 dark:text-slate-300 text-xs font-bold">{profile?.display_name?.charAt(0) || session.user.email?.charAt(0).toUpperCase()}</div>
                  )}
                </div>
                <span className="hidden sm:flex items-center gap-2">
                  {t('profile')}
                  {profile?.is_admin && (
                    <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Admin</span>
                  )}
                </span>
              </Link>
              <button onClick={() => supabase.auth.signOut()} className="text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-medium flex items-center gap-2">
                <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">{t('sign_out')}</span>
              </button>
            </nav>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Routes>
            <Route path="/" element={<Dashboard userId={session.user.id} />} />
            <Route path="/library" element={<Library userId={session.user.id} />} />
            <Route path="/session/:id" element={<SessionDetail userId={session.user.id} />} />
            <Route path="/profile" element={<ProfileSettings userId={session.user.id} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
