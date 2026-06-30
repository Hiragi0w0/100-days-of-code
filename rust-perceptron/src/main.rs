mod data;
mod filer_csv;
mod perceptron;

use crate::data::Data;
use crate::data::KData;
use crate::filer_csv::read_csv;
use crate::perceptron::Perceptron;

fn main() -> Result<(), Box<dyn std::error::Error>>
{
    let csv_data = read_csv("./data/iris.data", false)?;

    let mut sample_data = KData::new();

    let row_size = csv_data.len();
    for row in 0..row_size
    {
        let row_data = &csv_data[row];
        let col_size = csv_data[row].len();
        if col_size < 5
        {
            continue;
        }

        let mut vec_data:Vec<f64> = Vec::new();
        let mut label_data = 0;

// ラベル
        label_data = match row_data[4].as_str()
        {
            "Iris-versicolor" => 0,
            "Iris-virginica" => 1,
            _ => continue,
        };

        // データ
        for col in 0..4
        {
            let value: f64 = row_data[col].parse()?;
            vec_data.push(value);
        }

        let data = Data::new(vec_data, label_data);
        sample_data.add(data);
    }

    let seed: u64 = 42;
    sample_data.shuffle(seed);

    let train_input = sample_data.get_train_inputdata();
    let train_label = sample_data.get_train_label();

    let test_input = sample_data.get_test_inputdata();
    let test_label = sample_data.get_test_label();

    let input_size_define = 4;
    let lr: f64 = 0.00001;
    let epoch = 100;
    let mut model = Perceptron::new(input_size_define, lr, epoch);
    model.train(&train_input, &train_label, &test_input, &test_label);

    let accuracy = model.evaluate(&test_input, &test_label);

    println!("weights: {:?}", model.get_weights());
    println!("bias: {}", model.get_bias());
    println!("accuracy: {}", accuracy);

    return Ok(())
}
