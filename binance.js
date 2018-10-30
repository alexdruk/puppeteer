//const path = '/home/ec2-user/puppeteer';
const path = '.';
const fs = require('fs');
const request = require('request');
const moment = require('moment');
//const symbols = ["ada_btc","ada_usdt","bcc_btc","bcc_usdt","bnb_btc","bnb_usdt","bnt_btc","btc_usdt","dgd_btc","dgd_eth","eng_btc","eos_btc","eos_eth","eos_usdt","etc_btc","etc_eth","etc_usdt","eth_btc","eth_usdt","icx_btc","iota_btc","iota_eth","iota_usdt","link_btc","ltc_btc","ltc_usdt","lun_btc","nano_btc","neo_btc","neo_eth","neo_usdt","omg_btc","ont_btc","qtum_usdt","trx_btc","trx_usdt","ven_btc","vibe_btc","wabi_eth","wtc_btc","xlm_btc","xlm_usdt","xrp_btc","xrp_eth","xrp_usdt","xvg_btc","zil_btc","zrx_btc"];
const symbols = ["btc_usdt"];
//const intervals = ["5m"];

const intervals = ["1m","5m","15m","30m","1h","2h"];
let today = moment(new Date()).format('YYYY-MM-DD');
let dt = today + ' 00:00';
//console.log('dt=', dt)
//console.log('timestamp=', moment(dt).valueOf())

let dateForFile = today.replace('2018-','');
  
  // Usage:
  
async function main() {
    for (let index = 0; index < symbols.length; index++) {
        let old_symbol = symbols[index];
        symbol = old_symbol.replace('_','').toUpperCase();
        for (let i = 0; i < intervals.length; i++) {
            interval = intervals[i];
            let filename = path+'/data/binance_'+old_symbol+'_'+interval+'_'+dateForFile+'.json';
            if (interval == '1m') { start = moment(dt).subtract(2000, 'm').valueOf();}
            if (interval == '5m') { start = moment(dt).subtract(2000*5, 'm').valueOf();}
            if (interval == '15m') { start = moment(dt).subtract(2000*15, 'm').valueOf();}
            if (interval == '30m') { start = moment(dt).subtract(2000*30, 'm').valueOf();}
            if (interval == '1h') { start = moment(dt).subtract(2000*60, 'm').valueOf();}
            if (interval == '2h') { start = moment(dt).subtract(2000*120, 'm').valueOf();}
            let ins = {
                low:[],
                high:[],
                open:[],
                close:[],
                volume:[],
                at:[]
            };
            let requestCount = 4;
            while (requestCount) {
                let url = "https://api.binance.com/api/v1/klines?symbol="+symbol+"&interval="+interval+"&startTime="+start;
                console.log(url);
                requestCount--;
                let res = await doRequest(url);
                arr = JSON.parse(res);
                for (let index = 0; index < arr.length; index++) {
                    const el = arr[index];
                    ins.at.push(el[0]);
                    ins.open.push(parseFloat(el[1]));
                    ins.high.push(parseFloat(el[2]));
                    ins.low.push(parseFloat(el[3]));
                    ins.close.push(parseFloat(el[4]));
                    ins.volume.push(parseFloat(el[5]));
                }//for
                start = ins.at[ins.at.length-1] + (ins.at[1] - ins.at[0]);
//                console.log(ins.at[ins.at.length-1], ins.at[1], ins.at[0]);
            }//while
            await checkData(interval, ins);
            try {
                fs.writeFileSync(filename, JSON.stringify(ins, null, 4));
                console.log("File ", filename, " has been created");
            } catch (error) {
                console.error(error);
            }
            await waitfor(1000);
        }//for    
    }//for
    console.log('All end');
}//main

function doRequest(url) {
    return new Promise(function (resolve, reject) {
      request(url, function (error, res, body) {
        if (!error && res.statusCode == 200) {
            resolve(body);
        } else {
            console.log('status:', res.statusCode, 'Error:', error);
            reject(error);
        }
      });
    });
}

function waitfor(ms) {
//    console.log('going to sleep for', ms, 'ms');
    return new Promise(res => setTimeout(res, ms));
};
function checkData(interval, ins) {
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
    console.log('Data is OK = ', dataOK)
    return dataOK;
}

main();