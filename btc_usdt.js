//require
chromium = require('./chromium.js');
const fs = require('fs');
const talib = require('./talib.js');
const TIME = require('./time_functions.js');
const trading = require('./trading.js');
const f = require('./functions.js');
//const pool = require('./db_amazon.js')
let storage = {};
let fees = {}
fees['binance'] = 0.175
fees['bitstamp'] = 0.425
fees['poloniex'] = 0.35
fees['cdax'] = 0.425
fees['nuobipro'] = 0.35
fees['wex'] = 0.35
fees['cexio'] = 0.425
fees['bifinex'] = 0.35
fees['kraken'] = 0.175

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
const filename = '/home/ec2-user/puppeteer/data/'+platform +'_'+instrument+'_'+interval+'_'+TIME.today().replace(' 00:00','').replace('2018-','')+'.json';
console.log(platform, instrument, interval, filename);
const fee = fees[platform];
let trades = 5;

//let low, high, open, close, vol, at = [];
let ins = {
    low:[],
    high:[],
    open:[],
    close:[],
    volume:[],
    at:[]
};
const dataRange = {};


async function main() {
    console.log('Script started: ', new Date())
    let sqlResult = await f.set_in_work(platform, instrument).catch(e => {console.log(e);});
    if (sqlResult) {console.log('in_work was set');}
//get data
    if (fs.existsSync(filename)) {
        let rawdata = fs.readFileSync(filename, e => {console.log(e);});
        ins = JSON.parse(rawdata); 
    }
    else {
        ins = await chromium.main(platform, instrument, interval, filename);
    }
    let sliceAt = 0;
    let multiplicator = 1;

    if (interval == '2h'){sliceAt = -600;}
    else if (interval == '1h'){sliceAt = -1200;}
    else {sliceAt = -2000;};
    if ((interval == '2h')||(interval == '1h')){trades = 3}
    ins.close = ins.close.slice(sliceAt);
    ins.high = ins.high.slice(sliceAt);
    ins.low = ins.low.slice(sliceAt);
    ins.open = ins.open.slice(sliceAt);
    ins.volume = ins.volume.slice(sliceAt);
    ins.at = ins.at.slice(sliceAt); 

    let firstBH = (ins.close[50] + ins.close[51] + ins.close[52])/3;
    let lastBH = (ins.close[ins.close.length-1] + ins.close[ins.close.length-2] + ins.close[ins.close.length-3])/3;
    let BH = (lastBH - firstBH)/firstBH; 
    console.log('BHlast', lastBH, 'BHfirst', firstBH, 'BH', BH)
    //bb_SAR
    console.log('starting bb_sar', new Date());
    const bb_sar_dataRange = {};
    const Accelerations = [0.005, 0.0025, 0.00125, 0.002];
    const bb_periods = [6,8,10,12,14,16,18,20,22,24,26,28,30];
    const num_stds = [0.5, 1.0, 1.5];
    const std_periods = [4,6,8,10,12];
    for (const accel of Accelerations) {
        for (const bbperiod of bb_periods) {
            for (const n_stds of num_stds) {
                for (const std_period of std_periods) {
                    trading.storageIni(storage);
                    for (let i = 50; i < ins.at.length-500; i++) { //50 to leave some buffer like 500 in CT
                        let high = ins.high.slice(i, i+500);
                        let low = ins.low.slice(i, i+500);
                        let close = ins.close.slice(i, i+500);
                        let std = await talib.std (close, 1, std_period);
                        let bbResults = await talib.bb(close, 1, bbperiod,  n_stds, n_stds, 0);
                        let sarResults = await talib.sar(high, low, 1, accel, accel*10);
                        let bbUpperBand = bbResults.outRealUpperBand;
                        let bbLowerBand = bbResults.outRealLowerBand;
                        trading.bb_sar(close.pop(), bbUpperBand.pop(), bbLowerBand.pop(), std.pop(), sarResults.pop(), storage, fee);
    //                    console.log('sar=', sarResults.pop())
                    }
                    bb_sar_params = bbperiod+'#'+n_stds+'#'+std_period+'#'+accel;
                    if ((storage.pl > 0) && (storage.sells > trades)) {
                        bb_sar_dataRange[bb_sar_params] = storage.pl;
//                        console.log(bb_sar_params, storage.pl, storage.sells);
                    }
                }//std_period
            }////nstd
        }//bbperiod
    }//for accel
    if (Object.keys(bb_sar_dataRange).length > 0) {
        let bb_sar_res = Object.keys(bb_sar_dataRange).reduce((a, b) => bb_sar_dataRange[a] > bb_sar_dataRange[b] ? a : b);
        console.log('Optimum for bb_sar:', bb_sar_res,  '#', bb_sar_dataRange[bb_sar_res]);
        dataRange['bb_sar'+' '+bb_sar_res] = bb_sar_dataRange[bb_sar_res]
        let affectedRows = await f.insertIntoDB(platform, instrument, interval,'bb_sar', bb_sar_dataRange[bb_sar_res]*multiplicator, bb_sar_res, BH).catch(e => {console.log(e);})
        console.log('affectedRows', affectedRows);
    }
    else {
        console.log('Less than 3 trades with current bb_sar_res range');    
    }
    let sqlResult1 = await f.unset_in_work(platform, instrument);
    if (sqlResult1) {console.log("in_work was unset");}    

    await f.sleep(5000);//to allow last promise to finish before exit
    console.log('Script ended: ', new Date());
    // see https://stackoverflow.com/questions/5266152/how-to-exit-in-node-js/37592669#37592669
    process.exit(0);
}//main
main()