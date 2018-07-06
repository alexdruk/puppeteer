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
    const MFIperiods = [14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30];
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
        if ((storage.pl !== 0) && (storage.sells > 5)) {
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
*/
    //BB
console.log('starting bb', new Date());
const bb_dataRange = {};
const BBperiods = [8,9,10,11,12,13,14,15];
const stds = [0.5,1.0,1.5];
const STDperiods = [5,7,9,11];
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
            if ((storage.pl !== 0) && (storage.sells > 5)) {
                bb_dataRange[bb_params] = storage.pl;
                console.log(bb_params, storage.pl);
            }
        }//for
    }//for
}//for
if (Object.keys(bb_dataRange).length > 0) {
    let bb_res = Object.keys(bb_dataRange).reduce((a, b) => bb_dataRange[a] > bb_dataRange[b] ? a : b);
    console.log('Optimum for bb:', bb_res,  '#', bb_dataRange[bb_res]);
}
else {
    console.log('Less than 3 trades with current bb_dataRange range');    
}
/*
console.log('starting macd', new Date());
const macd_dataRange = {};
const Fast_periods = [8,10,12,14];
const Slow_periods = [14,16,18,20,22,24,26,28,30];
const Signal_periods = [2,4,6,8,10];
for (const fast of Fast_periods) {
    for (const slow of Slow_periods) {
        for (const signal of Signal_periods) {
            trading.storageIni(storage);
            for (let i = 100; i < ins.at.length; i++) { //100 to leave some buffer like 500 in CT
                let close = ins.close.slice(0, i);
                let macd = await talib.macd (close, 1, fast, slow, signal);
                trading.macd(close.pop(), macd, storage);
            }
            macd_params = fast+' '+slow+' '+signal;
            if ((storage.pl !== 0) && (storage.sells > 5)) {
                macd_dataRange[macd_params] = storage.pl;
                console.log(macd_params, storage.pl);    
            }
        }//for
    }//for
}//for
if (Object.keys(macd_dataRange).length > 0) {
    let macd_res = Object.keys(macd_dataRange).reduce((a, b) => macd_dataRange[a] > macd_dataRange[b] ? a : b);
    console.log('Optimum for macd:', macd_res, '#', macd_dataRange[macd_res]);
}
else {
    console.log('Less than 3 trades with current macd_dataRange range');    
}
/*   
//BB+MFI
console.log('starting bb+mfi', new Date());
const bbmfi_dataRange = {};
const BBmfiperiods = [8,10,12,14,16,18,20,22,24,26];
const stds_mfi = [1.0,1.5,2.0,2.5,3.0];
const bb_mfi_periods = [14,16,18,20,22,24,26,28,30];
for (const period of BBmfiperiods) {
    for (const n_stds of stds_mfi) {
        for (const mfi of bb_mfi_periods) {
            trading.storageIni(storage);
            for (let i = 100; i < ins.at.length; i++) { //100 to leave some buffer like 500 in CT
                let high = ins.high.slice(0, i);
                let open = ins.open.slice(0, i);
                let low = ins.low.slice(0, i);
                let close = ins.close.slice(0, i);
                let vol = ins.volume.slice(0, i);
                let std = await talib.std (close, 1, period);
                let bbResults = await talib.bb(close, 1, period,  n_stds, n_stds, 0);
                let bbUpperBand = bbResults.outRealUpperBand;
                let bbLowerBand = bbResults.outRealLowerBand;
                let mfiResults = await talib.mfi(high, low, close, vol, 1, mfi);
                trading.bb(close.pop(), mfiResults.pop(), bbUpperBand.pop(), bbLowerBand.pop(), std.pop(), storage);
            }
            bb_params = period+','+n_stds+','+mfi;
            if (storage.pl !== 0) {
                bbmfi_dataRange[bb_params] = storage.pl;
                console.log(bb_params, storage.pl);
            }
        }//for
    }//for
}//for
if (Object.keys(bbmfi_dataRange).length > 0) {
    let bb_mfi_res = Object.keys(bbmfi_dataRange).reduce((a, b) => bbmfi_dataRange[a] > bbmfi_dataRange[b] ? a : b);
    console.log('Optimum for bb_mfi:', bb_mfi_res, bbmfi_dataRange[bb_mfi_res]);
}
else {
    console.log('Less than 3 trades with current bbmfi_dataRange range');    
}
*/   

console.log('Script ended: ', new Date());
 
}//main

main()

