mod git;

use clap::Parser;
use std::path::PathBuf;

#[derive(Parser)]
struct Cli
{
    file_path: PathBuf,
}

fn main() -> anyhow::Result<()>
{
    let cli =  Cli::parse();

    let git_res = git::git_reflog(cli.file_path)?;

    for res in git_res
    {
        println!("{}  {}  {}  {}",
            res.sha,
            res.selector,
            res.action,
            res.message
        );
    }

    return Ok(());
}
