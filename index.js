//require
const moment = require('moment');
const puppeteer = require('puppeteer');
chromium = require('./chromium.js');
const fs = require("fs");
const talib = require('./talib.js');
const MFIpage = 'https://cryptotrader.org/backtests/Ajm85S57R7tAJoFxd';
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

//deal with data
//    console.log('at.l:', ins.at.length, 'close.l:', ins.close.length);
    let dataOK = chromium.checkData(interval);
    for (let i = 100; i < ins.at.length; i++) { //100 tom leave some buffer like 500 in CT
        let high = ins.high.slice(0, i);
        let open = ins.open.slice(0, i);
        let low = ins.low.slice(0, i);
        let close = ins.close.slice(0, i);
        let vol = ins.volume.slice(0, i);
        trading.mfi(ins.close[i], storage);
        let mfiResults = await talib.mfi(high, low, close, vol, 1, 20);
//    console.log (mfiResults.pop(), mfiResults.length);
    }//for
    //    await page.waitFor(60000);
    
    
    console.log('Script ended: ', new Date());
 
}//main

main()

