import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Send, Smile, Reply, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EMOJIS = ['👍', '❤️', '😂', '😲', '😢'];

export default function SessionDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params;
  const insets = useSafeAreaInsets();

  const [session, setSession] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessionData();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, [id]);

  const fetchSessionData = async () => {
    if (!id) return;
    
    const { data: sessionData, error: sessionError } = await supabase
      .from('reading_sessions')
      .select('*, book:books(*)')
      .eq('id', id)
      .single();
      
    if (sessionError) {
      console.error(sessionError);
      if (sessionError.message?.includes('JWT expired')) {
        await supabase.auth.signOut();
      }
      setLoading(false);
      return;
    }
    setSession(sessionData);

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

  const handleAddComment = async () => {
    if (!newComment.trim() || !id || !userId) return;

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
      fetchSessionData();
    } else {
      console.error('Error adding comment:', error);
    }
  };

  const handleReaction = async (commentId: string, emoji: string) => {
    if (!userId) return;
    const comment = comments.find(c => c.id === commentId);
    const existingReaction = comment?.reactions?.find(
      (r: any) => r.user_id === userId && r.reaction_type === emoji
    );

    if (existingReaction) {
      await supabase.from('reactions').delete().eq('id', existingReaction.id);
    } else {
      await supabase.from('reactions').insert({
        comment_id: commentId,
        user_id: userId,
        reaction_type: emoji
      });
    }
    fetchSessionData();
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const book = Array.isArray(session?.book) ? session.book[0] : session?.book;
  const parentComments = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);

  const renderComment = ({ item, isReply = false }: { item: any, isReply?: boolean }) => {
    const profile = profiles[item.user_id];
    const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'Unknown User';
    
    const reactionCounts = EMOJIS.map(emoji => {
      const count = item.reactions?.filter((r: any) => r.reaction_type === emoji).length || 0;
      const hasReacted = item.reactions?.some((r: any) => r.reaction_type === emoji && r.user_id === userId);
      return { emoji, count, hasReacted };
    }).filter(r => r.count > 0 || r.hasReacted);

    const commentReplies = replies.filter(r => r.parent_id === item.id);

    return (
      <View key={item.id} style={[styles.commentContainer, isReply && styles.replyContainer]}>
        <View style={[styles.avatar, isReply && styles.avatarSmall]}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.commentContent}>
          <View style={styles.commentBubble}>
            <Text style={styles.commentAuthor}>{displayName}</Text>
            <Text style={styles.commentText}>{item.content}</Text>
          </View>
          
          <View style={styles.actionsRow}>
            {reactionCounts.map(({ emoji, count, hasReacted }) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => handleReaction(item.id, emoji)}
                style={[styles.reactionBadge, hasReacted && styles.reactionBadgeActive]}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                {count > 0 && <Text style={[styles.reactionCount, hasReacted && styles.reactionCountActive]}>{count}</Text>}
              </TouchableOpacity>
            ))}
            
            <View style={styles.emojiPickerRow}>
              {EMOJIS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => handleReaction(item.id, emoji)}
                  style={styles.quickEmoji}
                >
                  <Text style={styles.quickEmojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {!isReply && (
              <TouchableOpacity 
                onPress={() => setReplyingTo({ id: item.id, user: displayName })}
                style={styles.replyButton}
              >
                <Reply size={14} color="#64748b" />
                <Text style={styles.replyButtonText}>Reply</Text>
              </TouchableOpacity>
            )}
          </View>

          {commentReplies.map(reply => renderComment({ item: reply, isReply: true }))}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.bookTitle}>{book?.title}</Text>
        <Text style={styles.bookAuthor}>by {book?.author}</Text>
      </View>

      <FlatList
        data={parentComments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No comments yet. Be the first to start the discussion!</Text>}
      />

      <View style={[styles.inputWrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {replyingTo && (
          <View style={styles.replyingToContainer}>
            <View style={styles.replyingToTextContainer}>
              <Reply size={14} color="#4f46e5" />
              <Text style={styles.replyingToText}>Replying to <Text style={styles.replyingToUser}>{replyingTo.user}</Text></Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newComment}
            onChangeText={setNewComment}
            placeholder={replyingTo ? `Reply to ${replyingTo.user}...` : "Share your thoughts..."}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]} 
            onPress={handleAddComment}
            disabled={!newComment.trim()}
          >
            <Send size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  bookAuthor: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  replyContainer: {
    marginTop: 12,
    marginBottom: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#4f46e5',
    fontWeight: 'bold',
    fontSize: 16,
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignSelf: 'flex-start',
  },
  commentAuthor: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  reactionBadgeActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 4,
    color: '#64748b',
    fontWeight: '500',
  },
  reactionCountActive: {
    color: '#4f46e5',
  },
  emojiPickerRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  quickEmoji: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  quickEmojiText: {
    fontSize: 14,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  replyButtonText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 40,
  },
  inputWrapper: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e7ff',
  },
  replyingToTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyingToText: {
    fontSize: 12,
    color: '#4f46e5',
    marginLeft: 6,
  },
  replyingToUser: {
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 0,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 16,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#4f46e5',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
});
