import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Trash2, User, UserX, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ConfirmModal from './ConfirmModal';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('email', { ascending: true });
      
    if (!error && data) {
      setProfiles(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const deleteProfile = async () => {
    if (!deletingId) return;
    
    setIsDeleting(true);
    setErrorMsg(null);
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', deletingId);
      
    setIsDeleting(false);
    
    if (!error) {
      setDeletingId(null);
      fetchProfiles();
    } else {
      setErrorMsg(t('error_deleting_profile'));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-stone-900 dark:text-white font-serif">{t('admin_dashboard')}</h2>
      
      {errorMsg && (
        <div className="flex items-center gap-2 p-4 rounded-lg text-sm bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800">
          <AlertCircle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}
      
      {loading ? (
        <div className="text-stone-500 dark:text-stone-400">{t('loading')}</div>
      ) : (
        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-400 text-sm uppercase">
              <tr>
                <th className="px-6 py-4">{t('profile')}</th>
                <th className="px-6 py-4">{t('email')}</th>
                <th className="px-6 py-4">{t('role')}</th>
                <th className="px-6 py-4">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
              {profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 overflow-hidden flex items-center justify-center shrink-0">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt={profile.display_name || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User className="w-5 h-5 text-stone-400 dark:text-stone-500" />
                        )}
                      </div>
                      <span className="font-medium text-stone-900 dark:text-white">
                        {profile.display_name || 'Anonymous'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-stone-500 dark:text-stone-400">{profile.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${
                      profile.role === 'admin' 
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' 
                        : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-400'
                    }`}>
                      {profile.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setDeletingId(profile.id)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg transition-colors"
                      title="Delete user"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={deleteProfile}
        title={t('confirm_delete_profile')}
        message="Are you sure you want to delete this user? This action cannot be undone and all associated data will be permanently lost."
        confirmText="Delete User"
        isLoading={isDeleting}
      />
    </div>
  );
}
