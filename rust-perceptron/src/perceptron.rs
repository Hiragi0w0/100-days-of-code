pub struct Perceptron
{
    weights: Vec<f64>,
    bias: f64,
    learning_rate: f64,
    epochs: usize,
}

impl Perceptron
{
    pub fn new(input_size: usize, learning_rate: f64, epochs: usize) -> Self
    {
        Self
        {
            weights: vec![0.0; input_size],
            bias: 0.0,
            learning_rate,
            epochs,
        }
    }

    pub fn predict(&self, input: &Vec<f64>) -> i8
    {
        let mut sum = self.bias;

        for i in 0..self.weights.len()
        {
            sum += self.weights[i] * input[i];
        }

        if sum >= 0.0
        {
            1
        } else
        {
            0
        }
    }

    pub fn train(&mut self, train_input: &Vec<Vec<f64>>, train_label: &Vec<i8>, test_input: &Vec<Vec<f64>>, test_label: &Vec<i8>,)
    {
        println!
        (
            "{:<8} {:<12} {:<15} {:<15}",
            "Epoch", "Mistakes", "Train Acc", "Test Acc"
        );
        println!("{}", "-".repeat(55));

        for epoch in 0..self.epochs
        {

            let mut mistakes = 0;

            for i in 0..train_input.len()
            {
                let input = &train_input[i];
                let label = train_label[i];

                let prediction = self.predict(input);
                let error = label - prediction;

                if error != 0
                {
                    mistakes += 1;
                }

                for j in 0..self.weights.len()
                {
                    self.weights[j] += self.learning_rate * error as f64 * input[j];
                }

                self.bias += self.learning_rate * error as f64;
            }

            let train_acc = self.evaluate(train_input, train_label);
            let test_acc = self.evaluate(test_input, test_label);

            println!
            (
                "{:<8} {:<12} {:<15} {:<15}",
                epoch + 1,
                mistakes,
                format!("{:.2}%", train_acc * 100.0),
                format!("{:.2}%", test_acc * 100.0),
            );
        }
    }

    pub fn evaluate(&self, test_input: &Vec<Vec<f64>>, test_label: &Vec<i8>) -> f64 {
        let mut correct = 0;

        for i in 0..test_input.len() {
            let prediction = self.predict(&test_input[i]);

            if prediction == test_label[i] {
                correct += 1;
            }
        }

        correct as f64 / test_input.len() as f64
    }

    pub fn get_weights(&self) -> &Vec<f64>
    {
        &self.weights
    }

    pub fn get_bias(&self) -> f64
    {
        self.bias
    }
}
