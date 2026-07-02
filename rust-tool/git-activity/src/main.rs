mod git;
mod read_log;

use std::path::PathBuf;

use clap::Parser;

use git::ReflogRes;

#[derive(Parser)]
struct Cli {
    /// git reflog を取得するリポジトリのパス
    file_path: PathBuf,

    /// 今回の差分を固定パスに保存する
    #[arg(long)]
    save: bool,
}

fn main() -> anyhow::Result<()>
{
    let cli = Cli::parse();

    let git_res = git::git_reflog(cli.file_path)?;

    let previous_diff = read_log::load_reflog()?;

    let diffs = diff_by_anchor(&git_res, &previous_diff);

    if diffs.is_empty()
    {
        println!("差分はありません。");
        return Ok(());
    }

    let display_text = format_display_text(&diffs);

    print!("{}", display_text);

    if cli.save
    {
        read_log::save_reflog(&diffs)?;
        println!("差分ファイルを保存しました");
    }

    Ok(())
}

fn diff_by_anchor(current: &[ReflogRes], previous_diff: &[ReflogRes]) -> Vec<ReflogRes>
{
    if previous_diff.is_empty()
    {
        return current.to_vec();
    }

    let anchor_index = current
        .iter()
        .position(|current_res|
        {
            previous_diff
                .iter()
                .any(|previous_res| is_same_reflog_entry(current_res, previous_res))
        });

    match anchor_index
    {
        Some(index) => current[..index].to_vec(),
        None => current.to_vec(),
    }
}

fn is_same_reflog_entry(a: &ReflogRes, b: &ReflogRes) -> bool
{
    a.sha == b.sha
        && a.action == b.action
        && a.message == b.message
}

fn format_display_text(results: &[ReflogRes]) -> String
{
    let mut output = String::new();

    for result in results
    {
        output.push_str(&format!
            (
            "{}  {}  {}  {}\n",
            result.sha,
            result.selector,
            result.action,
            result.message
        ));
    }

    return output
}
