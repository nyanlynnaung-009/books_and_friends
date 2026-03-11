import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UploadBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export default function UploadBookModal({ isOpen, onClose, onSuccess, userId }: UploadBookModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookFile) {
      setError('Please select a book file.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // 1. Upload Book File
      const bookExt = bookFile.name.split('.').pop();
      const bookFileName = `books/${Date.now()}-${Math.random().toString(36).substring(7)}.${bookExt}`;
      const { error: bookUploadError } = await supabase.storage
        .from('book_files')
        .upload(bookFileName, bookFile);
      
      if (bookUploadError) throw bookUploadError;
      const fileUrl = supabase.storage.from('book_files').getPublicUrl(bookFileName).data.publicUrl;

      // 2. Upload Cover File (if exists)
      let coverUrl = null;
      if (coverFile) {
        const coverExt = coverFile.name.split('.').pop();
        const coverFileName = `covers/${Date.now()}-${Math.random().toString(36).substring(7)}.${coverExt}`;
        const { error: coverUploadError } = await supabase.storage
          .from('book_files')
          .upload(coverFileName, coverFile);
        
        if (coverUploadError) throw coverUploadError;
        coverUrl = supabase.storage.from('book_files').getPublicUrl(coverFileName).data.publicUrl;
      }

      // 3. Create Book Record
      const { data: book, error: bookError } = await supabase
        .from('books')
        .insert({
          title,
          author,
          description,
          file_url: fileUrl,
          file_type: bookExt,
          cover_url: coverUrl,
          creator_id: userId,
          total_pages: 0
        })
        .select()
        .single();

      if (bookError) throw bookError;

      // 4. Create Reading Session for Discussion
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

      // 5. Add creator as participant
      await supabase
        .from('session_participants')
        .insert({
          session_id: session.id,
          user_id: userId,
          current_progress: 0
        });

      onSuccess();
      onClose();
      // Reset form
      setTitle('');
      setAuthor('');
      setDescription('');
      setBookFile(null);
      setCoverFile(null);
    } catch (err: any) {
      console.error('Error uploading book:', err);
      setError(err.message || t('upload_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t('upload_modal.title')}</h2>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm border border-red-100 dark:border-red-800">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Book Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Author</label>
            <input
              type="text"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('description')}</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('book_file')}</label>
            <div className="relative">
              <input
                type="file"
                required
                accept=".pdf,.epub"
                onChange={(e) => setBookFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('cover_image')}</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50"
              />
            </div>
          </div>
          
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              {t('upload_modal.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition disabled:opacity-50"
            >
              {loading ? t('upload_modal.uploading') : t('upload_modal.upload')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
