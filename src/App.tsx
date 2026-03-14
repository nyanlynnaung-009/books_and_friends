import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { BookOpenText, UsersRound, LogOut, Globe, LibraryBig, Sun, Moon, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import CreateSessionModal from './components/CreateSessionModal';
import SessionDetail from './components/SessionDetail';
import ProfileSettings from './components/ProfileSettings';
import Library from './components/Library';
import AdminDashboard from './components/AdminDashboard';
import { InstallPWA } from './components/InstallPWA';
import { AnimatePresence, motion } from 'framer-motion';

// Wrapper for animated routes
function AnimatedRoutes({ session, profile, fetchProfile }: any) {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard userId={session.user.id} />} />
          <Route path="/library" element={<Library userId={session.user.id} />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/session/:id" element={<SessionDetail userId={session.user.id} />} />
          <Route path="/profile" element={<ProfileSettings userId={session.user.id} onProfileUpdate={() => fetchProfile(session.user.id)} />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
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
    return <Auth />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-sans transition-colors duration-200 flex pb-16 md:pb-0">
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-white dark:bg-stone-800 border-r border-stone-200 dark:border-stone-700 flex-col sticky top-0 h-screen hidden md:flex shadow-sm z-20">
          <div className="p-6 flex items-center gap-3 border-b border-stone-100 dark:border-stone-700/50 h-20">
            <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-2.5 rounded-xl text-white shadow-sm">
              <BookOpenText className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight dark:text-white truncate font-serif">{t('app_name')}</h1>
          </div>
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-stone-600 dark:text-stone-300 hover:bg-rose-50 dark:hover:bg-stone-700/50 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl font-medium transition-all group">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-6 h-6 rounded-full object-cover border border-stone-200 dark:border-stone-600 shadow-sm group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <User className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                </div>
              )}
              {t('profile')}
            </Link>
            <Link to="/" className="flex items-center gap-3 px-4 py-3 text-stone-600 dark:text-stone-300 hover:bg-rose-50 dark:hover:bg-stone-700/50 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl font-medium transition-all group">
              <BookOpenText className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {t('dashboard')}
            </Link>
            <Link to="/library" className="flex items-center gap-3 px-4 py-3 text-stone-600 dark:text-stone-300 hover:bg-rose-50 dark:hover:bg-stone-700/50 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl font-medium transition-all group">
              <LibraryBig className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {t('library')}
            </Link>
            {profile?.is_admin && (
              <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl font-medium transition-all group">
                <UsersRound className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {t('admin')}
              </Link>
            )}
          </nav>
          <div className="p-4 border-t border-stone-100 dark:border-stone-700/50">
            <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-3 w-full px-4 py-3 text-stone-500 dark:text-stone-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-xl font-medium transition-all group">
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {t('sign_out')}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Header */}
          <header className="bg-white/80 dark:bg-stone-800/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-700 sticky top-0 z-10 transition-colors duration-200">
            <div className="px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between md:justify-end">
              <div className="flex items-center gap-3 md:hidden">
                <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-2 rounded-lg text-white">
                  <BookOpenText className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold tracking-tight dark:text-white truncate font-serif">{t('app_name')}</h1>
              </div>
              <nav className="flex items-center gap-2 sm:gap-4">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleTheme} 
                  className="p-2 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full transition-colors"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={isDarkMode ? 'dark' : 'light'}
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 20, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </motion.div>
                  </AnimatePresence>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleLanguage} 
                  className="px-3 py-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-xl font-medium flex items-center gap-2 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">{i18n.language === 'en' ? 'မြန်မာ' : 'English'}</span>
                </motion.button>
                
                {/* Mobile Sign Out (Header) */}
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => supabase.auth.signOut()} 
                  className="p-2 text-stone-500 dark:text-stone-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-full md:hidden transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </motion.button>
              </nav>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
              <AnimatedRoutes session={session} profile={profile} fetchProfile={fetchProfile} />
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700 pb-safe z-50 flex justify-around items-center h-16 px-2">
          <Link to="/" className="flex flex-col items-center justify-center w-full h-full text-stone-500 dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors group">
            <motion.div whileTap={{ scale: 0.9 }}>
              <BookOpenText className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
            </motion.div>
            <span className="text-[10px] font-medium">{t('dashboard')}</span>
          </Link>
          <Link to="/library" className="flex flex-col items-center justify-center w-full h-full text-stone-500 dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors group">
            <motion.div whileTap={{ scale: 0.9 }}>
              <LibraryBig className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
            </motion.div>
            <span className="text-[10px] font-medium">{t('library')}</span>
          </Link>
          {profile?.is_admin && (
            <Link to="/admin" className="flex flex-col items-center justify-center w-full h-full text-stone-500 dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors group">
              <motion.div whileTap={{ scale: 0.9 }}>
                <UsersRound className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
              </motion.div>
              <span className="text-[10px] font-medium">{t('admin')}</span>
            </Link>
          )}
          <Link to="/profile" className="flex flex-col items-center justify-center w-full h-full text-stone-500 dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors group">
            <motion.div whileTap={{ scale: 0.9 }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-6 h-6 rounded-full object-cover border border-stone-200 dark:border-stone-600 mb-1 group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
              )}
            </motion.div>
            <span className="text-[10px] font-medium">{t('profile')}</span>
          </Link>
        </nav>

        <InstallPWA />
      </div>
    </BrowserRouter>
  );
}
