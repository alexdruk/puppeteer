//require
const moment = require('moment');
const puppeteer = require('puppeteer');
chromium = require('./chromium.js');
const fs = require("fs");
const talib = require('./talib.js');
const CTpage = 'https://cryptotrader.org/backtests/Ajm85S57R7tAJoFxd';
const LOGIN = require('./login.js');
const TIME = require('./time_functions.js');
const trading = require('./trading.js');
const multiplier = 800;//number for log entries
let storage = {};


//const
const args = process.argv;
//console.log(args, args.length);
if (args.length < 5) {
    console.log('Wrong number of arguments! Exiting...');
    process.exit(1);
}
const platform = args[2].toString();
const instrument = args[3].toString();
const interval = args[4].toString();//
const filename = './data/' + instrument + '_' + TIME.today().replace(' 00:00','')+ '_' + interval + '.json';
const datafile = './data/results_' + instrument + '_' + TIME.today().replace(' 00:00','')+ '_' + interval + '.json';
console.log(platform, instrument, interval, filename);

//let low, high, open, close, vol, at = [];
let ins = {
    low:[],
    high:[],
    open:[],
    close:[],
    volume:[],
    at:[]
};

//local


 

//main
async function main() {
    console.log('Script started: ', new Date())
//get data
    if (fs.existsSync(filename)) {
        let rawdata = fs.readFileSync(filename, e => {console.log(e);});
        ins = JSON.parse(rawdata); 
    }
    else {
        ins = await chromium.main(platform, instrument, interval, filename);
    }

    //deal with data

/*
//MFI
    console.log('starting mfi');
    let MFIrange = {};
    const MFIperiods = [14,16,18,20,22,24,26,28];
    for (const period of MFIperiods) {
        trading.storageIni(storage);
        for (let i = 100; i < ins.at.length; i++) { //100 to leave some buffer like 500 in CT
            let high = ins.high.slice(0, i);
            let low = ins.low.slice(0, i);
            let close = ins.close.slice(0, i);
            let vol = ins.volume.slice(0, i);
            let mfiResults = await talib.mfi(high, low, close, vol, 1, period);
            trading.mfi(close.pop(), mfiResults.pop(), storage);
        }
        if ((storage.pl > 0) && (storage.sells > 5)) {
            MFIrange[period] = storage.pl;
            console.log(period, storage.pl);
        }
    }
    if (Object.keys(MFIrange).length > 0) {
        let MFIres = Object.keys(MFIrange).reduce((a, b) => MFIrange[a] > MFIrange[b] ? a : b);
        console.log('Optimum for mfi:', MFIres,  '#', MFIrange[MFIres]);    
    }
    else {
        console.log('Less than 3 trades with current MFI range');    
    }

//BB
    console.log('starting bb', new Date());
    const bb_dataRange = {};
    const BBperiods = [8,9,10,11,12];
    const stds = [0.5];
    const STDperiods = [5,6,7,8,9];
    for (const period of BBperiods) {
        for (const n_stds of stds) {
            for (const std_period of STDperiods) {
                trading.storageIni(storage);
                for (let i = 100; i < ins.at.length; i++) { //100 to leave some buffer like 500 in CT
                    let close = ins.close.slice(0, i);
                    let std = await talib.std (close, 1, std_period);
                    let bbResults = await talib.bb(close, 1, period,  n_stds, n_stds, 0);
                    let bbUpperBand = bbResults.outRealUpperBand;
                    let bbLowerBand = bbResults.outRealLowerBand;
                    trading.bb(close.pop(), bbUpperBand.pop(), bbLowerBand.pop(), std.pop(), storage);
    //                console.log('std=', std.pop(), 'std_period', std_period)
                }
                bb_params = period+' '+n_stds+' '+std_period;
                if ((storage.pl > 0) && (storage.sells > 5)) {
                    bb_dataRange[bb_params] = storage.pl;
                    console.log(bb_params, storage.pl);
                }
            }//for
        }//for
    }//for
    let [optBBperiod, optstds, optSTDperiod] = [0,0,0];
    if (Object.keys(bb_dataRange).length > 0) {
        let bb_res = Object.keys(bb_dataRange).reduce((a, b) => bb_dataRange[a] > bb_dataRange[b] ? a : b);
        console.log('Optimum for bb:', bb_res,  '#', bb_dataRange[bb_res]);
        [optBBperiod, optstds, optSTDperiod] = bb_res.split(' ');
        console.log ('optBBperiod', optBBperiod, 'optstds', optstds, 'optSTDperiod', optSTDperiod);
    }
    else {
        console.log('Less than 3 trades with current bb_dataRange range');    
    }
//bb_SAR
    console.log('starting bb_sar', new Date());
    const bb_sar_dataRange = {};
    const optInAccelerations = [0.005, 0.0025, 0.00125, 0.000625];
    for (const optInAcceleration of optInAccelerations) {
                trading.storageIni(storage);
                for (let i = 100; i < ins.at.length; i++) { //100 to leave some buffer like 500 in CT
                    let high = ins.high.slice(0, i);
                    let low = ins.low.slice(0, i);
                    let close = ins.close.slice(0, i);
                    let std = await talib.std (close, 1, optSTDperiod);
                    let bbResults = await talib.bb(close, 1, optBBperiod,  optstds, optstds, 0);
                    let sarResults = await talib.sar(high, low, 1, optInAcceleration, optInAcceleration*10);
                    let bbUpperBand = bbResults.outRealUpperBand;
                    let bbLowerBand = bbResults.outRealLowerBand;
                    let first_sar = sarResults.pop();
                    trading.bb_sar(close.pop(), bbUpperBand.pop(), bbLowerBand.pop(), std.pop(), sarResults.pop(), storage);
//                    console.log('sar=', sarResults.pop())
                 }
                if ((storage.pl > 0) && (storage.sells > 5)) {
                    bb_sar_dataRange[optInAcceleration] = storage.pl;
                    console.log(optInAcceleration, storage.pl);
                }
    }//for
    if (Object.keys(bb_sar_dataRange).length > 0) {
        let accel = Object.keys(bb_sar_dataRange).reduce((a, b) => bb_sar_dataRange[a] > bb_sar_dataRange[b] ? a : b);
        console.log('Optimum for bb_sar:', accel,  '#', bb_sar_dataRange[accel]);
    }
    else {
        console.log('Less than 3 trades with current bb_dataRange range');    
    }
//macd

    console.log('starting macd', new Date());
    const macd_dataRange = {};
    const Fast_periods = [5,6,7,8,10,12,14];
    const Slow_periods = [12,14,16,18,20,22,24,26,28,30];
    const Signal_periods = [2,3,4,6];
    for (const fast of Fast_periods) {
        for (const slow of Slow_periods) {
            if (slow/fast < 2) {continue;}
            for (const signal of Signal_periods) {
                trading.storageIni(storage);
                for (let i = 100; i < ins.at.length; i++) { //100 to leave some buffer like 500 in CT
                    let close = ins.close.slice(0, i);
                    let macd = await talib.macd (close, 1, fast, slow, signal);
                    trading.macd(close.pop(), macd, storage);
                }
                macd_params = fast+' '+slow+' '+signal;
                if ((storage.pl > 0) && (storage.sells > 5)) {
                    macd_dataRange[macd_params] = storage.pl;
                    console.log(macd_params, storage.pl);    
                }
            }//for
        }//for
    }//for
    let [optFastPeriod, optSlowPeriod, optSignal] = [0,0,0];
    if (Object.keys(macd_dataRange).length > 0) {
        let macd_res = Object.keys(macd_dataRange).reduce((a, b) => macd_dataRange[a] > macd_dataRange[b] ? a : b);
        console.log('Optimum for macd:', macd_res, '#', macd_dataRange[macd_res]);
        [optFastPeriod, optSlowPeriod, optSignal] = macd_res.split(' ');
        console.log ('optFastPeriod', optFastPeriod, 'optSlowPeriod', optSlowPeriod, 'optSignal', optSignal);
    }
    else {
        console.log('Less than 3 trades with current macd_dataRange range');    
    }

//RSI
    console.log('starting rsi', new Date());
    const rsi_dataRange = {};
    const RSIperiods = [8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26];
    const RSIdelays = [1,2,3] //1 is the same as 0
    for (const rsi_period of RSIperiods) {
        for (const delay of RSIdelays) {
            trading.storageIni(storage);
            for (let i = 100; i < ins.at.length; i++) { //100 to leave some buffer like 500 in CT
                let close = ins.close.slice(0, i);
                let RSIResults = await talib.rsi (close, 1, rsi_period);
                trading.rsi(close.pop(), RSIResults.pop(), delay, storage);
            }
            rsi_params = rsi_period+' '+delay;
            if ((storage.pl > 0) && (storage.sells > 5)) {
                rsi_dataRange[rsi_params] = storage.pl;
                console.log(rsi_params, storage.pl);    
            }
        }//for
    }//for
    let [optRSIPeriod, optRSIdelay] = [0,0];
    if (Object.keys(rsi_dataRange).length > 0) {
        let rsi_res = Object.keys(rsi_dataRange).reduce((a, b) => rsi_dataRange[a] > rsi_dataRange[b] ? a : b);
        console.log('Optimum for rsi:', rsi_res, '#', rsi_dataRange[rsi_res]);
        [optRSIPeriod, optRSIdelay] = rsi_res.split(' ');
        console.log ('optRSIPeriod', optRSIPeriod, 'optRSIdelay', optRSIdelay);
    }
    else {
        console.log('Less than 3 trades with current rsi_dataRange range');    
    }
    //MACD+RSI 
    console.log('starting macd_rsi', new Date());
    const macd_rsi_dataRange = {};
        trading.storageIni(storage);
        let [m, rsi] = [0,0];
        for (let i = 100; i < ins.at.length; i++) { //100 to leave some buffer like 500 in CT
            let close = ins.close.slice(0, i);
            let macd = await talib.macd (close, 1, optFastPeriod, optSlowPeriod, optSignal);
            let RSIResults = await talib.rsi (close, 1, optRSIPeriod);
            m = macd.outMACD.pop();
            rsi = RSIResults.pop();
            trading.macd_rsi(close.pop(), macd, rsi, storage);
        }
        if ((storage.pl > 0) && (storage.sells > 5)) {
            console.log('Optimum for macd_rsi:', storage.pl);    
        }

//EMA_SAR
    console.log('starting ema_sar', new Date());
    const ema_sar_dataRange = {};
    const Ema_short_periods = [4,6,8,10,12,14,16,18,20];
    const Ema_long_periods = [10,12,14,16,18,20,22,24,26,28,30,32,34];
    // const optInAccelerations = [0.0025, 0.005, 0.0075, 0.01, 0.015, 0.02];
    for (const ema_short of Ema_short_periods) {
        for (const ema_long of Ema_long_periods) {
            if (ema_short >= ema_long) {continue;}
            //        for (const accel of optInAccelerations) {
                trading.storageIni(storage);
                for (let i = 100; i < ins.at.length; i++) { //100 to leave some buffer like 500 in CT
                    let close = ins.close.slice(0, i);
                    let high = ins.high.slice(0, i);
                    let low = ins.low.slice(0, i);
                    let short = await talib.ema (close, 1, ema_short);
                    let long = await talib.ema (close, 1, ema_long);
    //                let sarResults = await talib.sar(high, low, 1, accel, accel*10);
    //                trading.ema_sar(close.pop(), short, long, sarResults.pop(), storage);
                    trading.ema_sar(close.pop(), short, long, 1, storage);
                }
    //            ema_params = ema_short+' '+ema_long+' '+accel;
                ema_params = ema_short+' '+ema_long;
                if ((storage.pl > 0) && (storage.sells > 5)) {
                    ema_sar_dataRange[ema_params] = storage.pl;
                    console.log(ema_params, storage.pl);    
                }
    //        }//for
        }//for
    }//for
    if (Object.keys(ema_sar_dataRange).length > 0) {
        let ema_res = Object.keys(ema_sar_dataRange).reduce((a, b) => ema_sar_dataRange[a] > ema_sar_dataRange[b] ? a : b);
        console.log('Optimum for ema_res:', ema_res, '#', ema_sar_dataRange[ema_res]);
    }
    else {
        console.log('Less than 3 trades with current ema_sar_dataRange range');    
    }
*/
/*
//Stoch RSI
    console.log('starting stoch_rsi', new Date());
    const stoch_rsi_dataRange = {};
    const _RSIperiods = [8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26];
    const _Stochperiods = [8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26];
    for (const rsi_period of _RSIperiods) {
        for (const stoch_period of _Stochperiods) {
            if (stoch_period < rsi_period) {continue;}
            trading.storageIni(storage);
            for (let i = 100; i < ins.at.length; i++) { //100 to leave some buffer like 500 in CT
                let close = ins.close.slice(0, i);
                let STOCHRSIResults = await talib.stoch_rsi (close, 1, rsi_period, stoch_period);
                trading.stoch_rsi(close.pop(), STOCHRSIResults.pop(), storage);
            }
            stoch_rsi_params = rsi_period+' '+stoch_period;
            if ((storage.pl > 0) && (storage.sells > 5)) {
                stoch_rsi_dataRange[stoch_rsi_params] = storage.pl;
                console.log(stoch_rsi_params, storage.pl);    
            }
        }//for
    }//for
    let [optimumRSIPeriod, optSTOCHperiod] = [0,0];
    if (Object.keys(stoch_rsi_dataRange).length > 0) {
        let stoch_rsi_res = Object.keys(stoch_rsi_dataRange).reduce((a, b) => stoch_rsi_dataRange[a] > stoch_rsi_dataRange[b] ? a : b);
        console.log('Optimum for stoch_rsi:', stoch_rsi_res, '#', stoch_rsi_dataRange[stoch_rsi_res]);
        [optimumRSIPeriod, optSTOCHperiod] = stoch_rsi_res.split(' ');
        console.log ('optimumRSIPeriod', optimumRSIPeriod, 'optSTOCHperiod', optSTOCHperiod);
    }
    else {
        console.log('Less than 3 trades with current stoch_rsi_dataRange range');    
    }

//Stoch
console.log('starting stoch', new Date());
const stoch_dataRange = {};
const fastK_periods = [4,6,8,10,12,14,16,18,20];
const slowK_periods = [2,3,4,5];
for (const fastK of fastK_periods) {
    for (const slowK of slowK_periods) {
        if (slowK >= fastK) {continue;}
        trading.storageIni(storage);
        for (let i = 100; i < ins.at.length; i++) { //100 to leave some buffer like 500 in CT
            let high = ins.high.slice(0, i);
            let low = ins.low.slice(0, i);
            let close = ins.close.slice(0, i);
            let STOCHResults = await talib.stoch(high,low,close,1,fastK,slowK);
            trading.stoch(close.pop(), STOCHResults.pop(), storage);
        }
        stoch_params = fastK+' '+slowK;
        if ((storage.pl > 0) && (storage.sells > 5)) {
            stoch_dataRange[stoch_params] = storage.pl;
            console.log(stoch_params, storage.pl);    
        }
    }//for
}//for
//let [optimumRSIPeriod, optSTOCHperiod] = [0,0];
if (Object.keys(stoch_dataRange).length > 0) {
    let stoch_res = Object.keys(stoch_dataRange).reduce((a, b) => stoch_dataRange[a] > stoch_dataRange[b] ? a : b);
    console.log('Optimum for stoch:', stoch_res, '#', stoch_dataRange[stoch_res]);
//    [optimumRSIPeriod, optSTOCHperiod] = stoch_res.split(' ');
//    console.log ('optimumRSIPeriod', optimumRSIPeriod, 'optSTOCHperiod', optSTOCHperiod);
}
else {
    console.log('Less than 3 trades with current stoch_dataRange range');    
}
*/
//Stoch
console.log('starting fast stoch', new Date());
const fstoch_dataRange = {};
const f_fastK_periods = [4,5,6,8,10,12,14];
const fastD_periods = [2,3,4,5,6];
for (const fastK of f_fastK_periods) {
    for (const fastD of fastD_periods) {
        if (fastD >= fastK) {continue;}
        trading.storageIni(storage);
        for (let i = 100; i < ins.at.length; i++) { //100 to leave some buffer like 500 in CT
            let high = ins.high.slice(0, i);
            let low = ins.low.slice(0, i);
            let close = ins.close.slice(0, i);
            let fSTOCHResults = await talib.fstoch(high,low,close,1,fastK,fastD);
            trading.fstoch(close.pop(), fSTOCHResults.pop(), storage);
        }
        fstoch_params = fastK+' '+fastD;
        if ((storage.pl > 0) && (storage.sells > 5)) {
            fstoch_dataRange[fstoch_params] = storage.pl;
            console.log(fstoch_params, storage.pl);    
        }
    }//for
}//for
//let [optimumRSIPeriod, optSTOCHperiod] = [0,0];
if (Object.keys(fstoch_dataRange).length > 0) {
    let fstoch_res = Object.keys(fstoch_dataRange).reduce((a, b) => fstoch_dataRange[a] > fstoch_dataRange[b] ? a : b);
    console.log('Optimum for fast_stoch:', fstoch_res, '#', fstoch_dataRange[fstoch_res]);
//    [optimumRSIPeriod, optSTOCHperiod] = stoch_res.split(' ');
//    console.log ('optimumRSIPeriod', optimumRSIPeriod, 'optSTOCHperiod', optSTOCHperiod);
}
else {
    console.log('Less than 3 trades with current fstoch_dataRange range');    
}

console.log('Script ended: ', new Date());
 
}//main

main()

