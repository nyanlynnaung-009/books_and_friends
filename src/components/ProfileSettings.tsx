import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, Camera, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ProfileSettings({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    getProfile();
  }, [userId]);

  async function getProfile() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, is_admin')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) {
        setDisplayName(data.display_name || '');
        setAvatarUrl(data.avatar_url);
        setIsAdmin(data.is_admin || false);
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
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-200">
        <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            {t('profile_settings.title')}
            {isAdmin && (
              <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider">Admin</span>
            )}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your public profile and avatar</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-700 border-4 border-white dark:border-slate-800 shadow-md overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-16 h-16 text-slate-300 dark:text-slate-500" />
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
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('profile_settings.avatar')}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('profile_settings.change_avatar')}</p>
            </div>
          </div>

          <form onSubmit={updateProfile} className="space-y-6">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('profile_settings.display_name')}
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition"
              />
            </div>

            {message && (
              <div className={`flex items-center gap-2 p-4 rounded-lg text-sm ${
                message.type === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' 
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={updating}
              className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updating && <Loader2 className="w-4 h-4 animate-spin" />}
              {updating ? t('profile_settings.saving') : t('profile_settings.save_changes')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
