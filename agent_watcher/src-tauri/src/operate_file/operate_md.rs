use std::path::PathBuf;

pub struct MDContents
{
    pub path: String,
    pub content: String,
    pub exist: bool,
}

impl MDContents
{
    pub fn new() -> Self
    {
        Self
        {
            path: String::new(),
            content: String::new(),
            exist: false,
        }
    }
}

pub fn load_filedata(path: PathBuf) -> Result<MDContents, String>
{
    let mut md_content: MDContents = MDContents::new();

    md_content.path = path.display().to_string();
    if !path.exists()
    {
        return Ok(md_content);
    }

    Ok(md_content)
}
