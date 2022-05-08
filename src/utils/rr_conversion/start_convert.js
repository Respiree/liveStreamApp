const LineReaderSync = require('line-reader-sync');
const calculate_rr = require("./rr.js")

// Example inputs
// input_file = "raw_data/in.txt"
input_file = "raw_data/sample-short.txt"

let input_data = (function readData(input_file){
    const lrs = new LineReaderSync(input_file)
    var n = 0
    var line = lrs.readline()
    var t = []
    var v = []
    while (line) {
        split_line = line.split(',')
        t.push(n)
        v.push(parseFloat(split_line[1]))
        n = n + 1; 
        line = lrs.readline()
    }
    return [t, v]
})(input_file) 

// Example params 
export const params = {
    sampling_time: 0.06, // seconds,
    window_mva: 15,
    window_bl: 250,
    window_art_mva: 83,
    window_art_bl: 667,
    window_smooth_output: 9,
    th_prepro: 3,
    lag: 2,
    coef_A: 0.8,
    coef_B: 0.5,
    val_min: 1.0,
    val_max: 30,
    window_size: 1083,
    window_shift: 16*1 
}
export const sqa_bandpass_rr = [0.05, 1.167]

// Example calculate_rr function call - 

function start_conversion(input_data, params, sqa_bandpass_rr)
{
  calculate_rr(
    input_data, 
    params, 
    sqa_bandpass_rr
)

}
result = calculate_rr(
    input_data, 
    params, 
    sqa_bandpass_rr
)
// results are stored in result variable
console.log(result)

console.log("calculate rr completed successfully.")