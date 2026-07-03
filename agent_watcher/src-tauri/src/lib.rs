mod commands;
mod models;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::cmd_health_check,
            commands::cmd_cfg_load_files,
            commands::cmd_file_read_content,
            commands::cmd_file_save_content,
            commands::cmd_new_create_standard_file,
            commands::cmd_new_create_agent,
            commands::cmd_new_create_skill,
            commands::cmd_news_fetch_items,
            commands::cmd_app_load_settings,
            commands::cmd_app_save_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running Agent Config Watcher");
}
