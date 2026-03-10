import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Send, Smile, Reply, X } from 'lucide-react';

const EMOJIS = ['👍', '❤️', '😂', '😲', '😢'];

export default function SessionDetail({ userId }: { userId: string }) {
  const { id } = useParams();
  const [session, setSession] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-8 text-center text-slate-500">Loading session...</div>;
  if (!session) return <div className="p-8 text-center text-slate-500">Session not found</div>;

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

    return (
      <div key={comment.id} className={`flex gap-3 ${isReply ? 'ml-10 mt-4' : ''}`}>
        <div className={`${isReply ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-indigo-100 border border-indigo-200 overflow-hidden flex items-center justify-center text-indigo-700 font-bold shrink-0`}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1">
          <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100 inline-block min-w-[120px]">
            <div className="font-medium text-sm text-slate-900 mb-1">{displayName}</div>
            <p className="text-slate-700 whitespace-pre-wrap">{comment.content}</p>
          </div>
          
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {reactionCounts.map(({ emoji, count, hasReacted }) => (
              <button
                key={emoji}
                onClick={() => handleReaction(comment.id, emoji)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition ${
                  hasReacted 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{emoji}</span>
                {count > 0 && <span className="font-medium">{count}</span>}
              </button>
            ))}
            
            <div className="relative group">
              <button className="inline-flex items-center justify-center w-6 h-6 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                <Smile className="w-4 h-4" />
              </button>
              <div className="absolute left-0 bottom-full mb-1 hidden group-hover:flex bg-white border border-slate-200 shadow-lg rounded-full p-1 gap-1 z-10">
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(comment.id, emoji)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full transition text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {!isReply && (
              <button 
                onClick={() => setReplyingTo({ id: comment.id, user: displayName })}
                className="text-xs text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-1 px-2 py-1 rounded-full hover:bg-slate-100 transition"
              >
                <Reply className="w-3 h-3" /> Reply
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
      <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Link>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900">{book?.title}</h2>
        <p className="text-slate-600 text-lg">by {book?.author}</p>
        <div className="mt-2 text-sm text-slate-500">
          Total Pages: {book?.total_pages}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Discussion</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {comments.length === 0 ? (
            <div className="text-center text-slate-500 py-8">No comments yet. Be the first to start the discussion!</div>
          ) : (
            parentComments.map(comment => renderComment(comment))
          )}
        </div>
        
        <div className="border-t border-slate-200 bg-white">
          {replyingTo && (
            <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
              <div className="text-xs text-indigo-700 flex items-center gap-2">
                <Reply className="w-3 h-3" /> Replying to <span className="font-bold">{replyingTo.user}</span>
              </div>
              <button 
                onClick={() => setReplyingTo(null)}
                className="text-indigo-400 hover:text-indigo-600"
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
              placeholder={replyingTo ? `Reply to ${replyingTo.user}...` : "Share your thoughts..."}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus={!!replyingTo}
            />
            <button 
              type="submit"
              disabled={!newComment.trim()}
              className="bg-indigo-600 text-white p-2 w-10 h-10 rounded-full flex items-center justify-center hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
