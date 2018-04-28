//require
const puppeteer = require('puppeteer');
const CREDS = require('./creds');
const moment = require('moment');
const fs = require("fs");
const talib = require('talib');
//console.log("TALib Version: " + talib.version);

//const LOGIN = require('./login');

//const
const pair = 'eth_btc'
const exchange = 'binance'
const interval = '15m'
const ENDDATE = formatTodayDate();
//let low, high, open, close, vol, at = [];
let ins = {
    low:[],
    high:[],
    open:[],
    close:[],
    vol:[],
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

function formatPrevDate(enddate,interval){
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
    let prev = moment(momentObj).subtract(995 * timeint, timeval);
	let pdt = moment(prev).format('YYYY-MM-DD HH:mm');
//	pdt = pdt + ' 00:00';
	console.log('prev_date: ', pdt)
	return pdt
}
/*
    function calculate MFI using standard module
    @params - data, lag  and period
    @return: MFI array
*/
function getMFI(high, low, close, volume,lag, period) {
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
            console.log("ADX Function Results:");
            console.log(result);
    });
}
 
async function getDATA(page){
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
    await page.keyboard.type(ENDDATE).catch(e => {console.log(e);});
    STARTDATE = formatPrevDate(ENDDATE, interval);
    await page.click(DATESTART_SELECTOR);
    await page.$eval(DATESTART_SELECTOR, input => input.value = '');
    await page.keyboard.type(STARTDATE).catch(e => {console.log(e);});
    await page.click(UPDATE_SELECTOR).catch(e => {console.log(e);});
    await page.waitFor(2000);
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
            ins.vol.push(data.V)
            ins.at.push(data.A)    
        }
        else {
            console.log(i,data.L,data.H,data.O,data.C,data.V,data.A)
        }
    }
    console.log('datalength:', ins.low.length, ins.high.length, ins.open.length, ins.close.length, ins.vol.length, ins.at.length);
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
//    LOGIN.login(page)
    await page.goto('https://cryptotrader.org');
    await page.setViewport({width: 1280, height: 1000});
    const SIGNIN = '#navbar-container > div.navbar-header.pull-right > ul > li.grey > a'
    await page.click(SIGNIN);
    await page.waitForSelector('#dialog-login', {timeout:60000});

    const USERNAME_SELECTOR = '#dialog-login > div > div > div.modal-body > form > div:nth-child(1) > span > input[type="text"]';
    const PASSWORD_SELECTOR = '#dialog-login > div > div > div.modal-body > form > div:nth-child(2) > span > input[type="password"]';
    const BUTTON_SELECTOR = '#dialog-login > div > div > div.modal-body > form > button';
    await page.click(USERNAME_SELECTOR);
    await page.keyboard.type(CREDS.username);

    await page.click(PASSWORD_SELECTOR);
    await page.keyboard.type(CREDS.password);

    await page.click(BUTTON_SELECTOR);
    await page.waitForSelector('#user_info', {timeout:60000});
    console.log('login success')

//collect data from strategies page
    await page.goto('https://cryptotrader.org/backtests/AJtjDNttF4ragZkaJ');
    await page.reload()
    await page.waitForSelector('#form-data-source');
    console.log('got strategy page')
    ins = await getDATA(page).catch(e => {console.log(e);shouldRepeat = true;});
    console.log('datalength1:', ins.low.length, ins.high.length, ins.open.length, ins.close.length, ins.vol.length, ins.at.length);
    let res = MFI(ins.high, ins.low, ins.close, ins.volume, 1, 20);
    //    await page.waitFor(60000);
	console.log('Script ended: ', new Date())
    browser.close();
}

main()

