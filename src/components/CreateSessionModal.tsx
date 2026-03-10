import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X } from 'lucide-react';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export default function CreateSessionModal({ isOpen, onClose, onSuccess, userId }: CreateSessionModalProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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
      setError(err.message || 'An error occurred while creating the session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-900">Create Reading Session</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Book Title</label>
            <input
              type="text"
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. The Great Gatsby"
            />
          </div>
          
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-slate-700 mb-1">Author</label>
            <input
              type="text"
              id="author"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. F. Scott Fitzgerald"
            />
          </div>
          
          <div>
            <label htmlFor="totalPages" className="block text-sm font-medium text-slate-700 mb-1">Total Pages (or Chapters)</label>
            <input
              type="number"
              id="totalPages"
              required
              min="1"
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 218"
            />
          </div>
          
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
