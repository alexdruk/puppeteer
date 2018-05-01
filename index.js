//require
const puppeteer = require('puppeteer');
const fs = require("fs");
const talib = require('./talib.js');
const MFIpage = 'https://cryptotrader.org/backtests/AJtjDNttF4ragZkaJ';
const LOGIN = require('./login.js');
const TIME = require('./time_functions.js');
const multiplier = 995;//number for log entries
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
console.log(platform, instrument, interval);


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


 
async function getDATA(page, enddate, startdate, platform,instrument,interval){
    const PLATFORM_SELECTOR = '#platform'
    const INSTRUMENT_SELECTOR = '#instrument'
    const PERIOD_SELECTOR = '#period'
    const DATESTART_SELECTOR = '#date-start > input[type="text"]'
    const DATEEND_SELECTOR = '#date-end > input[type="text"]'
    const UPDATE_SELECTOR = '#form-data-source > table > tbody > tr:nth-child(2) > td:nth-child(6) > a'
    const SETTINGS_SELECTOR = '#backtest-tab > li:nth-child(1) > a'
    const LOGITEM_SELECTOR = '#log > div > div.log.scroll > div:nth-child(INDEX) > span.message';
    await page.select(PLATFORM_SELECTOR, platform).catch(e => {console.log(e);});
    await page.select(INSTRUMENT_SELECTOR, instrument).catch(e => {console.log(e);});
    await page.select(PERIOD_SELECTOR,interval).catch(e => {console.log(e);});
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
    let enddate = TIME.today();
    for (let index = 0; index < 5; index++) {
        let startdate =  TIME.prevdate(enddate, interval, multiplier);
        shouldRepeat = false;
        ins = await getDATA(page, enddate, startdate, platform, instrument, interval).catch(e => {console.log(e);shouldRepeat = true;});
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
    enddate = TIME.today();
    console.log('endDate: ',enddate, 'testDate: ', TIME.prevdate(enddate, interval, Results.length));
    console.log('Script ended: ', new Date());

}

main()

