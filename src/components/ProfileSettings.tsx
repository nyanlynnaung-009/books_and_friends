import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, Camera, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ProfileSettings({ userId, onProfileUpdate }: { userId: string, onProfileUpdate?: () => void }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    getProfile();
    getCurrentUser();
  }, [userId]);

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  }

  async function getProfile() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, role')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) {
        setDisplayName(data.display_name || '');
        setAvatarUrl(data.avatar_url);
        setIsAdmin(data.role === 'admin');
      }
    } catch (error: any) {
      console.error('Error loading profile:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      setUpdating(true);
      setMessage(null);

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          avatar_url: avatarUrl,
        })
        .eq('id', userId);

      if (error) throw error;
      setMessage({ type: 'success', text: t('profile_settings.success_msg') });
      onProfileUpdate?.();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUpdating(false);
    }
  }

  async function removeAvatar() {
    try {
      setUpdating(true);
      setMessage(null);

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (error) throw error;

      setAvatarUrl(null);
      setMessage({ type: 'success', text: t('profile_settings.success_msg') });
      onProfileUpdate?.();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUpdating(false);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUpdating(true);
      setMessage(null);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      
      // Also update the profile immediately with the new URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setMessage({ type: 'success', text: t('profile_settings.success_msg') });
      onProfileUpdate?.();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUpdating(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-rose-600 dark:text-rose-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white dark:bg-stone-800 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden transition-colors duration-200">
        <div className="p-8 border-b border-stone-100 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-3 font-serif">
            {t('profile_settings.title')}
            {isAdmin && (
              <span className="bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider">{t('admin')}</span>
            )}
          </h2>
          <p className="text-stone-500 dark:text-stone-400 mt-1">{t('profile_settings.subtitle')}</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-stone-100 dark:bg-stone-700 border-4 border-white dark:border-stone-800 shadow-md overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-16 h-16 text-stone-300 dark:text-stone-500" />
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                <Camera className="w-8 h-8 text-white" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={uploadAvatar} 
                  disabled={updating}
                  className="hidden"
                />
              </label>
            </div>
            <div className="text-center space-y-2">
              <div>
                <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('profile_settings.avatar')}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{t('profile_settings.change_avatar')}</p>
              </div>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  disabled={updating}
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition"
                >
                  {t('profile_settings.remove_avatar')}
                </button>
              )}
            </div>
          </div>

          <form onSubmit={updateProfile} className="space-y-6">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                {t('profile_settings.display_name')}
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('profile_settings.name_placeholder')}
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500/50 dark:focus:ring-rose-400/50 focus:border-rose-500 dark:focus:border-rose-400 outline-none transition-all"
              />
            </div>

            {message && (
              <div className={`flex items-center gap-2 p-4 rounded-xl text-sm ${
                message.type === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' 
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={updating}
              className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white py-3 px-4 rounded-xl font-medium hover:from-rose-600 hover:to-rose-700 shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updating && <Loader2 className="w-5 h-5 animate-spin" />}
              {updating ? t('profile_settings.saving') : t('profile_settings.save_changes')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
