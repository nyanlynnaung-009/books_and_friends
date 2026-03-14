import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Trash2, User, UserX, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ConfirmModal from './ConfirmModal';
import { motion } from 'framer-motion';

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-stone-900 dark:text-white font-serif flex items-center gap-3">
          <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-2 rounded-xl text-white shadow-sm">
            <User className="w-6 h-6" />
          </div>
          {t('admin_dashboard')}
        </h2>
      </div>
      
      {errorMsg && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-2 p-4 rounded-xl text-sm bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          {errorMsg}
        </motion.div>
      )}
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400 dark:text-stone-500">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-rose-500" />
          <p>{t('loading')}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-800 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-stone-50 dark:bg-stone-900/50 text-stone-600 dark:text-stone-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 border-b border-stone-200 dark:border-stone-700">{t('profile')}</th>
                  <th className="px-6 py-4 border-b border-stone-200 dark:border-stone-700">{t('email')}</th>
                  <th className="px-6 py-4 border-b border-stone-200 dark:border-stone-700">{t('role')}</th>
                  <th className="px-6 py-4 border-b border-stone-200 dark:border-stone-700 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <motion.tbody 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-stone-100 dark:divide-stone-700/50"
              >
                {profiles.map((profile) => (
                  <motion.tr key={profile.id} variants={itemVariants} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
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
                    <td className="px-6 py-4 text-sm text-stone-500 dark:text-stone-400">{profile.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        profile.role === 'admin' 
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' 
                          : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                      }`}>
                        {profile.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setDeletingId(profile.id)}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete user"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
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
    </motion.div>
  );
}
