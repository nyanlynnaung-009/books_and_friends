import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Send, SmilePlus, CornerDownLeft, X, ExternalLink, Edit2, Trash2, Check, MessageSquareReply } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EMOJIS = ['👍', '❤️', '😂', '😲', '😢', '📖', '✨', '🤩', '📚'];

export default function SessionDetail({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { id } = useParams();
  const [session, setSession] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchSessionData = async () => {
    if (!id) return;
    
    // Fetch session and book details
    const { data: sessionData, error: sessionError } = await supabase
      .from('reading_sessions')
      .select('*, book:books(*)')
      .eq('id', id)
      .single();
      
    if (sessionError) {
      console.error(sessionError);
      if (sessionError.message?.includes('JWT expired')) {
        supabase.auth.signOut();
      }
      setLoading(false);
      return;
    }
    setSession(sessionData);

    // Fetch comments and reactions
    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        user_id,
        parent_id,
        reactions (
          id,
          user_id,
          reaction_type
        )
      `)
      .eq('session_id', id)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error(commentsError);
      setLoading(false);
      return;
    }

    setComments(commentsData || []);

    // Fetch profiles for the users who commented
    if (commentsData && commentsData.length > 0) {
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, email, avatar_url')
        .in('id', userIds);
        
      if (profilesData) {
        const profileMap = profilesData.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, any>);
        setProfiles(profileMap);
      }
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchSessionData();
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;

    const { error } = await supabase
      .from('comments')
      .insert({
        session_id: id,
        user_id: userId,
        content: newComment.trim(),
        parent_id: replyingTo?.id || null
      });

    if (!error) {
      setNewComment('');
      setReplyingTo(null);
      fetchSessionData(); // Refresh comments
    } else {
      alert('Error adding comment: ' + error.message);
    }
  };

  const handleReaction = async (commentId: string, emoji: string) => {
    // Check if user already reacted with this emoji
    const comment = comments.find(c => c.id === commentId);
    const existingReaction = comment?.reactions?.find(
      (r: any) => r.user_id === userId && r.reaction_type === emoji
    );

    if (existingReaction) {
      // Remove reaction
      await supabase.from('reactions').delete().eq('id', existingReaction.id);
    } else {
      // Add reaction
      await supabase.from('reactions').insert({
        comment_id: commentId,
        user_id: userId,
        reaction_type: emoji
      });
    }
    fetchSessionData(); // Refresh to show new reactions
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) fetchSessionData();
    else alert('Error deleting comment: ' + error.message);
  };

  const handleEditComment = async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .update({ content: editContent.trim() })
      .eq('id', commentId);
    if (!error) {
      setEditingCommentId(null);
      fetchSessionData();
    } else {
      alert('Error updating comment: ' + error.message);
    }
  };

  const handleDeleteSession = async () => {
    // The database is configured with Cascade Delete, so this will automatically 
    // remove all associated comments, reactions, and participants.
    const { error: sessionError } = await supabase.from('reading_sessions').delete().eq('id', id);
    
    if (!sessionError) {
      alert('Session deleted successfully.');
      window.location.href = '/';
    } else {
      alert('Error deleting session: ' + sessionError.message);
    }
    setShowDeleteConfirm(false);
  };

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading session...</div>;
  if (!session) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Session not found</div>;

  const book = Array.isArray(session.book) ? session.book[0] : session.book;

  // Organize comments into threads
  const parentComments = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);

  const renderComment = (comment: any, isReply = false) => {
    const profile = profiles[comment.user_id];
    const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'Unknown User';
    
    const reactionCounts = EMOJIS.map(emoji => {
      const count = comment.reactions?.filter((r: any) => r.reaction_type === emoji).length || 0;
      const hasReacted = comment.reactions?.some((r: any) => r.reaction_type === emoji && r.user_id === userId);
      return { emoji, count, hasReacted };
    }).filter(r => r.count > 0 || r.hasReacted);

    const commentReplies = replies.filter(r => r.parent_id === comment.id);
    const isOwner = comment.user_id === userId;

    return (
      <div key={comment.id} className={`flex gap-3 ${isReply ? 'ml-10 mt-4' : ''}`}>
        <div className={`${isReply ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 overflow-hidden flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold shrink-0`}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1">
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 inline-block min-w-[120px]">
            <div className="font-medium text-sm text-slate-900 dark:text-white mb-1 flex justify-between items-center">
              {displayName}
              {isOwner && (
                <div className="flex gap-1 ml-2">
                  <button onClick={() => { setEditingCommentId(comment.id); setEditContent(comment.content); }} className="text-slate-400 hover:text-indigo-600">
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDeleteComment(comment.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            {editingCommentId === comment.id ? (
              <div className="flex gap-2">
                <input 
                  value={editContent} 
                  onChange={(e) => setEditContent(e.target.value)} 
                  className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-sm"
                />
                <button onClick={() => handleEditComment(comment.id)} className="text-indigo-600"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingCommentId(null)} className="text-slate-400"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{comment.content}</p>
            )}
          </div>
          
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {reactionCounts.map(({ emoji, count, hasReacted }) => (
              <button
                key={emoji}
                onClick={() => handleReaction(comment.id, emoji)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition ${
                  hasReacted 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <span>{emoji}</span>
                {count > 0 && <span className="font-medium">{count}</span>}
              </button>
            ))}
            
            <div className="relative group">
              <button className="inline-flex items-center justify-center w-6 h-6 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <SmilePlus className="w-4 h-4" />
              </button>
              <div className="absolute left-0 bottom-full mb-1 hidden group-hover:flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-full p-1 gap-1 z-10">
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(comment.id, emoji)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {!isReply && (
              <button 
                onClick={() => setReplyingTo({ id: comment.id, user: displayName })}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium flex items-center gap-1 px-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <CornerDownLeft className="w-3 h-3" /> {t('session_detail.reply')}
              </button>
            )}
          </div>

          {commentReplies.map(reply => renderComment(reply, true))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/" className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> {t('session_detail.back_to_dashboard')}
      </Link>
      
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-6">
        {book?.cover_url && (
          <img src={book.cover_url} alt={book.title} className="w-32 h-48 object-cover rounded-lg shadow-sm shrink-0" referrerPolicy="no-referrer" />
        )}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{book?.title}</h2>
            {session.creator_id === userId && (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
              >
                {t('delete_session')}
              </button>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-lg">{t('by')} {book?.author}</p>
          {book?.description && (
            <p className="mt-4 text-slate-700 dark:text-slate-400 whitespace-pre-wrap">{book.description}</p>
          )}
          <div className="mt-4 text-sm text-slate-500 dark:text-slate-500">
            {t('session_detail.total_pages')} {book?.total_pages || '?'}
          </div>
        </div>
      </div>

      {book?.file_url && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">{t('read_book')}</h3>
            <a href={book.file_url} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline flex items-center gap-1">
              {t('open_new_tab')} <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <iframe src={book.file_url} className="w-full h-[70vh] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900" title={book.title} />
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Delete Session?</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">Are you sure you want to delete this session? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300">Cancel</button>
              <button onClick={handleDeleteSession} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">{t('session_detail.discussion')}</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {comments.length === 0 ? (
            <div className="text-center text-slate-500 dark:text-slate-400 py-8">{t('session_detail.no_comments_yet')}</div>
          ) : (
            parentComments.map(comment => renderComment(comment))
          )}
        </div>
        
        <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          {replyingTo && (
            <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 border-b border-indigo-100 dark:border-indigo-800/50 flex items-center justify-between">
              <div className="text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                <CornerDownLeft className="w-3 h-3" /> {t('session_detail.replying_to')} <span className="font-bold">{replyingTo.user}</span>
              </div>
              <button 
                onClick={() => setReplyingTo(null)}
                className="text-indigo-400 dark:text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <form onSubmit={handleAddComment} className="p-4 flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? `${t('session_detail.reply')} ${replyingTo.user}...` : t('session_detail.share_thoughts')}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              autoFocus={!!replyingTo}
            />
            <button 
              type="submit"
              disabled={!newComment.trim()}
              className="bg-indigo-600 dark:bg-indigo-500 text-white p-2 w-10 h-10 rounded-full flex items-center justify-center hover:bg-indigo-700 dark:hover:bg-indigo-600 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
