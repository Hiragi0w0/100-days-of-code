use std::error::Error;

pub fn read_csv(path: &str, has_headers: bool) -> Result<Vec<Vec<String> >, Box<dyn Error>>
{
    let mut reader =    csv::ReaderBuilder::new()
        .has_headers(has_headers)
        .from_path(path)?;

    let mut rows: Vec<Vec<String> > = Vec::new();

    for result in reader.records()
    {
        let record = result?;

        let data:Vec<String> = record.iter()
            .map(|s| s.to_string())
            .collect();

            rows.push(data);
    }

    return Ok(rows)
}
