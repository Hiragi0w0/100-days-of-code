/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ToolKind = 'codex' | 'claude';

export interface ConfigFile {
  name: string;
  path: string; // Relative path within the environment
  category: 'instruction' | 'config' | 'agent' | 'skill';
  type: 'internal' | 'managed';
  exists: boolean;
  content?: string;
}

export interface NewsItem {
  title: string;
  date: string;
  summary: string;
  url: string;
}

export type ThemeKind = 'light' | 'dark' | 'system';

export interface AppSettings {
  newsEnabled: boolean;
  theme: ThemeKind;
}
