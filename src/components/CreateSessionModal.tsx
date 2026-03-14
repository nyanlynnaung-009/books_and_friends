import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export default function CreateSessionModal({ isOpen, onClose, onSuccess, userId }: CreateSessionModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create the book
      const { data: book, error: bookError } = await supabase
        .from('books')
        .insert({
          title,
          author,
          total_pages: parseInt(totalPages, 10),
          creator_id: userId
        })
        .select()
        .single();

      if (bookError) throw bookError;

      // 2. Create the reading session
      const { data: session, error: sessionError } = await supabase
        .from('reading_sessions')
        .insert({
          book_id: book.id,
          creator_id: userId,
          status: 'active'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // 3. Add creator as a participant
      const { error: participantError } = await supabase
        .from('session_participants')
        .insert({
          session_id: session.id,
          user_id: userId,
          current_progress: 0
        });

      if (participantError) throw participantError;

      onSuccess();
      onClose();
      setTitle('');
      setAuthor('');
      setTotalPages('');
    } catch (err: any) {
      console.error('Error creating session:', err);
      setError(err.message || t('create_session_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-stone-100 dark:border-stone-700">
              <h2 className="text-xl font-semibold text-stone-900 dark:text-white">{t('create_modal.title')}</h2>
              <button onClick={onClose} className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm border border-red-100 dark:border-red-800 overflow-hidden"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{t('book_title')}</label>
                <input
                  type="text"
                  id="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 text-stone-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 transition-shadow"
                  placeholder={t('book_title_placeholder')}
                />
              </div>
              
              <div>
                <label htmlFor="author" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{t('author')}</label>
                <input
                  type="text"
                  id="author"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 text-stone-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 transition-shadow"
                  placeholder={t('author_placeholder')}
                />
              </div>
              
              <div>
                <label htmlFor="totalPages" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{t('total_pages_chapters')}</label>
                <input
                  type="number"
                  id="totalPages"
                  required
                  min="1"
                  value={totalPages}
                  onChange={(e) => setTotalPages(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 text-stone-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 transition-shadow"
                  placeholder={t('total_pages_placeholder')}
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700 transition"
                >
                  {t('create_modal.cancel')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-lg hover:from-rose-600 hover:to-rose-700 transition shadow-sm disabled:opacity-50"
                >
                  {loading ? t('create_modal.creating') : t('create_modal.create')}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
