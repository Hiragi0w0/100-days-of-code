use std::process::Command;
use std::path::PathBuf;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct ReflogRes
{
    pub sha: String,
    pub selector: String,
    pub action: String,
    pub message: String,
}

impl ReflogRes
{
    pub fn new(sha: String, selector: String, action: String, message: String) -> Self
    {
        Self
        {
            sha,
            selector,
            action,
            message
        }
    }
}

pub fn git_reflog(path: PathBuf) -> Result<Vec<ReflogRes>, anyhow::Error>
{
    let output = Command::new("git")
                    .arg("-C")
                    .arg(path)
                    .arg("reflog")
                    .arg("--no-decorate")
                    .output()?;

    if !output.status.success()
    {
        let error_message = String::from_utf8_lossy(&output.stderr);
        return Err(anyhow::anyhow!("コマンド実行が失敗しました。: {}", error_message));
    }

    let std_out = String::from_utf8_lossy(&output.stdout);
    let mut res_vec: Vec<ReflogRes> = Vec::new();
    for line in std_out.lines()
    {
        let Some((sha, rest)) = line.split_once(' ') else
        {
            continue;
        };
        let Some((selector, action_and_message)) = rest.split_once(':') else
        {
            continue;
        };
        let Some((action, message)) = action_and_message.split_once(':') else
        {
            continue;
        };

        let res:ReflogRes = ReflogRes::new(sha.trim().to_string(),
                                        selector.trim().to_string(),
                                        action.trim().to_string(),
                                        message.trim().to_string());
        res_vec.push(res);
    }

    return Ok(res_vec);
}
