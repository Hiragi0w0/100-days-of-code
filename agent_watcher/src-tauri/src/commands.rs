use crate::operate_file::operate_file;

use std::path::PathBuf;

use crate::models::{
    AppSettings, ConfigFile, FileContent, HealthCheckResponse, NewsItem, SaveResult,
    StandardFileType, ToolKind,
};

const NOT_IMPLEMENTED: &str = "not implemented: this Tauri command is registered for learning only";

// コマンド

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

    let mut results: Vec<ConfigFile> = Vec::new();

    // Codex　読込
    let codex_path = root_path.join(".codex");

    results.push(
        make_config_file
        (
            "codex-agents-md",
            ToolKind::Codex,
            "AGENTS.md",
            codex_path.join("AGENTS.md"),
            ConfigKind::Instruction,
        )
    )

    results.push(
        make_config_file
        (
            "codex-agents-override-md",
            ToolKind::Codex,
            "AGENTS.override.md",
            codex_path.join("AGENTS.override.md"),
            ConfigKind::Instruction,
        )
    )

    results.push(
        make_config_file
        (
            "codex-config-toml",
            ToolKind::Codex,
            "config.toml",
            codex_path.join("config.toml"),
            ConfigKind::Instruction,
        )
    )

    results.push(
        load_child_files
        (
            "codex-config-toml",
            ToolKind::Codex,
            "config.toml",
            codex_path.join("config.toml"),
            ConfigKind::Instruction,
        )
    )

    results.push(make_config_file(
        "claude-md",
        ToolKind::Claude,
        "CLAUDE.md",
        claude_path.join("CLAUDE.md"),
        ConfigFileKind::Instruction,
    ));

    results.push(make_config_file(
        "claude-settings-json",
        ToolKind::Claude,
        "settings.json",
        claude_path.join("settings.json"),
        ConfigFileKind::Config,
    ));

    push_child_files(
        &mut results,
        ToolKind::Codex,
        &codex_path,
        "agents",
        ConfigFileKind::Agent,
    )?;

    push_child_files(
        &mut results,
        ToolKind::Codex,
        &codex_path,
        "skills",
        ConfigFileKind::Skill,
    )?;

    push_child_files(
        &mut results,
        ToolKind::Claude,
        &claude_path,
        "agents",
        ConfigFileKind::Agent,
    )?;

    push_child_files(
        &mut results,
        ToolKind::Claude,
        &claude_path,
        "skills",
        ConfigFileKind::Skill,
    )?;

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

// 諸関数
// ConfigFileクラスを作成
//　引数：ConfigFileクラスのメンバ変数
fn make_config_file(id: &str,
                    tool: ToolKind,
                    label: &str,
                    path: PathBuf,
                    kind: ConfigFileKind,)->ConfigFile
{
    ConfigFile
    {
        id: id.to_string(),
        tool,
        label: label.to_string(),
        path: path.to_string_lossy().to_string(),
        kind,
        exists: path.exists(),
    }
}

// ディレクトリ配下のファイル取得
// 引数：results = 格納先配列
// 引数：tool = ToolKindのenum
// 引数：
fn load_child_files(results: &mut Vec<ConfigFile>,
                    tool: ToolKind,
                    base_dir: &Path,
                    folder_name: &str,
                    kind: ConfigFileKind,)
                    -> Result<(), String>
{
    let target_dir = base_dir.join(folder_name);

    if !target_dir.exists() || !target_dir.is_dir()
    {
        return Ok(());
    }

    let entries = fs::read_dir(&target_dir).map_err(|err| "フォルダの読み込みに失敗しました")?;

    for entry in entries
    {
        let entry = entry.map_err(|err| "フォルダ内の項目取得に失敗しました")?;

        let file_path = entry.path();

        if file_path.is_file()
        {
            results.push
                (
                make_config_file
                (
                    &format!("{}-{}-{}", tool_id(&tool), folder_name, file_name),
                    tool.clone(),
                    file_name,
                    file_path,
                    kind.clone(),
                )
            )?;
            continue;
        }

        if entry_path.is_dir()
        {
                    let child_entries = fs::read_dir(&entry_path).map_err(|err| "配下の読み込みに失敗しました")?;

                    for child_entry in child_entries
                    {
                        let child_entry = child_entry.map_err(|err| "配下の項目取得に失敗しました")?;

                        let child_path = child_entry.path();

                        if !child_path.is_file()
                        {
                            continue;
                        }

                        push_config_file_from_path
                        (
                            results,
                            tool.clone(),
                            folder_name,
                            kind.clone(),
                            child_path,
                        )?;
                    }
                }
    }

    Ok(())
}

fn load_config_file_from_path(results: &mut Vec<ConfigFile>,
                                tool: ToolKind,
                                folder_name: &str,
                                kind: ConfigFileKind,
                                file_path: PathBuf,)
                            -> Result<(), String> {
    let Some(file_name) = file_path.file_name().and_then(|value| value.to_str()) else
    {
        return Ok(());
    };

    results.push
    (
        make_config_file
        (
            &format!("{}-{}-{}", tool_id(&tool), folder_name, file_name),
            tool,
            file_name,
            file_path,
            kind,
        )
    );

    Ok(())
}
