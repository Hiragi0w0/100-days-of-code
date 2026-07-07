use crate::operate_file::operate_file;
use crate::operate_file::operate_file::FileContents;

use std::path::PathBuf;

use crate::models::{
    AppSettings, ConfigFile, FileContent, HealthCheckResponse, NewsItem, SaveResult,
    StandardFileType, ToolKind,
};

const NOT_IMPLEMENTED: &str = "not implemented: this Tauri command is registered for learning only";

#[tauri::command]
pub fn cmd_health_check() -> HealthCheckResponse {
    HealthCheckResponse {
        ok: true,
        app_name: "Agent Config Watcher".to_string(),
        display_name: "エージェント設定ウォッチャー".to_string(),
        backend: "tauri".to_string(),
    }
}

#[tauri::command]
pub fn cmd_cfg_load_files() -> Result<Vec<ConfigFile>, String> {
    let root_path = dirs::home_dir().ok_or_else(|| "ルートパスの取得に失敗しました".to_string())?;

    // Codex　読込
    let codex_path = root_path.join(".codex");

    let mut codexpath_vec: Vec<PathBuf> = Vec::new();
    codexpath_vec.push(codex_path.join("AGENTS.md"));
    codexpath_vec.push(codex_path.join("AGENTS.override.md"));
    codexpath_vec.push(codex_path.join("config.toml"));

    let mut codex_results: Vec<FileContents> = Vec::new();
    for path in codexpath_vec
    {
        let res  = operate_file::load_filedata(path)?;
        codex_results.push(res);
    }

    let codex_agents_path = codex_path.join("agents");
    let codex_agents_res = operate_file::load_agents_file(codex_agents_path);

    let codex_skill_path = codex_path.join("skills");
    let codex_skill_res = operate_file::load_skill_file(codex_skill_path);

    // Claude　読込
    let claude_path = root_path.join(".claude");

    let mut claudepath_vec: Vec<PathBuf> = Vec::new();
    claudepath_vec.push(claude_path.join("CLAUDE.md"));
    claudepath_vec.push(claude_path.join("setting.json"));
    let mut claude_results: Vec<FileContents> = Vec::new();
    for path in claudepath_vec
    {
        let res  = operate_file::load_filedata(path)?;
        claude_results.push(res);
    }

    let claude_agents_path = claude_path.join("agents");
    let claude_agents_res = operate_file::load_agents_file(claude_agents_path);

    let claude_skill_path = claude_path.join("skills");
    let claude_skill_res = operate_file::load_skill_file(claude_skill_path);

    Err(NOT_IMPLEMENTED.to_string())
}

#[tauri::command]
pub fn cmd_file_read_content(file_id: String) -> Result<FileContent, String> {
    let _ = file_id;
    Err(NOT_IMPLEMENTED.to_string())
}

#[tauri::command]
pub fn cmd_file_save_content(file_id: String, content: String) -> Result<SaveResult, String> {
    let _ = (file_id, content);
    Err(NOT_IMPLEMENTED.to_string())
}

#[tauri::command]
pub fn cmd_new_create_standard_file(
    tool: ToolKind,
    file_type: StandardFileType,
) -> Result<ConfigFile, String> {
    let _ = (tool, file_type);
    Err(NOT_IMPLEMENTED.to_string())
}

#[tauri::command]
pub fn cmd_new_create_agent(tool: ToolKind, name: String) -> Result<ConfigFile, String> {
    let _ = (tool, name);
    Err(NOT_IMPLEMENTED.to_string())
}

#[tauri::command]
pub fn cmd_new_create_skill(tool: ToolKind, name: String) -> Result<ConfigFile, String> {
    let _ = (tool, name);
    Err(NOT_IMPLEMENTED.to_string())
}

#[tauri::command]
pub fn cmd_news_fetch_items(tool: ToolKind) -> Result<Vec<NewsItem>, String> {
    let _ = tool;
    Err(NOT_IMPLEMENTED.to_string())
}

#[tauri::command]
pub fn cmd_app_load_settings() -> Result<AppSettings, String> {
    Err(NOT_IMPLEMENTED.to_string())
}

#[tauri::command]
pub fn cmd_app_save_settings(settings: AppSettings) -> Result<SaveResult, String> {
    let _ = settings;
    Err(NOT_IMPLEMENTED.to_string())
}
