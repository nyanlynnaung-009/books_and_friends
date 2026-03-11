import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, PlusCircle, Library as LibraryIcon } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import UploadBookModal from './UploadBookModal';

export default function Library({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const [books, setBooks] = useState<any[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBooks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('books')
      .select('*, reading_sessions(id)')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setBooks(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <LibraryIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          {t('library')}
        </h2>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition"
        >
          <PlusCircle className="w-5 h-5" />
          {t('upload_book')}
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500 dark:text-slate-400 text-center py-12">{t('loading_sessions')}</div>
      ) : books.length === 0 ? (
        <div className="text-slate-500 dark:text-slate-400 text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed">
          {t('no_books_library')}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => {
            const sessionId = book.reading_sessions?.[0]?.id;
            return (
              <Link 
                to={sessionId ? `/session/${sessionId}` : '#'} 
                key={book.id} 
                className="block group bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500 transition flex flex-col h-full"
              >
                <div className="aspect-[2/3] bg-slate-100 dark:bg-slate-700 relative overflow-hidden">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-500">
                      <BookOpen className="w-12 h-12" />
                    </div>
                  )}
                  {book.file_type && (
                    <div className="absolute top-2 right-2 bg-black/60 dark:bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                      {book.file_type}
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{book.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{book.author}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <UploadBookModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchBooks}
        userId={userId}
      />
    </div>
  );
}
