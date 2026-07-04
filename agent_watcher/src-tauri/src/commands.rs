use crate::operate_file::operate_md;
use crate::operate_file::operate_md::MDContents;

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

    let mut path_vec: Vec<PathBuf> = Vec::new();
    path_vec.push(codex_path.join("AGENTS.md"));

    let mut results: Vec<MDContents> = Vec::new();
    for path in path_vec
    {
        let res  = operate_md::load_filedata(path)?;
        results.push(res);
    }

    // Claude　読込


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
