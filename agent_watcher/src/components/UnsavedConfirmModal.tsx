/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface UnsavedConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function UnsavedConfirmModal({ isOpen, onConfirm, onCancel }: UnsavedConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="unsaved-modal">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400 rounded-lg shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
              変更内容の破棄確認
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-pre-line leading-relaxed">
              保存していない変更があります。
              このまま移動すると、編集中の内容は破棄されます。
              続行しますか？
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end items-center gap-2">
          <button
            id="cancel-modal-btn"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
          >
            キャンセル
          </button>
          <button
            id="confirm-modal-btn"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
          >
            続行する
          </button>
        </div>
      </div>
    </div>
  );
}
