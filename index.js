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
const filename = '/home/ec2-user/puppeteer/data/' + instrument + '_' + TIME.today().replace(' 00:00','')+ '_' + interval + '.json';
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
//local


 

//main
async function main() {
    console.log('Script started: ', new Date())
    let sqlResult = await f.set_in_work(platform, instrument).catch(e => {console.log(e);});
    if (sqlResult) {console.log('in_work was updated');}
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
    if (interval == '2h'){sliceAt = -600;multiplicator = 0.5}
    else if (interval == '1h'){sliceAt = -1200;multiplicator = 1}
    else if (interval == '30m'){sliceAt = -2000;multiplicator = 1.2}
    else if (interval == '15m'){sliceAt = -2000;multiplicator = 2.4}
    else if (interval == '5m'){sliceAt = -2000;multiplicator = 7.2}
    else {sliceAt = -2000;multiplicator = 36};
    
    if ((interval == '2h')||(interval == '1h')){trades = 3}
    ins.close = ins.close.slice(sliceAt);
    ins.high = ins.high.slice(sliceAt);
    ins.low = ins.low.slice(sliceAt);
    ins.open = ins.open.slice(sliceAt);
    ins.volume = ins.volume.slice(sliceAt);
    ins.at = ins.at.slice(sliceAt); 
  

//MFI
    console.log('starting mfi');
    let MFIrange = {};
    const MFIperiods = [6,8,10,12,14,16,18,20];
    for (const period of MFIperiods) {
        trading.storageIni(storage);
        for (let i = 50; i < ins.at.length; i++) { //50 to leave some buffer like 500 in CT
            let high = ins.high.slice(0, i);
            let low = ins.low.slice(0, i);
            let close = ins.close.slice(0, i);
            let vol = ins.volume.slice(0, i);
            let mfiResults = await talib.mfi(high, low, close, vol, 1, period);
            trading.mfi(close.pop(), mfiResults.pop(), storage, fee);
        }
        if ((storage.pl > 0) && (storage.sells > trades)) {
            MFIrange[period] = storage.pl;
//            console.log(period, storage.pl);
        }
    }
    if (Object.keys(MFIrange).length > 0) {
        let MFIres = Object.keys(MFIrange).reduce((a, b) => MFIrange[a] > MFIrange[b] ? a : b);
        console.log('Optimum for mfi:', MFIres,  '#', MFIrange[MFIres]);    
        dataRange['mfi'+' '+MFIres] = MFIrange[MFIres];
        let affectedRows = await f.insertIntoDB(platform, instrument, interval, 'mfi', MFIrange[MFIres]*multiplicator, MFIres).catch(e => {console.log(e);})
        console.log('affectedRows', affectedRows);
    }
    else {
            console.log('Less than 3 trades with current MFI range');    
    }

//BB
    console.log('starting bb', new Date());
    const bb_dataRange = {};
    const BBperiods = [8,10,12,14,16,18,20,22,24,26,28];
    const stds = [0.5, 1.0, 1.5];
    const STDperiods = [4,6,8,10,12];
    for (const period of BBperiods) {
        for (const n_stds of stds) {
            for (const std_period of STDperiods) {
                trading.storageIni(storage);
                for (let i = 50; i < ins.at.length; i++) { //50 to leave some buffer like 500 in CT
                    let close = ins.close.slice(0, i);
                    let std = await talib.std (close, 1, std_period);
                    let bbResults = await talib.bb(close, 1, period,  n_stds, n_stds, 0);
                    let bbUpperBand = bbResults.outRealUpperBand;
                    let bbLowerBand = bbResults.outRealLowerBand;
                    trading.bb(close.pop(), bbUpperBand.pop(), bbLowerBand.pop(), std.pop(), storage, fee);
    //                console.log('std=', std.pop(), 'std_period', std_period)
                }
                bb_params = period+'#'+n_stds+'#'+std_period;
                if ((storage.pl > 0) && (storage.sells > trades)) {
                    bb_dataRange[bb_params] = storage.pl;
//                    console.log(bb_params, storage.pl);
                }
            }//for
        }//for
    }//for
    let [optBBperiod, optstds, optSTDperiod] = [0,0,0];
    if (Object.keys(bb_dataRange).length > 0) {
        let bb_res = Object.keys(bb_dataRange).reduce((a, b) => bb_dataRange[a] > bb_dataRange[b] ? a : b);
        console.log('Optimum for bb:', bb_res,  '#', bb_dataRange[bb_res]);
        [optBBperiod, optstds, optSTDperiod] = bb_res.split('#');
        console.log ('optBBperiod', optBBperiod, 'optstds', optstds, 'optSTDperiod', optSTDperiod);
        dataRange['bb'+' '+bb_res] = bb_dataRange[bb_res]
        let affectedRows = await f.insertIntoDB(platform, instrument, interval,'bb', bb_dataRange[bb_res]*multiplicator, bb_res).catch(e => {console.log(e);})
        console.log('affectedRows', affectedRows);
    }
    else {
        console.log('Less than 3 trades with current bb_dataRange range');    
    }

    //bb_SAR
    console.log('starting bb_sar', new Date());
    const bb_sar_dataRange = {};
    const Accelerations = [0.005, 0.0025, 0.00125];
    const bb_periods = [8,10,12,14,16,18,20];
    const num_stds = [0.5, 1.0, 1.5, 2.0];
    const std_periods = [5,6,7,8];
    for (const accel of Accelerations) {
        for (const bbperiod of bb_periods) {
            for (const n_stds of num_stds) {
                for (const std_period of std_periods) {
                    trading.storageIni(storage);
                    for (let i = 50; i < ins.at.length; i++) { //50 to leave some buffer like 500 in CT
                        let high = ins.high.slice(0, i);
                        let low = ins.low.slice(0, i);
                        let close = ins.close.slice(0, i);
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
//                        console.log(bb_sar_params, storage.pl);
                    }
                }//std_period
            }////nstd
        }//bbperiod
    }//for accel
    if (Object.keys(bb_sar_dataRange).length > 0) {
        let bb_sar_res = Object.keys(bb_sar_dataRange).reduce((a, b) => bb_sar_dataRange[a] > bb_sar_dataRange[b] ? a : b);
        console.log('Optimum for bb_sar:', bb_sar_res,  '#', bb_sar_dataRange[bb_sar_res]);
        dataRange['bb_sar'+' '+bb_sar_res] = bb_sar_dataRange[bb_sar_res]
        let affectedRows = await f.insertIntoDB(platform, instrument, interval,'bb_sar', bb_sar_dataRange[bb_sar_res]*multiplicator, bb_sar_res).catch(e => {console.log(e);})
        console.log('affectedRows', affectedRows);
    }
    else {
        console.log('Less than 3 trades with current bb_sar_res range');    
    }
//macd

    console.log('starting macd', new Date());
    const macd_dataRange = {};
    const Fast_periods = [4,6,8,10,12,14,16,18];
    const Slow_periods = [12,14,16,18,20,22,24,26,28,30];
    const Signal_periods = [2,3,4,5,6];
    for (const fast of Fast_periods) {
        for (const slow of Slow_periods) {
            if (slow/fast < 2) {continue;}
            for (const signal of Signal_periods) {
                trading.storageIni(storage);
                for (let i = 50; i < ins.at.length; i++) { //50 to leave some buffer like 500 in CT
                    let close = ins.close.slice(0, i);
                    let macd = await talib.macd (close, 1, fast, slow, signal);
                    trading.macd(close.pop(), macd, storage, fee);
                }
                macd_params = fast+'#'+slow+'#'+signal;
                if ((storage.pl > 0) && (storage.sells > trades)) {
                    macd_dataRange[macd_params] = storage.pl;
//                    console.log(macd_params, storage.pl);    
                }
            }//for
        }//for
    }//for
    let [optFastPeriod, optSlowPeriod, optSignal] = [0,0,0];
    if (Object.keys(macd_dataRange).length > 0) {
        let macd_res = Object.keys(macd_dataRange).reduce((a, b) => macd_dataRange[a] > macd_dataRange[b] ? a : b);
        console.log('Optimum for macd:', macd_res, '#', macd_dataRange[macd_res]);
        [optFastPeriod, optSlowPeriod, optSignal] = macd_res.split('#');
        console.log ('optFastPeriod', optFastPeriod, 'optSlowPeriod', optSlowPeriod, 'optSignal', optSignal);
        dataRange['macd'+' '+macd_res] = macd_dataRange[macd_res]
        let affectedRows = await f.insertIntoDB(platform, instrument, interval,'macd', macd_dataRange[macd_res]*multiplicator, macd_res).catch(e => {console.log(e);})
        console.log('affectedRows', affectedRows);
    }
    else {
        console.log('Less than 3 trades with current macd_dataRange range');    
    }

//RSI
    console.log('starting rsi', new Date());
    const rsi_dataRange = {};
    const RSIperiods = [6,7,8,9,10,12,14];
    const RSIdelays = [1,2,3] //1 is the same as 0
    for (const rsi_period of RSIperiods) {
        for (const delay of RSIdelays) {
            trading.storageIni(storage);
            for (let i = 50; i < ins.at.length; i++) { //50 to leave some buffer like 500 in CT
                let close = ins.close.slice(0, i);
                let RSIResults = await talib.rsi (close, 1, rsi_period);
                trading.rsi(close.pop(), RSIResults.pop(), delay, storage, fee);
            }
            rsi_params = rsi_period+'#'+delay;
            if ((storage.pl > 0) && (storage.sells > trades)) {
                rsi_dataRange[rsi_params] = storage.pl;
//                console.log(rsi_params, storage.pl);    
            }
        }//for
    }//for
    if (Object.keys(rsi_dataRange).length > 0) {
        let rsi_res = Object.keys(rsi_dataRange).reduce((a, b) => rsi_dataRange[a] > rsi_dataRange[b] ? a : b);
        console.log('Optimum for rsi:', rsi_res, '#', rsi_dataRange[rsi_res]);
        dataRange['rsi'+' '+rsi_res] = rsi_dataRange[rsi_res]
        let affectedRows = await f.insertIntoDB(platform, instrument, interval,'rsi', rsi_dataRange[rsi_res]*multiplicator, rsi_res).catch(e => {console.log(e);})
        console.log('affectedRows', affectedRows);
    }
    else {
        console.log('Less than 3 trades with current rsi_dataRange range');    
    }

//simple_macd 
    console.log('starting simple_macd', new Date());
    const simple_macd_dataRange = {};
    const fastperiods = [5,6,7,8,10,12,14];
    const slowperiods = [12,14,16,18,20,22,24,26,28,30];
    const signalperiods = [2,3,4,6];
    for (const signal of signalperiods) {
        for (const fast of fastperiods) {
            for (const slow of slowperiods) {
                if (slow/fast < 2) {continue;}
                    trading.storageIni(storage, fee);
                    for (let i = 50; i < ins.at.length; i++) { //50 to leave some buffer like 500 in CT
                        let close = ins.close.slice(0, i);
                        let macd = await talib.macd (close, 1, fast, slow, signal);
                        trading.simple_macd(close.pop(), macd, storage, fee);
                    }
                    simple_macd_params = fast+'#'+slow+'#'+signal;
                    if ((storage.pl > 0) && (storage.sells > trades)) {
//                        console.log(simple_macd_params, storage.pl);    
                        simple_macd_dataRange[simple_macd_params] = storage.pl
                    }
                }//for signal
            }//for slow
        }//for fast
    if (Object.keys(simple_macd_dataRange).length > 0) {
        let simple_macd_res = Object.keys(simple_macd_dataRange).reduce((a, b) => simple_macd_dataRange[a] > simple_macd_dataRange[b] ? a : b);
        console.log('Optimum for simple_macd:', simple_macd_res, '#', simple_macd_dataRange[simple_macd_res]);
        dataRange['simple_macd'+' '+simple_macd_res] = simple_macd_dataRange[simple_macd_res]
        let affectedRows = await f.insertIntoDB(platform, instrument, interval,'simple_macd', simple_macd_dataRange[simple_macd_res]*multiplicator, simple_macd_res).catch(e => {console.log(e);})
        console.log('affectedRows', affectedRows);
    }
    else {
        console.log('Less than 3 trades with current simple_macd_dataRange range');    
    }

//MACD+RSI 
    console.log('starting macd_rsi', new Date());
    const macd_rsi_dataRange = {};
    const RSI_periods = [8,10,12,14,16,20,24];
    const fast_periods = [3,4,5,6,7];
    const slow_periods = [10,12,16,20,24,28];
    const signal_periods = [2,3,4];
    for (const signal of signal_periods) {
        for (const fast of fast_periods) {
            for (const slow of slow_periods) {
                if (slow/fast < 2) {continue;}
                for (const rsi_period of RSI_periods) {
                    trading.storageIni(storage, fee);
                    for (let i = 50; i < ins.at.length; i++) { //50 to leave some buffer like 500 in CT
                        let close = ins.close.slice(0, i);
                        let macd = await talib.macd (close, 1, fast, slow, signal);
                        let RSIResults = await talib.rsi (close, 1, rsi_period);
                        trading.macd_rsi(close.pop(), macd, RSIResults.pop(), storage, fee);
                    }
                    macd_rsi_params = fast+'#'+slow+'#'+signal+'#'+rsi_period;
                    if ((storage.pl > 0) && (storage.sells > trades)) {
//                        console.log(macd_rsi_params, storage.pl);    
                        macd_rsi_dataRange[macd_rsi_params] = storage.pl
                    }
                }//for rsiperiods
            }//for slow
        }//for fast
    }//for 
    if (Object.keys(macd_rsi_dataRange).length > 0) {
        let macd_rsi_res = Object.keys(macd_rsi_dataRange).reduce((a, b) => macd_rsi_dataRange[a] > macd_rsi_dataRange[b] ? a : b);
        console.log('Optimum for macd_rsi:', macd_rsi_res, '#', macd_rsi_dataRange[macd_rsi_res]);
        dataRange['macd_rsi'+' '+macd_rsi_res] = macd_rsi_dataRange[macd_rsi_res]
        let affectedRows = await f.insertIntoDB(platform, instrument, interval,'macd_rsi', macd_rsi_dataRange[macd_rsi_res]*multiplicator, macd_rsi_res).catch(e => {console.log(e);})
        console.log('affectedRows', affectedRows);
    }
    else {
        console.log('Less than 3 trades with current macd_rsi_dataRange range');    
    }
 
    //EMA_SAR
    console.log('starting ema_sar', new Date());
    const ema_sar_dataRange = {};
    const Ema_short_periods = [4,6,8,10,12,14,16,18,20];
    const Ema_long_periods = [12,14,16,18,20,22,24,26,28,30,32,34,36];
    const optInAccelerations = 0.0025;
    for (const ema_short of Ema_short_periods) {
        for (const ema_long of Ema_long_periods) {
            if (ema_short >= ema_long) {continue;}
                trading.storageIni(storage);
                for (let i = 50; i < ins.at.length; i++) { //50 to leave some buffer like 500 in CT
                    let close = ins.close.slice(0, i);
                    let high = ins.high.slice(0, i);
                    let low = ins.low.slice(0, i);
                    let short = await talib.ema (close, 1, ema_short);
                    let long = await talib.ema (close, 1, ema_long);
                    let sarResults = await talib.sar(high, low, 1, optInAccelerations, optInAccelerations*10);
                    trading.ema_sar(close.pop(), short, long, sarResults.pop(), 1, storage, fee);
                }
                ema_params = ema_short+'#'+ema_long;
                if ((storage.pl > 0) && (storage.sells > trades)) {
                    ema_sar_dataRange[ema_params] = storage.pl;
                }
        }//for
    }//for
    if (Object.keys(ema_sar_dataRange).length > 0) {
        let ema_res = Object.keys(ema_sar_dataRange).reduce((a, b) => ema_sar_dataRange[a] > ema_sar_dataRange[b] ? a : b);
        console.log('Optimum for ema_sar:', ema_res, '#', ema_sar_dataRange[ema_res]);
        dataRange['ema_sar'+' '+ema_res] = ema_sar_dataRange[ema_res]
        let affectedRows = await f.insertIntoDB(platform, instrument, interval,'ema_sar', ema_sar_dataRange[ema_res]*multiplicator, ema_res).catch(e => {console.log(e);})
        console.log('affectedRows', affectedRows);
    }
    else {
        console.log('Less than 3 trades with current ema_sar_dataRange range');    
    }


//Stoch RSI
    console.log('starting stoch_rsi', new Date());
    const stoch_rsi_dataRange = {};
    const _RSIperiods = [8,10,12,14,16,18,20,22,24];
    const _Stochperiods = [8,10,12,14,16,18,20,22,24,26,28];
    for (const rsi_period of _RSIperiods) {
        for (const stoch_period of _Stochperiods) {
            if (stoch_period < rsi_period) {continue;}
            trading.storageIni(storage);
            for (let i = 50; i < ins.at.length; i++) { //50 to leave some buffer like 500 in CT
                let close = ins.close.slice(0, i);
                let STOCHRSIResults = await talib.stoch_rsi (close, 1, rsi_period, stoch_period);
                trading.stoch_rsi(close.pop(), STOCHRSIResults, storage, fee);
            }
            stoch_rsi_params = rsi_period+'#'+stoch_period;
            if ((storage.pl > 0) && (storage.sells > trades)) {
                stoch_rsi_dataRange[stoch_rsi_params] = storage.pl;
//                console.log(stoch_rsi_params, storage.pl);    
            }
        }//for
    }//for
    let [optimumRSIPeriod, optSTOCHperiod] = [0,0];
    if (Object.keys(stoch_rsi_dataRange).length > 0) {
        let stoch_rsi_res = Object.keys(stoch_rsi_dataRange).reduce((a, b) => stoch_rsi_dataRange[a] > stoch_rsi_dataRange[b] ? a : b);
        console.log('Optimum for stoch_rsi:', stoch_rsi_res, '#', stoch_rsi_dataRange[stoch_rsi_res]);
        [optimumRSIPeriod, optSTOCHperiod] = stoch_rsi_res.split(' ');
        dataRange['stoch_rsi'+' '+stoch_rsi_res] = stoch_rsi_dataRange[stoch_rsi_res]
        let affectedRows = await f.insertIntoDB(platform, instrument, interval,'stoch_rsi', stoch_rsi_dataRange[stoch_rsi_res]*multiplicator, stoch_rsi_res).catch(e => {console.log(e);})
        console.log('affectedRows', affectedRows);
    }
    else {
        console.log('Less than 3 trades with current stoch_rsi_dataRange range');    
    }

//Stoch
    console.log('starting stoch', new Date());
    const stoch_dataRange = {};
    const fastK_periods = [4,6,8,10,12,14,16,18,20];
    const slowK_periods = [2,3,4,5];
    for (const fastK of fastK_periods) {
        for (const slowK of slowK_periods) {
            if (slowK >= fastK) {continue;}
            trading.storageIni(storage);
            for (let i = 50; i < ins.at.length; i++) { //50 to leave some buffer like 500 in CT
                let high = ins.high.slice(0, i);
                let low = ins.low.slice(0, i);
                let close = ins.close.slice(0, i);
                let STOCHResults = await talib.stoch(high,low,close,1,fastK,slowK);
                trading.stoch(close.pop(), STOCHResults.pop(), storage, fee);
            }
            stoch_params = fastK+'#'+slowK;
            if ((storage.pl > 0) && (storage.sells > trades)) {
                stoch_dataRange[stoch_params] = storage.pl;
    //            console.log(stoch_params, storage.pl);    
            }
        }//for
    }//for
    if (Object.keys(stoch_dataRange).length > 0) {
        let stoch_res = Object.keys(stoch_dataRange).reduce((a, b) => stoch_dataRange[a] > stoch_dataRange[b] ? a : b);
        console.log('Optimum for stoch:', stoch_res, '#', stoch_dataRange[stoch_res]);
        dataRange['stoch'+' '+stoch_res] = stoch_dataRange[stoch_res]
        let affectedRows = await f.insertIntoDB(platform, instrument, interval, 'stoch', stoch_dataRange[stoch_res]*multiplicator, stoch_res).catch(e => {console.log(e);})
        console.log('affectedRows', affectedRows);
    }
    else {
        console.log('Less than 3 trades with current stoch_dataRange range');    
    }

//FAST Stoch
    console.log('starting fast stoch', new Date());
    const fstoch_dataRange = {};
    const f_fastK_periods = [4,5,6,8,10,12,14];
    const fastD_periods = [2,3,4,5,6];
    for (const fastK of f_fastK_periods) {
        for (const fastD of fastD_periods) { 
            if (fastD >= fastK) {continue;}
            trading.storageIni(storage);
            for (let i = 50; i < ins.at.length; i++) { //50 to leave some buffer like 500 in CT
                let high = ins.high.slice(0, i);
                let low = ins.low.slice(0, i);
                let close = ins.close.slice(0, i);
                let fSTOCHResults = await talib.fstoch(high,low,close,1,fastK,fastD);
                trading.fstoch(close.pop(), fSTOCHResults.pop(), storage, fee);
            }
            fstoch_params = fastK+'#'+fastD;
            if ((storage.pl > 0) && (storage.sells > trades)) {
                fstoch_dataRange[fstoch_params] = storage.pl;
            }
        }//for
    }//for
    if (Object.keys(fstoch_dataRange).length > 0) {
        let fstoch_res = Object.keys(fstoch_dataRange).reduce((a, b) => fstoch_dataRange[a] > fstoch_dataRange[b] ? a : b);
        console.log('Optimum for fast_stoch:', fstoch_res, '#', fstoch_dataRange[fstoch_res]);
        dataRange['fast_stoch'+' '+fstoch_res] = fstoch_dataRange[fstoch_res]
        let affectedRows = await f.insertIntoDB(platform, instrument, interval, 'fast_stoch', fstoch_dataRange[fstoch_res]*multiplicator, fstoch_res).catch(e => {console.log(e);})
        console.log('affectedRows', affectedRows);
    }
    else {
        console.log('Less than 3 trades with current fstoch_dataRange range');    
    }

//finalize 
    if (Object.keys(dataRange).length > 0) {
        let final = Object.keys(dataRange).reduce((a, b) => dataRange[a] > dataRange[b] ? a : b);
        console.log('Optimum final:', final, '#', dataRange[final]);
        let [strategy, str_op] = final.split(' ');
        let str_result = dataRange[final]*multiplicator;
        let decoded = instrument+' '+platform+' '+interval+' '+strategy+' '+str_op+'Z'+str_result;
        let encoded = f.encode(decoded);
        await f.updatePairs(platform, instrument, interval, strategy, str_result, str_op, decoded, encoded);
        let tm = interval.match(/(\d{1,2})([minhd])/);
        let timeint = tm[1];
        let timeval = tm[2];
        let interval_num = 0;
        if (timeval == 'd'){
            interval_num = timeint * 1400;
        }
        else if (timeval == 'h'){
            interval_num = timeint * 60;
        }
        else {
            interval_num = timeint;
        } 
        console.log(platform, instrument, interval_num, final, dataRange[final]);
    }
    else {
        console.log("No optimal params for this interval");
    }
 // update in_work after last job
    let sqlResult1 = await f.unset_in_work(platform, instrument);
    if (sqlResult1) {console.log("in_work was updated");}    

    await f.sleep(5000);//to allow last promise to finish before exit
    console.log('Script ended: ', new Date());
    // see https://stackoverflow.com/questions/5266152/how-to-exit-in-node-js/37592669#37592669
    process.exit(0);
}//main
  
main()

