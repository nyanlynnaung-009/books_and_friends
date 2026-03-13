import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, PlusSquare, LibraryBig } from 'lucide-react';
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
        <h2 className="text-3xl font-bold text-stone-900 dark:text-white flex items-center gap-3 font-serif">
          <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-2 rounded-xl text-white shadow-sm">
            <LibraryBig className="w-6 h-6" />
          </div>
          {t('library')}
        </h2>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white px-5 py-2.5 rounded-xl hover:from-rose-600 hover:to-rose-700 shadow-sm hover:shadow-md transition-all font-medium"
        >
          <PlusSquare className="w-5 h-5" />
          {t('upload_book')}
        </button>
      </div>

      {loading ? (
        <div className="text-stone-500 dark:text-stone-400 text-center py-12">{t('loading_sessions')}</div>
      ) : books.length === 0 ? (
        <div className="text-stone-500 dark:text-stone-400 text-center py-16 bg-white dark:bg-stone-800 rounded-3xl border border-stone-200 dark:border-stone-700 border-dashed">
          {t('no_books_library')}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {books.map((book) => {
            const sessionId = book.reading_sessions?.[0]?.id;
            return (
              <Link 
                to={sessionId ? `/session/${sessionId}` : '#'} 
                key={book.id} 
                className="block group bg-white dark:bg-stone-800 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden hover:shadow-xl hover:shadow-rose-500/10 hover:border-rose-200 dark:hover:border-rose-500/50 transition-all duration-300 flex flex-col h-full"
              >
                <div className="aspect-[2/3] bg-stone-100 dark:bg-stone-700 relative overflow-hidden">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-500">
                      <BookOpen className="w-12 h-12" />
                    </div>
                  )}
                  {book.file_type && (
                    <div className="absolute top-3 right-3 bg-black/60 dark:bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                      {book.file_type}
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-semibold text-stone-900 dark:text-white line-clamp-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{book.title}</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-1 mt-1">{book.author}</p>
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
