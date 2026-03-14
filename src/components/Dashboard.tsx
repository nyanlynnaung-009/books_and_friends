import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusSquare, UsersRound, MessageSquareText, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';
import CreateSessionModal from './CreateSessionModal';
import { motion } from 'framer-motion';

export default function Dashboard({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = async () => {
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
        setFetchError(error.message);
        if (error.message?.includes('JWT expired')) {
          supabase.auth.signOut();
        }
      } else if (data) {
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
      setFetchError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8 pb-24 md:pb-8"
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-stone-900 dark:bg-stone-800 p-8 sm:p-10 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-rose-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-bold font-serif tracking-tight">{t('reading_sessions')}</h2>
            <p className="text-stone-300 max-w-md text-sm sm:text-base">Join a reading session or create your own to discuss your favorite books with friends.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="shrink-0 flex items-center gap-2 bg-white text-stone-900 px-6 py-3 rounded-2xl hover:bg-stone-100 transition-colors font-semibold shadow-lg"
          >
            <PlusSquare className="w-5 h-5 text-rose-500" />
            {t('create_session')}
          </motion.button>
        </div>
      </div>
      
      {fetchError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
          <strong>{t('error_loading_sessions')}</strong> {fetchError}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-stone-800 p-6 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-700 h-48 animate-pulse flex flex-col">
              <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded-md w-3/4 mb-3"></div>
              <div className="h-4 bg-stone-100 dark:bg-stone-700/50 rounded-md w-1/2"></div>
              <div className="mt-auto flex gap-3">
                <div className="h-8 w-16 bg-stone-100 dark:bg-stone-700/50 rounded-xl"></div>
                <div className="h-8 w-16 bg-stone-100 dark:bg-stone-700/50 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      ) : sessions.length === 0 && !fetchError ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center text-center py-20 px-4 bg-white dark:bg-stone-800 rounded-[2rem] border border-stone-200 dark:border-stone-700 border-dashed"
        >
          <div className="w-20 h-20 bg-stone-50 dark:bg-stone-900 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-stone-400 dark:text-stone-500" />
          </div>
          <h3 className="text-xl font-semibold text-stone-900 dark:text-white mb-2">No sessions yet</h3>
          <p className="text-stone-500 dark:text-stone-400 max-w-sm mb-6">{t('no_sessions_found')}</p>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="text-rose-600 dark:text-rose-400 font-medium hover:underline"
          >
            Create your first session
          </button>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sessions.map((session: any) => (
            <motion.div variants={itemVariants} key={session.id} className="h-full">
              <Link to={`/session/${session.id}`} className="block h-full group outline-none">
                <div className="bg-white dark:bg-stone-800 p-6 rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-700 group-hover:shadow-xl group-hover:shadow-rose-500/10 group-hover:border-rose-200 dark:group-hover:border-rose-500/50 group-focus-visible:ring-2 group-focus-visible:ring-rose-500 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-50 to-transparent dark:from-rose-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-bl-full pointer-events-none"></div>
                  
                  <h3 className="text-xl font-semibold text-stone-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2 relative z-10">{session.bookTitle}</h3>
                  <p className="text-stone-500 dark:text-stone-400 mt-2 font-medium relative z-10">{session.bookAuthor}</p>
                  
                  <div className="mt-auto pt-8 flex items-center gap-3 text-sm font-medium text-stone-600 dark:text-stone-300 relative z-10">
                    <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-stone-900/80 px-3 py-2 rounded-xl border border-stone-100 dark:border-stone-700/50 group-hover:bg-white dark:group-hover:bg-stone-800 transition-colors">
                      <UsersRound className="w-4 h-4 text-rose-500" /> 
                      <span>{session.participantsCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-stone-900/80 px-3 py-2 rounded-xl border border-stone-100 dark:border-stone-700/50 group-hover:bg-white dark:group-hover:bg-stone-800 transition-colors">
                      <MessageSquareText className="w-4 h-4 text-indigo-500" /> 
                      <span>{session.commentsCount}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      <CreateSessionModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={fetchSessions}
        userId={userId}
      />
    </motion.div>
  );
}
