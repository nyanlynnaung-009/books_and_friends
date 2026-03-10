import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { BookOpen, Users, MessageSquare, PlusCircle, LogOut } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import CreateSessionModal from './components/CreateSessionModal';
import SessionDetail from './components/SessionDetail';
import ProfileSettings from './components/ProfileSettings';

// Simple Dashboard Page
function Dashboard({ userId }: { userId: string }) {
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
      } else if (data) {
        console.log('Fetched sessions:', data);
        const processedData = data.map(session => {
          const bookData = Array.isArray(session.book) ? session.book[0] : session.book;
          return {
            ...session,
            bookTitle: bookData?.title || 'Unknown Book',
            bookAuthor: bookData?.author || 'Unknown Author',
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
        <h2 className="text-3xl font-bold text-slate-900">Reading Sessions</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <PlusCircle className="w-5 h-5" />
          Create Session
        </button>
      </div>
      
      {fetchError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error loading sessions:</strong> {fetchError}
        </div>
      )}

      {isLoading ? (
        <div className="text-slate-500 text-center py-12">Loading sessions...</div>
      ) : sessions.length === 0 && !fetchError ? (
        <div className="text-slate-500 text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
          No reading sessions found. Create one to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session: any) => (
            <Link to={`/session/${session.id}`} key={session.id} className="block group">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group-hover:shadow-md group-hover:border-indigo-200 transition h-full">
                <h3 className="text-xl font-semibold text-slate-900 group-hover:text-indigo-600 transition">{session.bookTitle}</h3>
                <p className="text-slate-600 mt-1">{session.bookAuthor}</p>
                <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1"><Users className="w-4 h-4" /> {session.participantsCount} members</div>
                  <div className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> {session.commentsCount} posts</div>
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
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

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
      .select('display_name, avatar_url')
      .eq('id', userId)
      .single();
    if (data) setProfile(data);
  };

  if (!session) {
    console.log('No session, showing Auth');
    return <Auth />;
  }

  console.log('Session exists, showing Dashboard');
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <BookOpen className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight">Books & Friends</h1>
            </div>
            <nav className="flex items-center gap-6">
              <Link to="/" className="text-slate-600 hover:text-indigo-600 font-medium">Dashboard</Link>
              <Link to="/profile" className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium group">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center group-hover:border-indigo-300 transition">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-slate-400 text-xs font-bold">{profile?.display_name?.charAt(0) || session.user.email?.charAt(0).toUpperCase()}</div>
                  )}
                </div>
                Profile
              </Link>
              <button onClick={() => supabase.auth.signOut()} className="text-slate-600 hover:text-red-600 font-medium flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </nav>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Routes>
            <Route path="/" element={<Dashboard userId={session.user.id} />} />
            <Route path="/session/:id" element={<SessionDetail userId={session.user.id} />} />
            <Route path="/profile" element={<ProfileSettings userId={session.user.id} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
