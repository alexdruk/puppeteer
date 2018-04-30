var talib = require("talib");
module.exports = {    
/*
    function calculate MFI using standard module
    @params - data, lag  and period
    @return: MFI array
*/
mfi:function getMFI(high, low, close, volume, lag, period) {
    return new Promise((resolve, reject) => {
        talib.execute({
            name: "MFI",  
            high: high,
            low: low,
            close: close,
            volume: volume,
            startIdx: 0,
            endIdx: high.length - lag,
            optInTimePeriod: period
        }, function (err, result) {
            if (err) {
                reject(err);
            }
            else {
               resolve(result.result.outReal);            
            }
        });
    });
},//mfi

}//module