var talib = require("talib");
module.exports = {    
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
bb:function getBB(close, lag, period,  NbDevUp, NbDevDn, MAType){
    return new Promise((resolve, reject) => {
        talib.execute({
            name: "BBANDS",  
            inReal: close,
            startIdx: 0,
            endIdx: close.length - lag,
            optInTimePeriod: period,
            optInNbDevUp: NbDevUp,
            optInNbDevDn: NbDevDn,
            optInMAType: MAType
              }, function (err, result) {
            if (err) {
                reject(err);
            }
            else {
               resolve(result.result);
//               console.log (result.result.outRealUpperBand)            
            }
        });
    });
},
rsi:function getRSI(close, lag, period) {
    return new Promise((resolve, reject) => {
        talib.execute({
            name: "RSI",  
            inReal: close,
            startIdx: 0,
            endIdx: close.length - lag,
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
},//rsi
std:function getSTD(close, lag, period, optInNbDev=1) {
    return new Promise((resolve, reject) => {
        talib.execute({
            name: "STDDEV",  
            inReal: close,
            startIdx: 0,
            endIdx: close.length - lag,
            optInTimePeriod: period,
            optInNbDev: optInNbDev
        }, function (err, result) {
            if (err) {
                reject(err);
            }
            else {
               resolve(result.result.outReal);            
            }
        });
    });
},//std

}//module