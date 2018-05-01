//require
const puppeteer = require('puppeteer');
const moment = require('moment');
const fs = require("fs");
const talib = require('./talib.js');
const MFIpage = 'https://cryptotrader.org/backtests/AJtjDNttF4ragZkaJ';
const LOGIN = require('./login.js');
const multiplier = 995;//number for log entries
//const
const pair = 'eth_btc'
const exchange = 'binance'
const interval = '15m'

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

function formatTodayDate(){
	let today = new Date();
	let dt = moment(today).format('YYYY-MM-DD');
	dt = dt + ' 00:00';
//	console.log('enddate =', dt)
	return dt;
}

function formatPrevDate(enddate,interval,multiplier){
    
    if (enddate.indexOf(' 00:00') > -1) {
    	enddate = enddate.replace(' 00:00','')
    }
    var momentObj = moment(enddate, 'YYYY-MM-DD');
    let tm = interval.match(/(\d{1,2})([minhd])/);
//    console.log('time:', tm )
    let timeint = tm[1];
    let timeval = tm[2];
    if (timeval == 'h') {
        timeval = 'hours';
    }
    else if (timeval == 'd'){
        timeval = 'days';
    }
    else {
        timeval = 'minutes';
    }
    let prev = moment(momentObj).subtract(multiplier * timeint, timeval);
	let pdt = moment(prev).format('YYYY-MM-DD HH:mm');
//	pdt = pdt + ' 00:00';
	console.log('prev_date: ', pdt)
	return pdt
}
function formatTestDate(enddate,total_intervals){    
    if (enddate.indexOf(' 00:00') > -1) {
    	enddate = enddate.replace(' 00:00','')
    }
    var momentObj = moment(enddate, 'YYYY-MM-DD');
    let tm = interval.match(/(\d{1,2})([minhd])/);
//    console.log('time:', tm )
    let timeint = tm[1];
    let timeval = tm[2];
    if (timeval == 'h') {
        timeval = 'hours';
    }
    else if (timeval == 'd'){
        timeval = 'days';
    }
    else {
        timeval = 'minutes';
    }
    let prev = moment(momentObj).subtract(total_intervals, timeval);
	let pdt = moment(prev).format('YYYY-MM-DD HH:mm');
//	pdt = pdt + ' 00:00';
	console.log('test_date: ', pdt)
	return pdt
} 
async function getDATA(page, enddate, startdate){
    const PLATFORM_SELECTOR = '#platform'
    const INSTRUMENT_SELECTOR = '#instrument'
    const PERIOD_SELECTOR = '#period'
    const DATESTART_SELECTOR = '#date-start > input[type="text"]'
    const DATEEND_SELECTOR = '#date-end > input[type="text"]'
    const UPDATE_SELECTOR = '#form-data-source > table > tbody > tr:nth-child(2) > td:nth-child(6) > a'
    const SETTINGS_SELECTOR = '#backtest-tab > li:nth-child(1) > a'
    const LOGITEM_SELECTOR = '#log > div > div.log.scroll > div:nth-child(INDEX) > span.message';
    await page.select(PLATFORM_SELECTOR,'bitstamp').catch(e => {console.log(e);});
    await page.select(INSTRUMENT_SELECTOR,'btc_usd').catch(e => {console.log(e);});
    await page.click(DATEEND_SELECTOR).catch(e => {console.log(e);});
    await page.$eval(DATEEND_SELECTOR, input => input.value = '');
    await page.keyboard.type(enddate).catch(e => {console.log(e);});
    await page.click(DATESTART_SELECTOR);
    await page.$eval(DATESTART_SELECTOR, input => input.value = '');
    await page.keyboard.type(startdate).catch(e => {console.log(e);});
    await page.click(UPDATE_SELECTOR).catch(e => {console.log(e);});
    await page.waitFor(30000);
    await page.click(SETTINGS_SELECTOR);
    let paramsExists = false;
    if (await page.$('#dialog-backtest-params') !== null) {
          paramsExists = true;
    }
    if (paramsExists) {await page.click(RUN2_SELECTOR);};
    await page.waitFor(30000);
    let logitems = 0
    await page.waitForSelector('#log > div > div.log.scroll > div:nth-child(10) > span.message', {timeout:120000}); //wait for 10th message for 2min
    logitems = await page.evaluate((sel) => {
       let element = document.querySelector(sel);
        return element.children.length;
    }, '#log > div > div.log.scroll');
    if (logitems < 999) {
        console.log('WARNING: logitems:', logitems);
    }
    for(var i = 3; i <= logitems-3; i++)  {
        let dat = await page.evaluate((sel) => {
            let element = document.querySelector(sel);
            return element.innerHTML;
          }, LOGITEM_SELECTOR.replace("INDEX", i));
          data = JSON.parse(dat)
          if (data.L && data.H && data.O && data.C && data.V && data.A) {
            ins.low.push(data.L)
            ins.high.push(data.H)
            ins.open.push(data.O)
            ins.close.push(data.C)
            ins.volume.push(data.V)
            ins.at.push(data.A)    
        }
        else {
            console.log(i,data.L,data.H,data.O,data.C,data.V,data.A)
        }
    }
    console.log('datalength:', ins.low.length, ins.high.length, ins.open.length, ins.close.length, ins.volume.length, ins.at.length);
    return ins;
}

//main
async function main() {
	console.log('Script started: ', new Date())
	let count = 0;
	const browser = await puppeteer.launch();
//	const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
//login
    await LOGIN.login(browser)
//collect data from strategies page
    await page.goto(MFIpage);
    await page.reload()
    await page.waitForSelector('#form-data-source');
    console.log('got strategy page')
    let enddate = formatTodayDate();
    for (let index = 0; index < 5; index++) {
        let startdate =  formatPrevDate(enddate, interval, multiplier);
        shouldRepeat = false;
        ins = await getDATA(page, enddate, startdate).catch(e => {console.log(e);shouldRepeat = true;});
        if (shouldRepeat) {
             index--;
             continue;
        }
        else {
            enddate = startdate;
        }
    }
    browser.close();
//deal with data
    console.log('datalength1:', ins.low.length, ins.high.length, ins.open.length, ins.close.length, ins.volume.length, ins.at.length);
    let Results = await talib.mfi(ins.high, ins.low, ins.close, ins.volume, 1, 20);
    //    await page.waitFor(60000);
    console.log (Results.pop(), Results.length);
    enddate = formatTodayDate();
    console.log(enddate, formatTestDate(enddate,Results.length));
    console.log('Script ended: ', new Date());

}

main()

