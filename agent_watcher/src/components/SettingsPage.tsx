/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Settings, Check, Loader2, Save } from 'lucide-react';
import { AppSettings, ThemeKind } from '../types';

interface SettingsPageProps {
  onSettingsChange?: (settings: AppSettings) => void;
}

export default function SettingsPage({ onSettingsChange }: SettingsPageProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [checkingTauri, setCheckingTauri] = useState(false);
  const [tauriStatus, setTauriStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching settings:', err);
        setLoading(false);
      });
  }, []);

  const handleToggleNews = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!settings) return;
    setSettings({ ...settings, newsEnabled: e.target.checked });
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!settings) return;
    setSettings({ ...settings, theme: e.target.value as ThemeKind });
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        if (onSettingsChange) {
          onSettingsChange(settings);
        }
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const checkTauriBackend = async () => {
    setCheckingTauri(true);
    setTauriStatus('idle');
    try {
      await invoke('cmd_health_check');
      setTauriStatus('success');
    } catch (err) {
      console.error('Failed to connect to Tauri backend:', err);
      setTauriStatus('error');
    } finally {
      setCheckingTauri(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" id="settings-loading">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6" id="settings-page">
      {/* Header Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-5 shadow-xs">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-indigo-500" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">アプリ設定</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          アプリ全体の表示や外部情報取得に関する設定を変更します。
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <label htmlFor="newsEnabled-toggle" className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
              更新情報パネルを有効にする
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              CodexおよびClaude設定ページに、Gemini APIによる最新の公式アップデート情報を取得して表示するパネルを配置します。
            </p>
          </div>
          <div className="flex items-center h-6">
            <input
              id="newsEnabled-toggle"
              type="checkbox"
              checked={settings?.newsEnabled || false}
              onChange={handleToggleNews}
              className="w-5 h-5 rounded-xs border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-colors"
            />
          </div>
        </div>

        {/* Theme Settings Section */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
          <div className="space-y-1 mb-4">
            <label htmlFor="theme-select" className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
              テーマ設定
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              アプリケーションの表示モード（ライト・ダーク・システム設定）を選択します。
            </p>
          </div>
          <select
            id="theme-select"
            value={settings?.theme || 'system'}
            onChange={handleThemeChange}
            className="w-full max-w-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-zinc-950 text-slate-800 dark:text-slate-100 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
          >
            <option value="light">ライトモード</option>
            <option value="dark">ダークモード</option>
            <option value="system">システム設定に従う</option>
          </select>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
          <div className="text-sm">
            {saved && (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold animate-fade-in" id="settings-saved-msg">
                <Check className="w-4 h-4 shrink-0" />
                設定を保存しました
              </span>
            )}
          </div>
          <button
            id="save-settings-btn"
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-indigo-200/40 dark:shadow-none disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            保存
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Tauriバックエンド接続確認
            </p>
            {tauriStatus === 'success' && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Tauriバックエンドに接続できました
              </p>
            )}
            {tauriStatus === 'error' && (
              <p className="text-xs text-rose-600 dark:text-rose-400">
                Tauriバックエンドに接続できませんでした
              </p>
            )}
          </div>
          <button
            id="check-tauri-backend-btn"
            onClick={checkTauriBackend}
            disabled={checkingTauri}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
          >
            {checkingTauri && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            確認
          </button>
        </div>
      </div>
    </div>
  );
}
