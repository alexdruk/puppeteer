const moment = require('moment');
const puppeteer = require('puppeteer');
const fs = require("fs");
const CTpage = 'https://cryptotrader.org/backtests/Ajm85S57R7tAJoFxd';
const LOGIN = require('./login.js');
const TIME = require('./time_functions.js');
const multiplier = 800;//number for log entries
let repeatAttemts = 3;
let periods = 3;
let ins = {
    low:[],
    high:[],
    open:[],
    close:[],
    volume:[],
    at:[]
};

module.exports = { 
    checkData:function checkData(interval) {
        let tm = interval.match(/(\d{1,2})([minhd])/);
        let timeint = tm[1];
        let timeval = tm[2];
        let shouldBeInt = timeint * 60000;
//        console.log('timeint', timeint, 'timeval', timeval, 'shouldBeInt', shouldBeInt)
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
            if (diff !== shouldBeInt) {
                let dat = new Date(ins.at[i]);
                dt = moment(dat).format('YYYY-MM-DD HH:mm');
                let prev = new Date(prev_at);
                prev_dt = moment(prev).format('YYYY-MM-DD HH:mm');
                console.log(i, dt, prev_dt, diff);
                console.log('data is irregular');
                dataOK = false;
                break;
            }
            else {
                dataOK = true;
                
            }
            prev_at = ins.at[i];
        }//for
//        dataOK = [ins.at.length, ins.close.length, ins.high.length, ins.low.length, ins.open.length, ins.volume.length].every((v, i, a) => 
//            v == a[0] );
        
//        if (ins.at.length == ins.close.length == ins.high.length == ins.low.length == ins.open.length == ins.volume.length) {
//            dataOK = true;
//        }
//        else {
//            dataOK = false;            
//        }
        console.log('Data is OK = ', dataOK)
        return dataOK;
    }, 
    getDATA:async function getDATA(page, enddate, startdate, platform,instrument,interval){
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
        await page.waitForSelector('#form-data-source', {timeout:60000}).catch(e => {
            console.log(e);
            return null;
        });
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
        await page.click(SETTINGS_SELECTOR).catch(e => {console.log(e);});
        await page.click(BACKTEST_BUTTON).catch(e => {console.log(e);});
        await page.click(RUN1_SELECTOR).catch(e => {
            console.log(e);
            return null;
        });
        let paramsExists = false;
        if (await page.$('#dialog-backtest-params') !== null) {
              paramsExists = true;
        }
        if (paramsExists) {await page.click(RUN2_SELECTOR);};
        let repeat = false
        await page.waitForSelector('#log > div.label.label-important', {timeout:120000}).catch(e => 
            {
                console.log(e); //wait for 'compiling' message
                if (e.message.indexOf('TimeoutError') > -1) {
                    return null; //repeat
                }
            });
        await page.waitFor(40000);//IMPORTANT! OTHERWISE IT READ PREVIOUS LOG
        let compileFinished = false;
        if (await page.$('#log > div.label.label-important') == null) { // message disapear
            compileFinished = true;
        }
        if (compileFinished) {
            await page.waitForSelector('#log > div > div.log.scroll > div:nth-child(100) > span.message', {timeout:120000}).catch(e => 
                {console.log(e);}); //wait for 100th message for 2min
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
            for(var i = 2; i <= items.length-3; i++)  { //raw data from CT
                let  data = JSON.parse(items[i]);
                if (data.L && data.H && data.O && data.C && data.V && data.A) {
                    try {
                        ins.low.push(data.L)
                        ins.high.push(data.H)
                        ins.open.push(data.O)
                        ins.close.push(data.C)
                        ins.volume.push(data.V)
                        ins.at.push(data.A)
                    }
                    catch (err) {
                        console.log(err);
                        return null;
                    }   
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
            console.log('datalength:', ins.low.length, ins.high.length, ins.open.length, ins.close.length, ins.volume.length, ins.at.length);
            items = [];
    //        console.log(await page.url())    
            return ins;
        }
        else {
            //should repeat?
            return null;
        }
    }, //getDATA
    
    main:async function main(platform, instrument, interval, filename) {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
    //login
        await LOGIN.login(page)
        let ranges = TIME.ranges(periods, interval, multiplier);
        for (let i = 0; i < ranges.length; i++) {
            await page.goto(CTpage).catch(e => {console.log(e);process.exit(1);});
            await page.setViewport({width: 1280, height: 1000});
            await page.reload()
            console.log('got strategy page')
            let startdate = ranges[i].start;
            let enddate = ranges[i].end;
            shouldRepeat = false;
            console.log('iteration: ', i)
            ins = await this.getDATA(page, enddate, startdate, platform, instrument, interval).catch(e => {console.log(e);shouldRepeat = true;});
    //        console.log('startdate: ', startdate, ' enddate: ', enddate)
            if (!ins) { // return null
                shouldRepeat = true;
            }
            if (shouldRepeat && (repeatAttemts > 0)) {
                console.log('repeating iteration ', i, ' times ', repeatAttemts)
                await page.waitFor(30000);
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

        let dtOK = this.checkData(interval);
        try {
            fs.writeFileSync(filename, JSON.stringify(ins, null, 4));
            console.log("File ", filename, " has been created");
        } catch (error) {
            console.error(error);
        }
        return ins;
    }
} 