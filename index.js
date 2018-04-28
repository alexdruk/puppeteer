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
    let prev = moment(momentObj).subtract(3000 * timeint, timeval);
	let pdt = moment(prev).format('YYYY-MM-DD');
	pdt = pdt + ' 00:00';
	console.log('prev_date: ', pdt)
	return pdt
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
    await page.waitForSelector('#dialog-login');

    const USERNAME_SELECTOR = '#dialog-login > div > div > div.modal-body > form > div:nth-child(1) > span > input[type="text"]';
    const PASSWORD_SELECTOR = '#dialog-login > div > div > div.modal-body > form > div:nth-child(2) > span > input[type="password"]';
    const BUTTON_SELECTOR = '#dialog-login > div > div > div.modal-body > form > button';
    await page.click(USERNAME_SELECTOR);
    await page.keyboard.type(CREDS.username);

    await page.click(PASSWORD_SELECTOR);
    await page.keyboard.type(CREDS.password);

    await page.click(BUTTON_SELECTOR);
    await page.waitForSelector('#user_info');
    console.log('login success')

//collect data from strategies page
    await page.goto('https://cryptotrader.org/backtests/vxjkZXh2EoPTsJy2t');
    await page.reload()
    await page.waitForSelector('#form-data-source');

    console.log('got strategy page')
	console.log('Script ended: ', new Date())
    browser.close();
}

main()

