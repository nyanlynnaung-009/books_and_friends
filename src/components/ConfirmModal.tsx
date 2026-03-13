import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          <div className={`flex items-center justify-center w-12 h-12 mx-auto rounded-full mb-6 ${isDestructive ? 'bg-red-100 dark:bg-red-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
            <AlertTriangle className={`w-6 h-6 ${isDestructive ? 'text-red-600 dark:text-red-500' : 'text-rose-600 dark:text-rose-500'}`} />
          </div>
          
          <h3 className="text-xl font-bold text-center text-stone-900 dark:text-white mb-2 font-serif">
            {title}
          </h3>
          
          <p className="text-center text-stone-500 dark:text-stone-400 mb-8">
            {message}
          </p>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              disabled={isLoading} 
              className="flex-1 px-4 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm} 
              disabled={isLoading} 
              className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                isDestructive 
                  ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600' 
                  : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700'
              }`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
