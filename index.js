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
const periods = 4;
let repeatAttemts = 3;
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
    let fileExists = false;
    if (fs.existsSync(filename)) {
        let rawdata = fs.readFileSync(filename, e => {console.log(e);});
        ins = JSON.parse(rawdata); 
    }
    else {
        ins = await chromium.main(platform, instrument, interval, filename);
    }
/* the child process does not work with promises and cannot await
    if (ins) {
        // start child processes
        const { spawn } = require('child_process');
        const child = spawn('node', ['child.js', filename]);

        child.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        });

        child.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
        });

        child.on('exit', function (code, signal) {
            console.log('child process exited with ' +
                        `code ${code} and signal ${signal}`);
          });
    }//if ins
*/

    //deal with data
//MFI
    console.log('starting mfi');
    let MFIrange = {};
    const MFIperiods = [14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30];
    for (const period of MFIperiods) {
        trading.storageIni(storage);
        for (let i = 100; i < ins.at.length; i++) { //100 to leave some buffer like 500 in CT
            let high = ins.high.slice(0, i);
            let open = ins.open.slice(0, i);
            let low = ins.low.slice(0, i);
            let close = ins.close.slice(0, i);
            let vol = ins.volume.slice(0, i);
            let mfiResults = await talib.mfi(high, low, close, vol, 1, period);
            trading.mfi(close.pop(), mfiResults.pop(), storage);
/*            let std = await talib.std (close, 1, period);
            let bbResults = await talib.bb(close, 1, period,  2, 2, 0);
            let bbUpperBand = bbResults.outRealUpperBand;
            let bbLowerBand = bbResults.outRealLowerBand;
            let bbMiddleBand = bbResults.outRealMiddleBand;
            let macd = await talib.macd (close, 1, 12, 26, period);

*/
            //            trading.bb(close.pop(), bbUpperBand.pop(), bbLowerBand.pop(), std.pop(), storage);

//            trading.bb_plus_mfi(close.pop(), mfiResults.pop(), bbUpperBand.pop(), bbLowerBand.pop(), std.pop(), storage);
//            trading.macd(close.pop(), macd, storage);
        }
        MFIrange[period] = storage.pl;
        console.log(period, storage.pl);
    }
    let MFIres = Object.keys(MFIrange).reduce((a, b) => MFIrange[a] > MFIrange[b] ? a : b);
    const MFI_optimum_period = MFIres;
    console.log(MFIres, MFIrange[MFIres]);
//BB
console.log('starting bb', new Date());
const dataRange = {};
const BBperiods = [9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26];
const stds = [0.5,1.0,1.5,2.0,2.5,3.0,3.5];
const MATypes = [0];
for (const period of BBperiods) {
    for (const n_stds of stds) {
        for (const type of MATypes) {
            trading.storageIni(storage);
            for (let i = 100; i < ins.at.length; i++) { //100 to leave some buffer like 500 in CT
                let high = ins.high.slice(0, i);
                let open = ins.open.slice(0, i);
                let low = ins.low.slice(0, i);
                let close = ins.close.slice(0, i);
                let vol = ins.volume.slice(0, i);
        //        let mfiResults = await talib.mfi(high, low, close, vol, 1, period);
        //            trading.mfi(close.pop(), mfiResults.pop(), storage);
                let std = await talib.std (close, 1, period);
                let bbResults = await talib.bb(close, 1, period,  n_stds, n_stds, type);
                let bbUpperBand = bbResults.outRealUpperBand;
                let bbLowerBand = bbResults.outRealLowerBand;
                let bbMiddleBand = bbResults.outRealMiddleBand;
        //        let macd = await talib.macd (close, 1, 12, 26, period);


                trading.bb(close.pop(), bbUpperBand.pop(), bbLowerBand.pop(), std.pop(), storage);

        //            trading.bb_plus_mfi(close.pop(), mfiResults.pop(), bbUpperBand.pop(), bbLowerBand.pop(), std.pop(), storage);
        //            trading.macd(close.pop(), macd, storage);
            }
            bb_params = period+','+n_stds+','+type;
            dataRange[bb_params] = storage.pl;
            console.log(bb_params, storage.pl);
        }//for
    }//for
}//for
let res = Object.keys(dataRange).reduce((a, b) => dataRange[a] > dataRange[b] ? a : b);
const optimum_params= MFIres;
console.log(res, dataRange[res]);

    
    console.log('Script ended: ', new Date());
 
}//main

main()

