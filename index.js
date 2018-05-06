const moment = require('moment');
//require
const puppeteer = require('puppeteer');
const fs = require("fs");
const talib = require('./talib.js');
const MFIpage = 'https://cryptotrader.org/backtests/Ajm85S57R7tAJoFxd';
const LOGIN = require('./login.js');
const TIME = require('./time_functions.js');
const multiplier = 800;//number for log entries
const periods = 5;
let repeatAttemts = 3;

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
//deal with data
    let Results = await talib.mfi(ins.high, ins.low, ins.close, ins.volume, 1, 20);
    //    await page.waitFor(60000);
    console.log (Results.pop(), Results.length);
    console.log('Script ended: ', new Date());
 
}//main

main()

