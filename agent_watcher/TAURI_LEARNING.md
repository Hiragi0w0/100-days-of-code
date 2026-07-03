# Tauri学習メモ

## 現状

現在の agent_watcher は React / Vite / Express 構成です。

主な処理は `server.ts` の Express API にあります。今回は学習準備として Tauri v2 の起動と command 接続口だけを追加し、既存 Express API の削除や移植は行いません。

## 今回追加したもの

- Tauri v2 構成
- Rust command: `cmd_health_check`
- 将来移植する Tauri command の接続口
- フロントから `invoke("cmd_health_check")` する最小サンプル

## Express API と Tauri command の対応候補

| 現在のExpress API | 将来のTauri command | 優先度 |
| --- | --- | --- |
| GET /api/settings | cmd_app_load_settings | 高 |
| POST /api/settings | cmd_app_save_settings | 高 |
| GET /api/files | cmd_cfg_load_files | 高 |
| GET /api/file-content | cmd_file_read_content | 高 |
| POST /api/save-file | cmd_file_save_content | 高 |
| POST /api/create-file | cmd_new_create_standard_file | 中 |
| POST /api/create-item | cmd_new_create_agent / cmd_new_create_skill | 中 |
| GET /api/news | cmd_news_fetch_items | 低 |

## 学習順

1. `cmd_health_check` で `invoke` の流れを理解する
2. `cmd_cfg_load_files` を実装する
3. `cmd_file_read_content` を実装する
4. `cmd_file_save_content` を実装する
5. `cmd_new_create_standard_file` を実装する
6. `cmd_new_create_agent` を実装する
7. `cmd_new_create_skill` を実装する
8. `cmd_app_load_settings` を実装する
9. `cmd_app_save_settings` を実装する
10. `cmd_news_fetch_items` を実装する

## 注意

今回は学習準備なので、Express APIをまだ削除しません。

Tauri command は接続口だけを先に登録し、内部処理は1つずつ置き換えます。未実装 command は成功レスポンスを返さず、未実装エラーを返します。
