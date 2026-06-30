use rand::seq::SliceRandom;
use rand::SeedableRng;
use rand::rngs::StdRng;

pub struct Data
{
    input_data: Vec<f64>,
    label: i8,
}

impl Data
{
    pub fn new(input_data: Vec<f64>, label: i8) -> Self
    {
        Self
        {
            input_data,
            label,
        }
    }

    pub fn get_input_data(&self) -> &Vec<f64>
    {
        &self.input_data
    }

    pub fn get_label(&self) -> i8
    {
        self.label
    }
}

pub struct KData
{
    data: Vec<Data>,
}

impl KData
{
    pub fn new() -> Self
    {
        Self
        {
            data: Vec::new(),
        }
    }

    pub fn add(&mut self, data: Data)
    {
        self.data.push(data);
    }

    pub fn get_train_inputdata(&self) -> Vec<Vec<f64> >
    {
        let mut vec_data: Vec<Vec<f64>> = Vec::new();

        let train_size = (self.data.len() as f64 * 0.8) as usize;
        for data in self.data.iter().take(train_size)
        {
            vec_data.push(data.get_input_data().clone());
        }

        return vec_data;
    }

    pub fn get_train_label(&self) -> Vec<i8>
    {
        let mut vec_label: Vec<i8> = Vec::new();

        let train_size = (self.data.len() as f64 * 0.8) as usize;
        for label in self.data.iter().take(train_size)
        {
            vec_label.push(label.get_label());
        }

        return vec_label;
    }

    pub fn get_test_inputdata(&self) -> Vec<Vec<f64> >
    {
        let mut vec_data: Vec<Vec<f64>> = Vec::new();

        let train_size = (self.data.len() as f64 * 0.8) as usize;
        for data in self.data.iter().skip(train_size)
        {
            vec_data.push(data.get_input_data().clone());
        }

        return vec_data;
    }

    pub fn get_test_label(&self) -> Vec<i8>
    {
        let mut vec_label: Vec<i8> = Vec::new();

        let train_size = (self.data.len() as f64 * 0.8) as usize;
        for label in self.data.iter().skip(train_size)
        {
            vec_label.push(label.get_label());
        }

        return vec_label;
    }

    pub fn shuffle(&mut self, seed: u64)
    {
        let mut rnd = StdRng::seed_from_u64(seed);
        self.data.shuffle(&mut rnd);
    }
}
