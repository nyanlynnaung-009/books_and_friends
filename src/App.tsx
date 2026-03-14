import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { BookOpenText, UsersRound, MessageSquareText, PlusSquare, LogOut, Globe, LibraryBig, Sun, Moon, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import CreateSessionModal from './components/CreateSessionModal';
import SessionDetail from './components/SessionDetail';
import ProfileSettings from './components/ProfileSettings';
import Library from './components/Library';
import AdminDashboard from './components/AdminDashboard';
import { InstallPWA } from './components/InstallPWA';

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
        <h2 className="text-3xl font-bold text-stone-900 dark:text-white">{t('reading_sessions')}</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white px-5 py-2.5 rounded-xl hover:from-rose-600 hover:to-rose-700 shadow-sm hover:shadow-md transition-all font-medium"
        >
          <PlusSquare className="w-5 h-5" />
          {t('create_session')}
        </button>
      </div>
      
      {fetchError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
          <strong>{t('error_loading_sessions')}</strong> {fetchError}
        </div>
      )}

      {isLoading ? (
        <div className="text-stone-500 dark:text-stone-400 text-center py-12">{t('loading_sessions')}</div>
      ) : sessions.length === 0 && !fetchError ? (
        <div className="text-stone-500 dark:text-stone-400 text-center py-16 bg-white dark:bg-stone-800 rounded-3xl border border-stone-200 dark:border-stone-700 border-dashed">
          {t('no_sessions_found')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session: any) => (
            <Link to={`/session/${session.id}`} key={session.id} className="block group">
              <div className="bg-white dark:bg-stone-800 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-700 group-hover:shadow-xl group-hover:shadow-rose-500/10 group-hover:border-rose-200 dark:group-hover:border-rose-500/50 transition-all duration-300 h-full flex flex-col">
                <h3 className="text-xl font-semibold text-stone-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2">{session.bookTitle}</h3>
                <p className="text-stone-500 dark:text-stone-400 mt-2 font-medium">{session.bookAuthor}</p>
                <div className="mt-auto pt-6 flex items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
                  <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-stone-900/50 px-3 py-1.5 rounded-lg"><UsersRound className="w-4 h-4 text-stone-400" /> {session.participantsCount}</div>
                  <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-stone-900/50 px-3 py-1.5 rounded-lg"><MessageSquareText className="w-4 h-4 text-stone-400" /> {session.commentsCount}</div>
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
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-sans transition-colors duration-200 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-stone-800 border-r border-stone-200 dark:border-stone-700 flex-col sticky top-0 h-screen hidden md:flex shadow-sm z-20">
          <div className="p-6 flex items-center gap-3 border-b border-stone-100 dark:border-stone-700/50 h-20">
            <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-2.5 rounded-xl text-white shadow-sm">
              <BookOpenText className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight dark:text-white truncate font-serif">{t('app_name')}</h1>
          </div>
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-stone-600 dark:text-stone-300 hover:bg-rose-50 dark:hover:bg-stone-700/50 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl font-medium transition-all">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-6 h-6 rounded-full object-cover border border-stone-200 dark:border-stone-600 shadow-sm" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 flex items-center justify-center shadow-sm">
                  <User className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                </div>
              )}
              {t('profile')}
            </Link>
            <Link to="/" className="flex items-center gap-3 px-4 py-3 text-stone-600 dark:text-stone-300 hover:bg-rose-50 dark:hover:bg-stone-700/50 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl font-medium transition-all">
              <BookOpenText className="w-5 h-5" />
              {t('dashboard')}
            </Link>
            <Link to="/library" className="flex items-center gap-3 px-4 py-3 text-stone-600 dark:text-stone-300 hover:bg-rose-50 dark:hover:bg-stone-700/50 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl font-medium transition-all">
              <LibraryBig className="w-5 h-5" />
              {t('library')}
            </Link>
            {profile?.is_admin && (
              <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl font-medium transition-all">
                <UsersRound className="w-5 h-5" />
                {t('admin')}
              </Link>
            )}
          </nav>
          <div className="p-4 border-t border-stone-100 dark:border-stone-700/50">
            <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-3 w-full px-4 py-3 text-stone-500 dark:text-stone-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-xl font-medium transition-all">
              <LogOut className="w-5 h-5" />
              {t('sign_out')}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Header */}
          <header className="bg-white/80 dark:bg-stone-800/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-700 sticky top-0 z-10 transition-colors duration-200">
            <div className="px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between md:justify-end">
              <div className="flex items-center gap-3 md:hidden">
                <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-2 rounded-lg text-white">
                  <BookOpenText className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold tracking-tight dark:text-white truncate font-serif">{t('app_name')}</h1>
              </div>
              <nav className="flex items-center gap-2 sm:gap-4">
                <button onClick={toggleTheme} className="p-2 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full transition-colors">
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button onClick={toggleLanguage} className="px-3 py-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-xl font-medium flex items-center gap-2 transition-colors">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">{i18n.language === 'en' ? 'မြန်မာ' : 'English'}</span>
                </button>
                
                {/* Mobile Navigation Links */}
                <Link to="/profile" className="p-2 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full md:hidden transition-colors flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-6 h-6 rounded-full object-cover border border-stone-200 dark:border-stone-600 shadow-sm" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 flex items-center justify-center shadow-sm">
                      <User className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                    </div>
                  )}
                </Link>
                <Link to="/" className="p-2 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full md:hidden transition-colors">
                  <BookOpenText className="w-5 h-5" />
                </Link>
                {profile?.is_admin && (
                  <Link to="/admin" className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full md:hidden transition-colors">
                    <UsersRound className="w-5 h-5" />
                  </Link>
                )}

                <Link to="/library" className="p-2 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full md:hidden transition-colors">
                  <LibraryBig className="w-5 h-5" />
                </Link>

                {/* Mobile Sign Out */}
                <button onClick={() => supabase.auth.signOut()} className="p-2 text-stone-500 dark:text-stone-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-full md:hidden transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </nav>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard userId={session.user.id} />} />
                <Route path="/library" element={<Library userId={session.user.id} />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/session/:id" element={<SessionDetail userId={session.user.id} />} />
                <Route path="/profile" element={<ProfileSettings userId={session.user.id} onProfileUpdate={() => fetchProfile(session.user.id)} />} />
              </Routes>
            </div>
          </main>
        </div>
        <InstallPWA />
      </div>
    </BrowserRouter>
  );
}
