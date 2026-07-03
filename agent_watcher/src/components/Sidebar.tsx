/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Settings, Cpu, ShieldAlert, BookOpen } from 'lucide-react';
import { ToolKind } from '../types';

interface SidebarProps {
  activeTab: 'codex' | 'claude' | 'settings';
  onTabSelect: (tab: 'codex' | 'claude' | 'settings') => void;
  isDirty: boolean;
}

export default function Sidebar({ activeTab, onTabSelect, isDirty }: SidebarProps) {
  const menuItems = [
    {
      id: 'codex' as const,
      label: 'Codex設定',
      icon: BookOpen,
      desc: 'AGENTS.md, エージェント, スキル',
    },
    {
      id: 'claude' as const,
      label: 'Claude設定',
      icon: Cpu,
      desc: 'CLAUDE.md, エージェント, スキル',
    },
    {
      id: 'settings' as const,
      label: 'アプリ設定',
      icon: Settings,
      desc: 'グローバル・表示設定',
    },
  ];

  return (
    <aside className="w-full lg:w-64 bg-[#0F172A] text-slate-100 flex flex-col shrink-0 border-r border-slate-800/60" id="app-sidebar">
      {/* Branding Header */}
      <div className="p-6 border-b border-slate-800/60 space-y-1">
        <h1 className="text-white font-bold text-lg tracking-tight flex items-center gap-2">
          <div className="w-3 h-3 bg-indigo-500 rounded-xs shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.6)]"></div>
          エージェント設定ウォッチャー
        </h1>
        <p className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
          Agent Config Watcher
        </p>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-4 space-y-1.5" id="sidebar-nav">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => onTabSelect(item.id)}
              className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-start gap-3 relative ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
              <div className="space-y-0.5">
                <span className="block text-sm font-medium leading-none">{item.label}</span>
                <span className="block text-[10px] text-slate-500 leading-none">{item.desc}</span>
              </div>
              {item.id !== 'settings' && isDirty && activeTab === item.id && (
                <span className="absolute right-3 top-4 w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Repository / Metadata info panel */}
      <div className="p-4 border-t border-slate-800/60">
        <div className="bg-slate-800/50 rounded-xl p-4 space-y-1.5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Repository</p>
          <p className="text-xs text-slate-300 truncate font-mono">agent-config-watcher</p>
        </div>
      </div>
    </aside>
  );
}
