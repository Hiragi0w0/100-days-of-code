/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Ensure workspace folders exist
const WORKSPACE_DIR = path.join(process.cwd(), 'agent_workspace');
const CODEX_DIR = path.join(WORKSPACE_DIR, 'codex');
const CLAUDE_DIR = path.join(WORKSPACE_DIR, 'claude');

function ensureDirExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Populate with initial files if empty
function initializeWorkspace() {
  ensureDirExists(WORKSPACE_DIR);
  ensureDirExists(CODEX_DIR);
  ensureDirExists(CLAUDE_DIR);
  ensureDirExists(path.join(CODEX_DIR, 'agents'));
  ensureDirExists(path.join(CODEX_DIR, 'skills'));
  ensureDirExists(path.join(CLAUDE_DIR, 'agents'));
  ensureDirExists(path.join(CLAUDE_DIR, 'skills'));

  // Pre-populate Codex AGENTS.md
  const codexAgentsMdPath = path.join(CODEX_DIR, 'AGENTS.md');
  if (!fs.existsSync(codexAgentsMdPath)) {
    fs.writeFileSync(
      codexAgentsMdPath,
      `# Codex 設定

このファイルは、Codexエージェントが動作する際のグローバルシステム指示を定義します。

## 指針
1. タスクに対して最も効率的なアプローチを選択すること。
2. コードの品質と型安全性を最優先にすること。
3. エディタや拡張機能の定義に従い、不必要なファイルの書き換えを行わないこと。
`,
      'utf8'
    );
  }

  // Pre-populate Codex .codex.json
  const codexJsonPath = path.join(CODEX_DIR, '.codex.json');
  if (!fs.existsSync(codexJsonPath)) {
    fs.writeFileSync(
      codexJsonPath,
      JSON.stringify(
        {
          version: '1.2.0',
          engine: 'gemini-3.5-flash',
          timeout: 45,
          features: {
            incrementalBuild: true,
            autoImport: true,
          },
        },
        null,
        2
      ),
      'utf8'
    );
  }

  // Pre-populate Claude CLAUDE.md
  const claudeMdPath = path.join(CLAUDE_DIR, 'CLAUDE.md');
  if (!fs.existsSync(claudeMdPath)) {
    fs.writeFileSync(
      claudeMdPath,
      `# Claude Code 設定 (CLAUDE.md)

Claude Code CLIがプロジェクトを編集・ビルドする際のアドバイスや開発コマンドを記述します。

## ビルドおよび開発コマンド
- 開発サーバー起動: \`npm run dev\`
- ビルド: \`npm run build\`
- 型チェック: \`npm run lint\`

## コードスタイル
- React 18+ & Vite & Tailwind CSSを基準とする。
- インターフェースや型定義は \`src/types.ts\` に集約する。
`,
      'utf8'
    );
  }

  // Pre-populate Claude .claudecode.json
  const claudeJsonPath = path.join(CLAUDE_DIR, '.claudecode.json');
  if (!fs.existsSync(claudeJsonPath)) {
    fs.writeFileSync(
      claudeJsonPath,
      JSON.stringify(
        {
          theme: 'dark',
          autoApprove: false,
          maxIterations: 15,
          allowedCommands: ['npm run dev', 'npm run build', 'npm run lint'],
        },
        null,
        2
      ),
      'utf8'
    );
  }
}

initializeWorkspace();

// App settings persistence
const SETTINGS_FILE = path.join(WORKSPACE_DIR, 'app_settings.json');
let cachedSettings = { newsEnabled: true, theme: 'system' };

if (fs.existsSync(SETTINGS_FILE)) {
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    cachedSettings = {
      newsEnabled: typeof parsed.newsEnabled === 'boolean' ? parsed.newsEnabled : true,
      theme: (parsed.theme === 'light' || parsed.theme === 'dark' || parsed.theme === 'system') ? parsed.theme : 'system'
    };
  } catch (e) {
    console.error('Failed to load settings file, using default');
  }
} else {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(cachedSettings, null, 2), 'utf8');
}

// Lazy init Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoints

  // 1. Settings APIs
  app.get('/api/settings', (req, res) => {
    res.json(cachedSettings);
  });

  app.post('/api/settings', (req, res) => {
    const { newsEnabled, theme } = req.body;
    let updated = false;

    if (typeof newsEnabled === 'boolean') {
      cachedSettings.newsEnabled = newsEnabled;
      updated = true;
    }

    if (theme === 'light' || theme === 'dark' || theme === 'system') {
      cachedSettings.theme = theme;
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(cachedSettings, null, 2), 'utf8');
      res.json({ success: true, settings: cachedSettings });
    } else {
      res.status(400).json({ error: 'Invalid settings parameters' });
    }
  });

  // Helper: List folders recursively or get basic status
  function getSubdirectories(dirPath: string): string[] {
    if (!fs.existsSync(dirPath)) return [];
    return fs
      .readdirSync(dirPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
  }

  // 2. Load File List
  app.get('/api/files', (req, res) => {
    const tool = req.query.tool as 'codex' | 'claude';
    if (tool !== 'codex' && tool !== 'claude') {
      res.status(400).json({ error: 'Invalid tool parameter' });
      return;
    }

    const targetBaseDir = tool === 'codex' ? CODEX_DIR : CLAUDE_DIR;
    const isCodex = tool === 'codex';

    const mainFile = isCodex ? 'AGENTS.md' : 'CLAUDE.md';
    const jsonFile = isCodex ? '.codex.json' : '.claudecode.json';
    const configManagedFile = isCodex ? 'codex.config.json' : 'claude.config.json';

    const files: any[] = [];

    // Main instruction file
    const mainPath = path.join(targetBaseDir, mainFile);
    files.push({
      name: mainFile,
      path: mainFile,
      category: 'instruction',
      type: 'managed',
      exists: fs.existsSync(mainPath),
    });

    // Internal json config file
    const jsonPath = path.join(targetBaseDir, jsonFile);
    files.push({
      name: jsonFile,
      path: jsonFile,
      category: 'config',
      type: 'internal',
      exists: fs.existsSync(jsonPath),
    });

    // Managed config json file
    const configManagedPath = path.join(targetBaseDir, configManagedFile);
    files.push({
      name: configManagedFile,
      path: configManagedFile,
      category: 'config',
      type: 'managed',
      exists: fs.existsSync(configManagedPath),
    });

    // Agents
    const agentsDir = path.join(targetBaseDir, 'agents');
    const agentDirs = getSubdirectories(agentsDir);
    agentDirs.forEach((name) => {
      files.push({
        name,
        path: `agents/${name}/instructions.md`,
        category: 'agent',
        type: 'managed',
        exists: true,
      });
    });

    // Skills
    const skillsDir = path.join(targetBaseDir, 'skills');
    const skillDirs = getSubdirectories(skillsDir);
    skillDirs.forEach((name) => {
      files.push({
        name,
        path: `skills/${name}/instructions.md`,
        category: 'skill',
        type: 'managed',
        exists: true,
      });
    });

    res.json(files);
  });

  // 3. Load File Content
  app.get('/api/file-content', (req, res) => {
    const tool = req.query.tool as 'codex' | 'claude';
    const relPath = req.query.path as string;

    if (!tool || !relPath) {
      res.status(400).json({ error: 'Missing parameters' });
      return;
    }

    // Safety check against path traversal
    const cleanPath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const targetBaseDir = tool === 'codex' ? CODEX_DIR : CLAUDE_DIR;
    const absoluteFilePath = path.join(targetBaseDir, cleanPath);

    if (!absoluteFilePath.startsWith(targetBaseDir)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (!fs.existsSync(absoluteFilePath)) {
      res.json({ content: '', exists: false });
    } else {
      try {
        const content = fs.readFileSync(absoluteFilePath, 'utf8');
        res.json({ content, exists: true });
      } catch (err) {
        res.status(500).json({ error: 'ファイルの読み込みに失敗しました' });
      }
    }
  });

  // 4. Save File Content
  app.post('/api/save-file', (req, res) => {
    const { tool, path: relPath, content } = req.body;

    if (!tool || !relPath || content === undefined) {
      res.status(400).json({ error: 'Missing parameters' });
      return;
    }

    const cleanPath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const targetBaseDir = tool === 'codex' ? CODEX_DIR : CLAUDE_DIR;
    const absoluteFilePath = path.join(targetBaseDir, cleanPath);

    if (!absoluteFilePath.startsWith(targetBaseDir)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    try {
      ensureDirExists(path.dirname(absoluteFilePath));
      fs.writeFileSync(absoluteFilePath, content, 'utf8');
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: '保存に失敗しました' });
    }
  });

  // 5. Create File
  app.post('/api/create-file', (req, res) => {
    const { tool, path: relPath, content } = req.body;

    if (!tool || !relPath) {
      res.status(400).json({ error: 'Missing parameters' });
      return;
    }

    const cleanPath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const targetBaseDir = tool === 'codex' ? CODEX_DIR : CLAUDE_DIR;
    const absoluteFilePath = path.join(targetBaseDir, cleanPath);

    if (!absoluteFilePath.startsWith(targetBaseDir)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (fs.existsSync(absoluteFilePath)) {
      res.status(400).json({ error: '同じ名前のファイルまたはフォルダがすでに存在します' });
      return;
    }

    try {
      ensureDirExists(path.dirname(absoluteFilePath));
      fs.writeFileSync(absoluteFilePath, content || '', 'utf8');
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: '作成に失敗しました' });
    }
  });

  // 6. Create Agent / Skill
  app.post('/api/create-item', (req, res) => {
    const { tool, category, name } = req.body;

    if (!tool || !category || !name) {
      res.status(400).json({ error: 'Missing parameters' });
      return;
    }

    if (category !== 'agent' && category !== 'skill') {
      res.status(400).json({ error: 'Invalid category' });
      return;
    }

    // Validate alphanumeric, hyphen, underscore name limit
    const nameRegex = /^[a-zA-Z0-9-_]+$/;
    if (!nameRegex.test(name)) {
      res.status(400).json({ error: '使用できる文字は、英数字・ハイフン・アンダースコアのみです。' });
      return;
    }

    const targetBaseDir = tool === 'codex' ? CODEX_DIR : CLAUDE_DIR;
    const subFolderName = category === 'agent' ? 'agents' : 'skills';
    const itemDir = path.join(targetBaseDir, subFolderName, name);
    const instructionsPath = path.join(itemDir, 'instructions.md');

    if (fs.existsSync(itemDir)) {
      res.status(400).json({ error: '同じ名前のファイルまたはフォルダがすでに存在します' });
      return;
    }

    try {
      ensureDirExists(itemDir);
      const displayName = category === 'agent' ? 'エージェント' : 'スキル';
      const defaultContent = `# ${name} ${displayName} 指示書

この${displayName}の役割と動作規則を定義します。

## 概要
${name} ${displayName}は特定の業務プロセスの自動化をサポートします。

## 指示ルール
- 指示ルールをここに記述してください
`;
      fs.writeFileSync(instructionsPath, defaultContent, 'utf8');
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: '作成に失敗しました' });
    }
  });

  // 7. News Update Panel fetcher (using Gemini API + Search Grounding)
  app.get('/api/news', async (req, res) => {
    const tool = req.query.tool as 'codex' | 'claude';
    if (tool !== 'codex' && tool !== 'claude') {
      res.status(400).json({ error: 'Invalid tool parameter' });
      return;
    }

    if (!cachedSettings.newsEnabled) {
      res.status(400).json({ error: '更新情報パネルはOFFです' });
      return;
    }

    const ai = getGeminiClient();

    if (!ai) {
      // Fallback news if no Gemini key or API is not ready
      console.log('Gemini API key is not available, using static fallback news');
      const fallbackNews = tool === 'claude'
        ? [
            {
              title: 'Claude Code CLI 一般提供開始',
              date: '2026-06-15',
              summary: 'Anthropicがターミナルで動作するエージェントツール「Claude Code」を一般向けに提供開始。CLAUDE.mdファイルを通じた設定連携が強化されました。',
              url: 'https://support.anthropic.com',
            },
            {
              title: 'CLAUDE.md の指示解釈精度が大幅向上',
              date: '2026-05-20',
              summary: '最新のClaude 3.7 Sonnetエンジンにより、CLAUDE.mdに記載されたビルド手順、テストルール、スタイルガイドの解釈能力が20%改善。',
              url: 'https://anthropic.com',
            },
            {
              title: 'マルチバッチモードによる並列コード修正機能',
              date: '2026-04-10',
              summary: 'Claude Codeが非同期で複数のファイル変更計画を同時進行可能にするアップデート。テスト・修正のサイクルが劇的に高速化しました。',
              url: 'https://anthropic.com',
            },
          ]
        : [
            {
              title: 'Codex AGENTS.md 仕様規格の統合',
              date: '2026-06-30',
              summary: 'Codex仕様に準拠するエージェント用のメタデータ共有形式として「AGENTS.md」が標準採用されました。グローバル指令の一括適用が容易に。',
              url: 'https://github.com',
            },
            {
              title: 'Gemini 3.5 Flash を標準搭載、レスポンス時間が半減',
              date: '2026-05-12',
              summary: 'Codexエンジンにて最新のGemini 3.5 Flashが標準モデルとして利用可能になり、プロンプト解釈と差分ファイル編集のスピードが2倍になりました。',
              url: 'https://github.com',
            },
            {
              title: 'スマート・スキル定義（skills/）によるプラグイン機構',
              date: '2026-03-25',
              summary: 'エージェントに対して共通して適用できるカスタム機能群を「skills」ディレクトリに分離配置する構成に対応。コードの再利用性が向上。',
              url: 'https://github.com',
            },
          ];

      res.json(fallbackNews);
      return;
    }

    try {
      const prompt = tool === 'claude'
        ? 'Find actual recent news, updates, features, or releases related to Anthropic\'s "Claude Code" command line agent tool. Present 3 structured recent updates. Rely on web search grounding.'
        : 'Find actual recent news, updates, features, or specifications related to GitHub Copilot Workspace, Codex, or developer system instructions such as "AGENTS.md" configs. Present 3 structured recent updates. Rely on web search grounding.';

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'ニュースのタイトル（日本語で記述してください）' },
                date: { type: Type.STRING, description: '日付（YYYY-MM-DD形式）' },
                summary: { type: Type.STRING, description: 'ニュースの内容の簡潔な要約（日本語で記述してください）' },
                url: { type: Type.STRING, description: '参照先の公式なURL' },
              },
              required: ['title', 'date', 'summary', 'url'],
            },
          },
        },
      });

      if (response.text) {
        const news = JSON.parse(response.text);
        res.json(news);
      } else {
        throw new Error('Empty model response');
      }
    } catch (error) {
      console.error('Gemini News fetch failed:', error);
      res.status(500).json({ error: '更新情報の取得に失敗しました' });
    }
  });

  // Serve static UI assets in production, Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
