use std::io::Error;
use std::path::PathBuf;
use std::fs;

pub struct FileContents
{
    pub path: String,
    pub content: String,
    pub exist: bool,
}

impl FileContents
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

pub fn load_filedata(path: PathBuf) -> Result<FileContents, String>
{
    let mut md_content: FileContents = FileContents::new();

    md_content.path = path.display().to_string();
    if !path.exists()
    {
        return Ok(md_content);
    }

    let contents = fs::read_to_string(&path).map_err(|err| err.to_string())?;

    md_content.path = path.to_string_lossy().to_string();
    md_content.content = contents;
    md_content.exist = true;

    Ok(md_content)
}


pub fn load_agents_file(path: PathBuf) -> Result<Vec<FileContents>, String>
{
    let mut contents_vec: Vec<FileContents> = Vec::new();

    if !path.exists() || !path.is_dir()
    {
        return Ok(contents_vec);
    }

    let entories = fs::read_dir(&path).map_err(|err| "agentsフォルダの読込に失敗しました。")?;

    for entory in entories
    {
        let read_dir = entory.map_err(|err| format!("agentsフォルダ内の項目取得に失敗しました: {}", err))?;
        let file_path = read_dir.path();
        let contents = fs::read_to_string(&file_path).map_err(|err| format!("agentファイルの読込に失敗しました: {}", err))?;

        let mut toml_content: FileContents = FileContents::new();
        toml_content.content = contents;
        toml_content.path = path.to_string_lossy().to_string();
        toml_content.exist = true;

        contents_vec.push(toml_content);
    }

    Ok(contents_vec)
}

pub fn load_skill_file(path: PathBuf) -> Result<Vec<FileContents>, String>
{
    let mut contents_vec: Vec<FileContents> = Vec::new();

    if !path.exists() || !path.is_dir()
    {
        return Ok(contents_vec);
    }

    let entories = fs::read_dir(&path).map_err(|err| "skillフォルダの読込に失敗しました。")?;

    for entory in entories
    {
        let read_rootdir = entory.map_err(|err| format!("skillフォルダ内の項目取得に失敗しました: {}", err))?;
        let folder_path = read_rootdir.path();

        if !folder_path.is_dir()
        {
            continue;
        }

        let read_dir = fs::read_dir(&folder_path).map_err(|err| format!("skillフォルダ内の項目取得に失敗しました: {}", err))?;
        for file_paths in read_dir
        {
            let read_filepath = file_paths.map_err(|err| format!("skillフォルダ内の項目取得に失敗しました: {}", err))?;
            let file_path = read_filepath.path();

            if !file_path.is_file()
            {
                continue;
            }
            let is_md = file_path
                .extension()
                .and_then(|ext| ext.to_str())
                == Some("md");

            if !is_md
            {
                continue;
            }

            let content = fs::read_to_string(&file_path).map_err(|err| "skillフォルダの読込に失敗しました。")?;

            let mut toml_content: FileContents = FileContents::new();
            toml_content.content = content;
            toml_content.path = path.to_string_lossy().to_string();
            toml_content.exist = true;

            contents_vec.push(toml_content);
        }

    }

    Ok(contents_vec)
}
