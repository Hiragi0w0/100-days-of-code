use serde::{Deserialize, Serialize};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthCheckResponse {
    pub ok: bool,
    pub app_name: String,
    pub display_name: String,
    pub backend: String,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ToolKind {
    Codex,
    Claude,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ConfigFileKind {
    Instruction,
    Config,
    Agent,
    Skill,
    Internal,
    Managed,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum StandardFileType {
    CodexAgentsMd,
    CodexAgentsOverrideMd,
    CodexConfigToml,
    ClaudeMd,
    ClaudeSettingsJson,
    ClaudeJson,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigFile {
    pub id: String,
    pub tool: ToolKind,
    pub label: String,
    pub path: String,
    pub kind: ConfigFileKind,
    pub exists: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileContent {
    pub file_id: String,
    pub content: String,
    pub exists: bool,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub news_enabled: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveResult {
    pub ok: bool,
    pub message: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NewsItem {
    pub title: String,
    pub date: Option<String>,
    pub url: String,
}
