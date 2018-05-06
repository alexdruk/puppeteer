//require
const moment = require('moment');
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

function chechData(interval) {
    let tm = interval.match(/(\d{1,2})([minhd])/);
    let timeint = tm[1];
    let timeval = tm[2];
    let shouldBeInt = timeint * 60000;
    if (timeval === 'h') {
        shouldBeInt = shouldBeInt * 60;
    }
    else if (timeval === 'd'){
        shouldBeInt = shouldBeInt * 1440;
    }
    let prev_at = ins.at[0];
    let dataOK = false;
    for (let i = 1; i < ins.at.length; i++) {
        let diff = ins.at[i] - prev_at
        if (diff !== 900000) {
            let dat = new Date(ins.at[i]);
            dt = moment(dat).format('YYYY-MM-DD HH:mm');
            let prev = new Date(prev_at);
            prev_dt = moment(prev).format('YYYY-MM-DD HH:mm');
            console.log(i, dt, prev_dt, diff);
        }
        else {
            dataOK = true;
            
        }
        prev_at = ins.at[i];
    }//for
    return dataOK;
} 
async function getDATA(page, enddate, startdate, platform,instrument,interval){
    const PLATFORM_SELECTOR = '#platform'
    const INSTRUMENT_SELECTOR = '#instrument'
    const PERIOD_SELECTOR = '#period'
    const DATESTART_SELECTOR = '#date-start > input[type="text"]'
    const DATEEND_SELECTOR = '#date-end > input[type="text"]'
    const UPDATE_SELECTOR = '#form-data-source > table > tbody > tr:nth-child(2) > td:nth-child(6) > a'
    const SETTINGS_SELECTOR = '#backtest-tab > li:nth-child(1) > a'
    const BACKTEST_BUTTON = '#settings > div.actions > a.btn.btn-backtest.btn-primary'
    const LOGITEM_SELECTOR = '#log > div > div.log.scroll > div:nth-child(INDEX) > span.message';
    const RUN1_SELECTOR = '#dialog-backtest > div > div > div.modal-footer > button'
    const RUN2_SELECTOR = '#dialog-backtest-params > div > div > div.modal-footer > button'
    await page.waitForSelector('#form-data-source', {timeout:60000}).catch(e => {console.log(e);});
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
	await page.click(BACKTEST_BUTTON);
    await page.click(RUN1_SELECTOR);
    let paramsExists = false;
    if (await page.$('#dialog-backtest-params') !== null) {
          paramsExists = true;
    }
    if (paramsExists) {await page.click(RUN2_SELECTOR);};
    await page.waitForSelector('#log > div.label.label-important', {timeout:120000}).catch(e => {console.log(e);}); //wait for 'compiling' message
    await page.waitFor(40000);//IMPORTANT! OTHERWISE IT READ PREVIOUS LOG
    let compileFinished = false;
    if (await page.$('#log > div.label.label-important') == null) { // message disapear
        compileFinished = true;
    }
    if (compileFinished) {
        await page.waitForSelector('#log > div > div.log.scroll > div:nth-child(100) > span.message', {timeout:120000}).catch(e => {console.log(e);}); //wait for 100th message for 2min
        logitems = await page.evaluate((sel) => {
            let element = document.querySelector(sel);
             return element.children.length;
         }, '#log > div > div.log.scroll');
        console.log('got logitems:', logitems);
    
        let items = await page.evaluate(() => {
            const tds = Array.from(document.querySelectorAll('span.message'));
            return tds.map(td => td.innerHTML);
        });
        let times = await page.evaluate(() => {
            const tds = Array.from(document.querySelectorAll('span.time'));
            return tds.map(td => td.innerHTML);
        });
        for(var i = 2; i <= items.length-3; i++)  {
/*            if (i<3) {
                console.log('i', i, 'data',  items[i]);
            }
*/
            let  data = JSON.parse(items[i]);
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
        let first = JSON.parse(items[2]).A;
        let last =  JSON.parse(items[items.length-3]).A;;
        first = new Date(first);
        first = moment(first).format('YYYY-MM-DD HH:mm')
        last = new Date(last);
        last = moment(last).format('YYYY-MM-DD HH:mm')
        console.log('first:', first, ' last:', last)
//        console.log('datalength:', ins.low.length, ins.high.length, ins.open.length, ins.close.length, ins.volume.length, ins.at.length);
        items = [];
//        console.log(await page.url())    
        return ins;
    }
    else {
        //should repeat?
        return null;
    }
} //getDATA

//main
async function main() {
	console.log('Script started: ', new Date())
	let count = 0;
	const browser = await puppeteer.launch();
//	const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
//login
    await LOGIN.login(page)
//collect data from strategies page
    await page.goto(MFIpage).catch(e => {console.log(e);process.exit(1);});;
    await page.setViewport({width: 1280, height: 1000});
    await page.reload()
    console.log('got strategy page')
//    await page.waitFor(30000);
    let ranges = TIME.ranges(periods, interval, multiplier);
    for (let i = 0; i < periods; i++) {
        let startdate = ranges[i].start;
        let enddate = ranges[i].end;
        shouldRepeat = false;
        console.log('iteration: ', i)
        ins = await getDATA(page, enddate, startdate, platform, instrument, interval).catch(e => {console.log(e);shouldRepeat = true;});
//        console.log('startdate: ', startdate, ' enddate: ', enddate)
        if (!ins) { // return null
            shouldRepeat = true;
        }
        if (shouldRepeat && (repeatAttemts === 0)) {
            console.log('repeating...')
            i--;
            repeatAttemts--;
            continue;
        }
        if (!repeatAttemts){
            process.exit(1);
        }

    }
    browser.close();
//deal with data

    let dataOK = chechData(interval);
    if (dataOK){
        console.log('DATA IS OK!');
        fs.writeFileSync(filename, JSON.stringify(ins, null, 4), (err) => {
            if (err) {
                console.error(err);
                return;
            };
            console.log("File ", filename, " has been created");
            process.exit(0);
        });
    }
    console.log('Script ended: ', new Date());
}//main

main()

