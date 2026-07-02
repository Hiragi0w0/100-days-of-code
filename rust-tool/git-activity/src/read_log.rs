use std::fs;
use std::path::PathBuf;

use anyhow::Context;

use crate::git::ReflogRes;

pub fn get_diff_path() -> anyhow::Result<PathBuf>
{
    let user_path = std::env::var("USERPROFILE").context("USERPROFILE 環境変数の取得に失敗しました")?;

    let log_dir = PathBuf::from(user_path).join(".git-activity");

    fs::create_dir_all(&log_dir).with_context(|| "保存用フォルダの作成に失敗しました")?;

    Ok(log_dir.join("reflog_diff.tsv"))
}

pub fn load_reflog() -> anyhow::Result<Vec<ReflogRes>>
{
    let diff_path = get_diff_path()?;
    if !diff_path.exists()
    {
        return Ok(Vec::new());
    }

    let text = fs::read_to_string(&diff_path)
        .with_context(|| "reflogファイルの読込に失敗しました")?;

    let mut results = Vec::new();

    for line in text.lines()
    {
        let line_data: Vec<&str> = line.splitn(4, '\t').collect();

        if line_data.len() < 4
        {
            continue;
        }

        results.push(ReflogRes::new(
            line_data[0].to_string(),
            line_data[1].to_string(),
            line_data[2].to_string(),
            line_data[3].to_string(),
        ));
    }

    Ok(results)
}

pub fn save_reflog(results: &[ReflogRes]) -> anyhow::Result<()>
{
    let mut text = String::new();

    for result in results
    {
        text.push_str(&format!(
            "{}\t{}\t{}\t{}\n",
            result.sha,
            result.selector,
            result.action,
            result.message
        ));
    }

    let path = get_diff_path()?;
    fs::write(path, text).with_context(|| "reflogファイルの保存に失敗しました")?;

    Ok(())
}
