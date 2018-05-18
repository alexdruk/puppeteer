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
const periods = 5;
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
const MFIperiods = [14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30];
const MFIlags = [1.0, 1.5, 2.0];

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
/*
    let bbResults = await talib.bb(ins.close, 1, 14,  2, 2, 0);
    let bbUpperBand = bbResults.outRealUpperBand;
    let bbLowerBand = bbResults.outRealLowerBand;
    let bbMiddleBand = bbResults.outRealMiddleBand;
    console.log(bbUpperBand.pop(), bbLowerBand.pop(), bbMiddleBand.pop());
    console.log('end')
    process.exit(0);
*/
    //deal with data
    let MFIrange = {};
    for (const period of MFIperiods) {
        trading.storageIni(storage);
        for (let i = 100; i < ins.at.length; i++) { //100 to leave some buffer like 500 in CT
            let high = ins.high.slice(0, i);
            let open = ins.open.slice(0, i);
            let low = ins.low.slice(0, i);
            let close = ins.close.slice(0, i);
            let vol = ins.volume.slice(0, i);
            let mfiResults = await talib.mfi(high, low, close, vol, 1, period);
//            trading.mfi(close.pop(), mfiResults.pop(), storage);
            let std = await talib.std (close, 1, period);
            let bbResults = await talib.bb(close, 1, period,  2, 2, 0);
            let bbUpperBand = bbResults.outRealUpperBand;
            let bbLowerBand = bbResults.outRealLowerBand;
            let bbMiddleBand = bbResults.outRealMiddleBand;
            let macd = await talib.macd (close, 1, 12, 26, period);
/*
            trading.bb(close.pop(), bbUpperBand.pop(), bbLowerBand.pop(), std.pop(), storage);
*/
//            trading.bb_plus_mfi(close.pop(), mfiResults.pop(), bbUpperBand.pop(), bbLowerBand.pop(), std.pop(), storage);
            trading.macd(close.pop(), macd, storage);
        }
        MFIrange[period] = storage.pl;
        console.log(period, storage.pl);
    }
    let MFIres = Object.keys(MFIrange).reduce((a, b) => MFIrange[a] > MFIrange[b] ? a : b);
    const MFI_optimum_period = MFIres;
    console.log(MFIres, MFIrange[MFIres]);

/*
        try {
            fs.appendFileSync(datafile, result);
        } catch (err) {
            console.error('There was an error appending the file!', err);
            return;
        }
*/

    //for
    //    await page.waitFor(60000);
    
    
    console.log('Script ended: ', new Date());
 
}//main

main()

