/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  FolderOpen,
  Plus,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Cpu,
  Bookmark
} from 'lucide-react';
import { ToolKind, ConfigFile, NewsItem } from '../types';
import UnsavedConfirmModal from './UnsavedConfirmModal';

interface ConfigPageProps {
  tool: ToolKind;
  newsEnabled: boolean;
  onDirtyChange: (isDirty: boolean) => void;
  registerPageLeaveGuard: (guard: (() => boolean) | null) => void;
}

export default function ConfigPage({ tool, newsEnabled, onDirtyChange, registerPageLeaveGuard }: ConfigPageProps) {
  const [files, setFiles] = useState<ConfigFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [selectedFile, setSelectedFile] = useState<ConfigFile | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [savingFile, setSavingFile] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Unsaved changes transition handling
  const [pendingFileSelect, setPendingFileSelect] = useState<ConfigFile | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Agent/Skill creation forms
  const [agentName, setAgentName] = useState('');
  const [skillName, setSkillName] = useState('');
  const [createStatus, setCreateStatus] = useState<{
    type: 'agent' | 'skill' | 'file';
    status: 'idle' | 'success' | 'error' | 'conflict' | 'loading';
    message?: string;
  }>({ type: 'agent', status: 'idle' });

  // News State
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [newsStatus, setNewsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const isDirty = editorContent !== originalContent;

  // Let parent know if we have unsaved changes
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  // Register page leave guard for this tab
  useEffect(() => {
    const checkUnsaved = () => {
      if (isDirty) {
        return window.confirm(
          "保存していない変更があります。\nこのまま移動すると、編集中の内容は破棄されます。\n続行しますか？"
        );
      }
      return true;
    };
    registerPageLeaveGuard(checkUnsaved);
    return () => {
      registerPageLeaveGuard(null);
    };
  }, [isDirty, registerPageLeaveGuard]);

  // Load files list
  const loadFiles = async (selectDefaultPath?: string) => {
    setLoadingFiles(true);
    try {
      const res = await fetch(`/api/files?tool=${tool}`);
      if (res.ok) {
        const data: ConfigFile[] = await res.json();
        setFiles(data);

        // Auto select a file if specified, or default to the first file
        if (selectDefaultPath) {
          const matching = data.find((f) => f.path === selectDefaultPath);
          if (matching) {
            handleFileSelect(matching, true);
          }
        } else if (data.length > 0 && !selectedFile) {
          // Select AGENTS.md or CLAUDE.md by default
          const main = data.find((f) => f.category === 'instruction') || data[0];
          handleFileSelect(main, true);
        }
      }
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    setSelectedFile(null);
    setEditorContent('');
    setOriginalContent('');
    loadFiles();
    setNews([]);
    setNewsStatus('idle');
  }, [tool]);

  // Load specific file content
  const loadFileContent = async (file: ConfigFile) => {
    setLoadingContent(true);
    setSaveStatus('idle');
    try {
      const res = await fetch(`/api/file-content?tool=${tool}&path=${encodeURIComponent(file.path)}`);
      if (res.ok) {
        const data = await res.json();
        setEditorContent(data.content || '');
        setOriginalContent(data.content || '');
        setSelectedFile({ ...file, exists: data.exists });
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('Failed to load file content:', err);
      setSaveStatus('error');
    } finally {
      setLoadingContent(false);
    }
  };

  // Safe file selection checking for unsaved changes
  const handleFileSelect = (file: ConfigFile, force = false) => {
    if (!force && isDirty) {
      setPendingFileSelect(file);
      setShowUnsavedModal(true);
    } else {
      setSelectedFile(file);
      loadFileContent(file);
    }
  };

  const handleConfirmDiscard = () => {
    setShowUnsavedModal(false);
    if (pendingFileSelect) {
      setSelectedFile(pendingFileSelect);
      loadFileContent(pendingFileSelect);
      setPendingFileSelect(null);
    }
  };

  const handleCancelDiscard = () => {
    setShowUnsavedModal(false);
    setPendingFileSelect(null);
  };

  // Save File Content
  const handleSaveFile = async () => {
    if (!selectedFile) return;
    setSavingFile(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/save-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool,
          path: selectedFile.path,
          content: editorContent,
        }),
      });

      if (res.ok) {
        setOriginalContent(editorContent);
        setSaveStatus('success');
        // Refresh the file list to update "exists" status
        const updatedFiles = files.map((f) =>
          f.path === selectedFile.path ? { ...f, exists: true } : f
        );
        setFiles(updatedFiles);
        setSelectedFile({ ...selectedFile, exists: true });
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('Failed to save file:', err);
      setSaveStatus('error');
    } finally {
      setSavingFile(false);
    }
  };

  // Create instructions file (AGENTS.md / CLAUDE.md)
  const handleCreateMainFile = async (fileName: string) => {
    setCreateStatus({ type: 'file', status: 'loading' });
    const defaultTemplate = fileName === 'AGENTS.md'
      ? `# Codex 設定\n\nCodex用のグローバルな指示ファイルです。`
      : `# Claude Code 設定 (CLAUDE.md)\n\nClaude Code用の指示ファイルです。`;

    try {
      const res = await fetch('/api/create-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool,
          path: fileName,
          content: defaultTemplate,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCreateStatus({ type: 'file', status: 'success' });
        loadFiles(fileName);
        setTimeout(() => setCreateStatus({ type: 'file', status: 'idle' }), 3000);
      } else {
        const isConflict = res.status === 400 && data.error?.includes('存在します');
        setCreateStatus({
          type: 'file',
          status: isConflict ? 'conflict' : 'error',
          message: data.error,
        });
      }
    } catch (err) {
      setCreateStatus({ type: 'file', status: 'error' });
    }
  };

  // Create Agent or Skill Folder/Structure
  const handleCreateItem = async (category: 'agent' | 'skill') => {
    const nameValue = category === 'agent' ? agentName : skillName;
    if (!nameValue) return;

    setCreateStatus({ type: category, status: 'loading' });

    // Client-side regex check first
    const nameRegex = /^[a-zA-Z0-9-_]+$/;
    if (!nameRegex.test(nameValue)) {
      setCreateStatus({
        type: category,
        status: 'error',
        message: '使用できる文字は、英数字・ハイフン・アンダースコアのみです。',
      });
      return;
    }

    try {
      const res = await fetch('/api/create-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool,
          category,
          name: nameValue,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCreateStatus({ type: category, status: 'success' });
        if (category === 'agent') {
          setAgentName('');
        } else {
          setSkillName('');
        }
        // Reload files list, and auto select the newly created item's instruction file
        const targetPath = `${category === 'agent' ? 'agents' : 'skills'}/${nameValue}/instructions.md`;
        loadFiles(targetPath);
        setTimeout(() => setCreateStatus({ type: category, status: 'idle' }), 3000);
      } else {
        const isConflict = res.status === 400 && data.error?.includes('存在します');
        setCreateStatus({
          type: category,
          status: isConflict ? 'conflict' : 'error',
          message: data.error,
        });
      }
    } catch (err) {
      setCreateStatus({ type: category, status: 'error' });
    }
  };

  // Fetch News Updates using Gemini with Google Search Grounding
  const fetchNews = async () => {
    setLoadingNews(true);
    setNewsStatus('loading');
    try {
      const res = await fetch(`/api/news?tool=${tool}`);
      if (res.ok) {
        const data = await res.json();
        setNews(data);
        setNewsStatus('success');
      } else {
        setNewsStatus('error');
      }
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setNewsStatus('error');
    } finally {
      setLoadingNews(false);
    }
  };

  // Helper labels translations mapping
  const categoryLabels: Record<string, string> = {
    instruction: '指示ファイル',
    config: '設定ファイル',
    agent: 'エージェント',
    skill: 'スキル',
  };

  const typeLabels: Record<string, string> = {
    internal: '内部設定',
    managed: '管理設定',
  };

  return (
    <div className="space-y-6" id="config-page">
      {/* Header Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {tool === 'codex' ? 'Codex設定' : 'Claude設定'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {tool === 'codex'
                ? 'Codexが参照するグローバル設定ファイル、エージェント、スキルを確認・編集します。'
                : 'Claude Codeが参照するグローバル設定ファイル、エージェント、スキルを確認・編集します。'}
            </p>
          </div>
          {newsEnabled && (
            <div className="flex gap-2">
              <button
                id="fetch-news-btn"
                onClick={fetchNews}
                disabled={loadingNews}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingNews ? 'animate-spin' : ''}`} />
                更新情報を取得
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Explorer & Actions */}
        <div className="lg:col-span-3 space-y-6">
          {/* Config Files Section */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <FolderOpen className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">設定ファイル</h3>
            </div>

            {loadingFiles ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                {files.map((file) => {
                  const isActive = selectedFile?.path === file.path;
                  return (
                    <button
                      key={file.path}
                      onClick={() => handleFileSelect(file)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs transition-all duration-200 flex items-center justify-between gap-2 ${
                        isActive
                          ? 'border-indigo-500/30 bg-indigo-50/50 text-indigo-950 dark:bg-indigo-950/20 dark:text-indigo-200 font-semibold shadow-xs'
                          : 'border-slate-100 bg-white dark:border-slate-800 dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                        <span className="truncate">{file.name}</span>
                      </div>
                      {file.exists ? (
                        <span className="text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-100/50 dark:border-emerald-800/40 shrink-0">
                          作成済み
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold bg-slate-50 dark:bg-zinc-800 text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded border border-slate-100/50 dark:border-zinc-700 shrink-0">
                          未作成
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Create Actions Section */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Plus className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">新規作成</h3>
            </div>

            <div className="space-y-4">
              {files.some((f) => f.category === 'instruction' && !f.exists) && (
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <button
                    id="create-main-file-btn"
                    onClick={() => handleCreateMainFile(tool === 'codex' ? 'AGENTS.md' : 'CLAUDE.md')}
                    disabled={createStatus.status === 'loading'}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 dark:border-slate-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg transition-all shadow-xs disabled:opacity-50"
                  >
                    {createStatus.status === 'loading' && createStatus.type === 'file' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    ) : (
                      <span className="text-sm font-bold text-indigo-500">+</span>
                    )}
                    {tool === 'codex' ? 'AGENTS.mdを作成' : 'CLAUDE.mdを作成'}
                  </button>
                </div>
              )}

              {/* Agent Creation */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">エージェントを作成</h4>
                <div className="flex gap-2">
                  <input
                    id="agent-name-input"
                    type="text"
                    placeholder="例: rust-reviewer"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-zinc-950 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    id="create-agent-btn"
                    onClick={() => handleCreateItem('agent')}
                    disabled={createStatus.status === 'loading' || !agentName.trim()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-lg transition-all shadow-xs disabled:opacity-50 shrink-0"
                  >
                    作成
                  </button>
                </div>
              </div>

              {/* Skill Creation */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">スキルを作成</h4>
                <div className="flex gap-2">
                  <input
                    id="skill-name-input"
                    type="text"
                    placeholder="例: tauri-helper"
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-zinc-950 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    id="create-skill-btn"
                    onClick={() => handleCreateItem('skill')}
                    disabled={createStatus.status === 'loading' || !skillName.trim()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-lg transition-all shadow-xs disabled:opacity-50 shrink-0"
                  >
                    作成
                  </button>
                </div>
              </div>

              <div className="mt-3 bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-slate-800/60 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  <span className="font-bold">名前制限:</span><br/>使用できる文字は、英数字・ハイフン・アンダースコアのみです。
                </p>
              </div>

              {createStatus.status !== 'idle' && (
                <div className="mt-2 text-xs leading-relaxed">
                  {createStatus.status === 'success' && (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/20 animate-fade-in" id="create-success-msg">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      作成しました
                    </div>
                  )}
                  {createStatus.status === 'conflict' && (
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-100 dark:border-amber-900/20 animate-fade-in" id="create-conflict-msg">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      すでに存在します
                    </div>
                  )}
                  {createStatus.status === 'error' && (
                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/20 p-2 rounded-lg border border-rose-100 dark:border-rose-900/20 animate-fade-in" id="create-error-msg">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {createStatus.message || '作成に失敗しました'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Column: Editor Surface */}
        <div className={newsEnabled ? "lg:col-span-6 space-y-6" : "lg:col-span-9 space-y-6"}>
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
            {/* Editor header */}
            {selectedFile ? (
              <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex flex-col">
                    <span className="text-slate-400 dark:text-slate-500 uppercase font-bold text-[9px] tracking-widest">ファイル名</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono font-semibold" id="editor-file-name">{selectedFile.name}</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                  <div className="flex flex-col">
                    <span className="text-slate-400 dark:text-slate-500 uppercase font-bold text-[9px] tracking-widest">状態</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold" id="editor-file-status">
                      {selectedFile.exists ? (
                        <span className="text-emerald-600 dark:text-emerald-400">作成済み</span>
                      ) : (
                        <span className="text-slate-400">未作成</span>
                      )}
                    </span>
                  </div>
                  {isDirty && (
                    <>
                      <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-sm border border-amber-200/40">
                        未保存の変更あり
                      </span>
                    </>
                  )}
                </div>
                <button
                  id="save-file-btn"
                  onClick={handleSaveFile}
                  disabled={savingFile || loadingContent}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-indigo-200/40 dark:shadow-none disabled:opacity-50"
                >
                  {savingFile ? '保存中...' : '保存'}
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">ファイル編集</h3>
              </div>
            )}

            {/* Editor content or loading or fallback */}
            {loadingContent ? (
              <div className="flex justify-center items-center py-20 bg-slate-50/50 dark:bg-zinc-900/50">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : selectedFile ? (
              <div className="p-6 bg-slate-50/50 dark:bg-zinc-900/50">
                <div className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-inner flex flex-col overflow-hidden">
                  <div className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">内容 / Content</span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Markdown</span>
                  </div>
                  <textarea
                    id="editor-content-area"
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    placeholder={selectedFile.exists ? '空のファイル' : '未作成'}
                    className="w-full h-[380px] p-6 text-sm font-mono bg-white dark:bg-zinc-950 border-0 focus:outline-hidden focus:ring-0 text-slate-700 dark:text-slate-300 resize-y leading-relaxed"
                  />
                </div>

                {/* Feedback Toast */}
                {saveStatus === 'success' && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/20 p-2.5 rounded-lg animate-fade-in" id="save-success-msg">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    保存しました
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/20 p-2.5 rounded-lg animate-fade-in" id="save-error-msg">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    保存に失敗しました
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400 space-y-2">
                <FileText className="w-12 h-12 stroke-1 text-slate-300 dark:text-slate-700" />
                <p className="text-xs">エディタで確認・編集するファイルを選択してください。</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: News Panel */}
        {newsEnabled && (
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-900">
                <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  {tool === 'codex' ? 'Codex更新情報' : 'Claude更新情報'}
                </h3>
              </div>

              <div className="p-4 overflow-y-auto space-y-4 max-h-[580px]">
                {loadingNews ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3" id="news-loading-state">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    <p className="text-[10px] text-slate-400 font-medium">更新情報を取得しています</p>
                  </div>
                ) : newsStatus === 'error' ? (
                  <div className="py-8 text-center text-rose-500 bg-rose-50/50 dark:bg-rose-950/15 rounded-lg border border-rose-100 dark:border-rose-900/10 text-xs font-medium" id="news-error-state">
                    更新情報の取得に失敗しました
                  </div>
                ) : news.length > 0 ? (
                  <div className="space-y-4" id="news-list">
                    {news.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800/80 rounded-lg shadow-2xs space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400">
                            {item.title || 'アップデート'}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono shrink-0">{item.date}</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {item.summary}
                        </p>
                        {item.url && (
                          <div className="pt-1">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                            >
                              公式ページを開く
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12" id="news-empty-state">
                    <p className="text-xs text-slate-400 italic">表示できる更新情報はありません</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Unsaved confirm modal */}
      <UnsavedConfirmModal
        isOpen={showUnsavedModal}
        onConfirm={handleConfirmDiscard}
        onCancel={handleCancelDiscard}
      />
    </div>
  );
}
