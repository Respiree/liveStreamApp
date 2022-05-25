export const zScorePeakDetect = (function(params){
    var p = params || {}
    // init cooefficients
    const lag = p.lag || 5
    const threshold = p.threshold || 3.5
    const influence = p.influece || 0.5

    // var filteredY = 0
    var avgFilter = 0
    var stdFilter = 0
    var filteredY = new Array(lag).fill(0);
    var lastGradSignPositive = true;
    //console.log(`lag, threshold, influence: ${lag}, ${threshold}, ${influence}`)

    function sum(a) {
        return a.reduce((acc, val) => acc + val)
    }
    function mean(a) {
        return sum(a) / a.length
    }
    function stddev(arr) {
        const arr_mean = mean(arr)
        const r = function(acc, val) {
            return acc + ((val - arr_mean) * (val - arr_mean))
        }
        return Math.sqrt(arr.reduce(r, 0.0) / arr.length)
    }
    function peakFound(y) {
        // if (y === undefined || y.length < lag + 2) {
        //     throw ` ## y data array to short(${y.length}) for given lag of ${lag}`
        // }
        // init variables
        // var signals = Array(y.length).fill(0)
        var toBeep = false
        // var filteredY = y.slice(0)
        const lead_in = y.slice(0, lag)
        let prevGradSignPositive = lastGradSignPositive;
        let currGradSignPositive = lastGradSignPositive; 
        // console.log(avgFilter.toFixed(2), stdFilter.toFixed(2))
        let grad_arr=[]
        for (var i = 0; i < y.length; i++) {
            //console.log(`${y[i]}, ${avgFilter[i-1]}, ${threshold}, ${stdFilter[i-1]}`)
            if (Math.abs(y[i] - avgFilter) > (threshold * stdFilter)) {
                if (y[i] > avgFilter) {
                    // signals[i] = +1 // positive signal
                    // toBeep = true
                    currGradSignPositive = true; 
                    grad_arr.push("/")
                } else {
                    // signals[i] = -1 // negative signal
                    currGradSignPositive = false; 
                    grad_arr.push("\\")
                }
                // make influence lower
                filteredY[filteredY.length] = influence * y[i] + (1 - influence) * filteredY[filteredY.length-1]
            } else {
                // signals[i] = 0 // no signal
                filteredY[filteredY.length] = y[i]
                grad_arr.push("_")
            }
            filteredY = filteredY.slice(1, lag)
            if(prevGradSignPositive && !(currGradSignPositive)){
                // console.log(prevGradSignPositive,currGradSignPositive, "BEEP!")
                toBeep = true;
            } else {
                // console.log(prevGradSignPositive,currGradSignPositive)
            }
            prevGradSignPositive = currGradSignPositive;
            // adjust the filters
            // console.log(filteredY)
            avgFilter = mean(filteredY)
            stdFilter = stddev(filteredY)
            if(isNaN(avgFilter)){
                // console.log("NaN DETECTED!")
                // console.log(filteredY)
                avgFilter = 0
                stdFilter = 0
            }
        }
        lastGradSignPositive = currGradSignPositive
        // console.log(grad_arr)
        return toBeep
    }
    return {
        toBeep:peakFound
    }
})
// ({
//     lag: 5,
//     threshold: 3.5, 
//     influence: 0.01
// // })

export default zScorePeakDetect;