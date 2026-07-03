/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ConfigPage from './components/ConfigPage';
import SettingsPage from './components/SettingsPage';
import UnsavedConfirmModal from './components/UnsavedConfirmModal';
import { ThemeKind, AppSettings } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'codex' | 'claude' | 'settings'>('codex');
  const [isDirty, setIsDirty] = useState(false);
  const [newsEnabled, setNewsEnabled] = useState(true);
  const [theme, setTheme] = useState<ThemeKind>('system');

  // Guard for page transition
  const [pendingTab, setPendingTab] = useState<'codex' | 'claude' | 'settings' | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const pageLeaveGuardRef = useRef<(() => boolean) | null>(null);

  // Fetch settings on mount to set newsEnabled and theme
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.newsEnabled === 'boolean') {
          setNewsEnabled(data.newsEnabled);
        }
        if (data.theme) {
          setTheme(data.theme);
        }
      })
      .catch((err) => console.error('Failed to load initial settings in App:', err));
  }, [activeTab]); // re-fetch when tab is swapped to get the most updated settings

  // Effect to apply theme classes to HTML root element
  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (currentTheme: 'light' | 'dark') => {
      if (currentTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches ? 'dark' : 'light');

      const listener = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  const handleTabSelect = (tab: 'codex' | 'claude' | 'settings') => {
    if (tab === activeTab) return;

    if (isDirty) {
      setPendingTab(tab);
      setShowConfirmModal(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleSettingsChange = (newSettings: AppSettings) => {
    setNewsEnabled(newSettings.newsEnabled);
    setTheme(newSettings.theme);
  };

  const handleConfirmDiscard = () => {
    setShowConfirmModal(false);
    setIsDirty(false); // Clear dirtiness of editor
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const handleCancelDiscard = () => {
    setShowConfirmModal(false);
    setPendingTab(null);
  };

  const registerPageLeaveGuard = (guard: (() => boolean) | null) => {
    pageLeaveGuardRef.current = guard;
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8FAFC] dark:bg-zinc-950 font-sans" id="app-root">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabSelect={handleTabSelect}
        isDirty={isDirty}
      />

      {/* Main Content Area Column */}
      <div className="flex-1 flex flex-col justify-between" id="content-column">
        <main className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto" id="app-main">
          <div className="animate-fade-in" key={activeTab}>
            {activeTab === 'codex' && (
              <ConfigPage
                tool="codex"
                newsEnabled={newsEnabled}
                onDirtyChange={setIsDirty}
                registerPageLeaveGuard={registerPageLeaveGuard}
              />
            )}

            {activeTab === 'claude' && (
              <ConfigPage
                tool="claude"
                newsEnabled={newsEnabled}
                onDirtyChange={setIsDirty}
                registerPageLeaveGuard={registerPageLeaveGuard}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPage onSettingsChange={handleSettingsChange} />
            )}
          </div>
        </main>

        {/* Footer Status Bar */}
        <footer className="bg-[#0F172A] text-slate-500 px-8 py-2.5 flex justify-between items-center text-[10px] font-medium border-t border-slate-800">
          <div className="flex gap-4">
            <span>Connected to Agent Engine</span>
            <span className="text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
              Online
            </span>
          </div>
          <div className="flex gap-4">
            <span>UTF-8</span>
            <span>LF</span>
            <span>Markdown</span>
          </div>
        </footer>
      </div>

      {/* Unsaved changes confirmation modal for tab-switching */}
      <UnsavedConfirmModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmDiscard}
        onCancel={handleCancelDiscard}
      />
    </div>
  );
}
