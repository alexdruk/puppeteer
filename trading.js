const _MFI_lower_treshold = 20;
const _MFI_upper_treshold = 80;
const _RSI_lower_treshold = 30;
const _RSI_upper_treshold = 70;
const _STOCHRSI_lower_treshold = 5;
const _STOCHRSI_upper_treshold = 95;
const _STOCH_lower_treshold = 20;
const _STOCH_upper_treshold = 85;
const _fSTOCH_lower_treshold = 1;
const _fSTOCH_upper_treshold = 99;
const _s_macd_lower_treshold = -50;
const _s_macd_upper_treshold = 80;

module.exports = {
    storageIni: function  storageIni(storage){
        storage.last_buy = 0;
        storage.curr_avalable = 0;
        storage.pl = 0;
        storage.last_sell = 0;
        storage.buys = 0;
        storage.sells = 0;
        storage.up = 0; // for consequent indicarors, like RSI
        storage.down = 0;
    }, 
    mfi: function (close, mfi, storage, fee) {
        let price = close;
        if ((storage.buys === 0) && (storage.sells === 0)) { // first buy
            storage.curr_avalable = 100000;
        }
//buy
        if ((mfi < _MFI_lower_treshold) && (storage.curr_avalable)) {
            storage.last_buy = price;
            storage.curr_avalable = 0;
            storage.last_sell = 0;
            storage.buys++;
        }
//sell
        if ((mfi > _MFI_upper_treshold) && (storage.last_buy)){
            storage.last_sell = price;
            storage.curr_avalable = storage.last_buy;
            storage.sells++;
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy - fee;
            storage.last_buy = 0;
        }

    },//trademfi

    bb: function (close, bbUpperBand, bbLowerBand, std, storage, fee) {
        let price = close;
        if ((storage.buys === 0) && (storage.sells === 0)) { // first buy
            storage.curr_avalable = 100000;
        }
//buy
        if ((price < (bbLowerBand - std)) && (storage.curr_avalable)) {
            storage.last_buy = price;
            storage.curr_avalable = 0;
            storage.last_sell = 0;
            storage.buys++;
        }
//sell
        if ((price > (bbUpperBand + std)) && (storage.last_buy)){
            storage.last_sell = price;
            storage.curr_avalable = storage.last_buy;
            storage.sells++;
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy - fee;
            storage.last_buy = 0;
        }

    },//tradebb
/*
    bb_sar: function (close, bbUpperBand, bbLowerBand, std, sar, storage, fee) {
        let price = close;
        if ((storage.buys === 0) && (storage.sells === 0)) { // first buy
            storage.curr_avalable = 100000;
        }
        let do_trade = true
        if (sar > price) {do_trade = false;}
//buy
        if ((price < (bbLowerBand - std)) && (storage.curr_avalable) && do_trade) {
            storage.last_buy = price;
            storage.curr_avalable = 0;
            storage.last_sell = 0;
            storage.buys++;
        }
//sell
        if ((price > (bbUpperBand + std)) && (storage.last_buy) && do_trade){
            storage.last_sell = price;
            storage.curr_avalable = storage.last_buy;
            storage.sells++;
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy - fee;
            storage.last_buy = 0;
        }

    },//tradebbsar
*/
    bb_plus_mfi: function (close, mfi, bbUpperBand, bbLowerBand, std,  storage, fee) {
        let price = close;
        if ((storage.buys === 0) && (storage.sells === 0)) { // first buy
            storage.curr_avalable = 100000;
        }
//buy
        if ((price < (bbLowerBand - std)) && (storage.curr_avalable) && (mfi < _MFI_lower_treshold)) {
            storage.last_buy = price;
            storage.curr_avalable = 0;
            storage.last_sell = 0;
            storage.buys++;
        }
//sell
        if ((price > (bbUpperBand + std)) && (storage.last_buy) && (mfi > _MFI_upper_treshold)){
            storage.last_sell = price;
            storage.curr_avalable = storage.last_buy;
            storage.sells++;
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy - fee;
            storage.last_buy = 0;
        }

    },//bb_plus_mfi
    macd: function (close, macd,  storage, fee) {
        let price = close;
        let m = macd.outMACD.pop();
        let s = macd.outMACDSignal.pop();
        let prev_s = macd.outMACDSignal[macd.outMACDSignal.length-2];
        let prev_m = macd.outMACD[macd.outMACD.length-2];
        let MACDbuySig = false;
        let MACDsellSig = false;
        if ((s <= m) && (prev_s > prev_m)){
            MACDsellSig = true
        }
        if ((s >= m) && (prev_s < prev_m)){
            MACDbuySig = true;
        }
 
        if ((storage.buys === 0) && (storage.sells === 0)) { // first buy
            storage.curr_avalable = 100000;
            storage.last_sell = 1;
        }
//buy
        if (MACDbuySig && storage.curr_avalable)  {
            storage.last_buy = price;
            storage.curr_avalable = 0;
            storage.last_sell = 0;
            storage.buys++;
        }
//sell
        if (MACDsellSig && storage.last_buy){
            storage.last_sell = price;
            storage.curr_avalable = storage.last_buy;
            storage.sells++;
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy - fee;
            storage.last_buy = 0;
        }

    },//macd
    simple_macd: function (close, macd,  storage, fee) {
        let price = close;
        let m = macd.outMACD.pop();
 
        if ((storage.buys === 0) && (storage.sells === 0)) { // first buy
            storage.curr_avalable = 100000;
            storage.last_sell = 1;
        }
//buy
        if ((m < _s_macd_lower_treshold) && storage.curr_avalable)  {
            storage.last_buy = price;
            storage.curr_avalable = 0;
            storage.last_sell = 0;
            storage.buys++;
        }
//sell
        if ((m > _s_macd_upper_treshold) && storage.last_buy){
            storage.last_sell = price;
            storage.curr_avalable = storage.last_buy;
            storage.sells++;
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy - fee;
            storage.last_buy = 0;
        }

    },//macd    rsi: function tradeRSI(close, rsi, delay, storage, fee) {
    rsi: function (close, rsi, delay, storage, fee) {
        let price = close;
        if (rsi > _RSI_upper_treshold) {
            storage.up++
            storage.down = 0
        }
        else if (rsi < _RSI_lower_treshold) {
            storage.down++
            storage.up = 0
        }
        else {
            storage.down = 0
            storage.up = 0
        }

        if ((storage.buys === 0) && (storage.sells === 0)) { // first buy
            storage.curr_avalable = 100000;
        }
//buy
        if ((rsi < _RSI_lower_treshold) && (storage.curr_avalable) && (storage.down >= delay)) {
            storage.last_buy = price;
            storage.curr_avalable = 0;
            storage.last_sell = 0;
            storage.buys++;
        }
//sell
        if ((rsi > _RSI_upper_treshold) && (storage.last_buy) && (storage.up >= delay)){
            storage.last_sell = price;
            storage.curr_avalable = storage.last_buy;
            storage.sells++;
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy - fee;
            storage.last_buy = 0;
        }

    },//tradersi
    stoch_rsi: function (close, stoch_rsi, storage, fee) {
        let price = close;

        if ((storage.buys === 0) && (storage.sells === 0)) { // first buy
            storage.curr_avalable = 100000;
        }
//buy
        if ((stoch_rsi < _STOCHRSI_lower_treshold) && (storage.curr_avalable)) {
            storage.last_buy = price;
            storage.curr_avalable = 0;
            storage.last_sell = 0;
            storage.buys++;
        }
//sell
        if ((stoch_rsi > _STOCHRSI_upper_treshold) && (storage.last_buy)){
            storage.last_sell = price;
            storage.curr_avalable = storage.last_buy;
            storage.sells++;
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy - fee;
            storage.last_buy = 0;
        }

    },//stoch_rsi
    macd_rsi: function (close, macd,  rsi, storage, fee) {
        let price = close;
        let m = macd.outMACD.pop();
        let s = macd.outMACDSignal.pop();
        let MACDbuySig = false;
        let MACDsellSig = false;
        if ((s < m) && (rsi < _RSI_lower_treshold)){
            MACDbuySig = true;
        }
        if ((s > m) && (rsi > _RSI_upper_treshold)){
            MACDsellSig = true
        }
 
        if ((storage.buys === 0) && (storage.sells === 0)) { // first buy
            storage.curr_avalable = 100000;
            storage.last_sell = 1;
        }
//buy
        if (MACDbuySig && storage.curr_avalable)  {
            storage.last_buy = price;
            storage.curr_avalable = 0;
            storage.last_sell = 0;
            storage.buys++;
        }
//sell
        if (MACDsellSig && storage.last_buy){
            storage.last_sell = price;
            storage.curr_avalable = storage.last_buy;
            storage.sells++;
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy - fee;
            storage.last_buy = 0;
        }

    },//macd_rsi
 
    ema_sar: function (close, short, long, sar, storage, fee) {
        let price = close;
        let s = short.pop();
        let l = long.pop()
        let prev_s = short[short.length-2];
        let prev_l = long[long.length-2];
        if ((storage.buys === 0) && (storage.sells === 0)) { // first buy
            storage.curr_avalable = 100000;
        }
        let do_trade = true
        if (sar > price) {do_trade = false;}
//buy
        if ((s >= l) && (prev_s < prev_l) && (storage.curr_avalable) && do_trade) {
            storage.last_buy = price;
            storage.curr_avalable = 0;
            storage.last_sell = 0;
            storage.buys++;
        }
//sell
        if ((s <= l) && (prev_s > prev_l) && storage.last_buy && do_trade) {
            storage.last_sell = price;
            storage.curr_avalable = storage.last_buy;
            storage.sells++;
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy - fee;
            storage.last_buy = 0;
        }

    },//ema_sar
    stoch: function (close, stoch, storage, fee) {
        let price = close;
        if ((storage.buys === 0) && (storage.sells === 0)) { // first buy
            storage.curr_avalable = 100000;
        }
//buy
        if ((stoch < _STOCH_lower_treshold) && (storage.curr_avalable)) {
            storage.last_buy = price;
            storage.curr_avalable = 0;
            storage.last_sell = 0;
            storage.buys++;
        }
//sell
        if ((stoch > _STOCH_upper_treshold) && (storage.last_buy)){
            storage.last_sell = price;
            storage.curr_avalable = storage.last_buy;
            storage.sells++;
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy - fee;
            storage.last_buy = 0;
        }

    },//trade_stoch   
    fstoch: function (close, fstoch, storage, fee) {
        let price = close;
        if ((storage.buys === 0) && (storage.sells === 0)) { // first buy
            storage.curr_avalable = 100000;
        }
//buy
        if ((fstoch < _fSTOCH_lower_treshold) && (storage.curr_avalable)) {
            storage.last_buy = price;
            storage.curr_avalable = 0;
            storage.last_sell = 0;
            storage.buys++;
        }
//sell
        if ((fstoch > _fSTOCH_upper_treshold) && (storage.last_buy)){
            storage.last_sell = price;
            storage.curr_avalable = storage.last_buy;
            storage.sells++;
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy - fee;
            storage.last_buy = 0;
        }

    },//trade_stoch   
    bb_sar_new: function (close, bbUpperBand, bbLowerBand, std, sar, storage, fee) {
        let price = close;
        if ((storage.buys === 0) && (storage.sells === 0)) { // first buy
            storage.curr_avalable = 100000;
        }
        let do_trade = true
        let stoploss = false
//        let delta = 100*Math.abs(sar - price)/price
        if (sar > price) {do_trade = false;}
//        if ((delta < stoploss_treshold) &&  storage.last_buy) {stoploss = true;}
        if (storage.last_buy && (sar <= price)) {stoploss = true;}
//buy
        if ((price < (bbLowerBand - std)) && (storage.curr_avalable)  && do_trade) {
            storage.last_buy = price;
            storage.curr_avalable = 0;
            storage.last_sell = 0;
            storage.buys++;
        }
//sell
        if (((price > (bbUpperBand + std)) && (storage.last_buy) && (price > storage.last_buy) && do_trade) || stoploss) {
            storage.last_sell = price;
            storage.curr_avalable = storage.last_buy;
            storage.sells++;
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy - fee;
            storage.last_buy = 0;
        }

    },//tradebbsarnew
    mfi_sar: function (close, mfi, sar,  storage, fee) {
        let price = close;
        if ((storage.buys === 0) && (storage.sells === 0)) { // first buy
            storage.curr_avalable = 100000;
        }
        let do_trade = true
        let stoploss = false
        if (sar > price) {do_trade = false;}
//        if ((delta < stoploss_treshold) &&  storage.last_buy) {stoploss = true;}
        if (storage.last_buy && (sar <= price)) {stoploss = true;}

        //buy
        if (do_trade && storage.curr_avalable && (mfi < _MFI_lower_treshold)) {
            storage.last_buy = price;
            storage.curr_avalable = 0;
            storage.last_sell = 0;
            storage.buys++;
        }
//sell
        if ((do_trade && storage.last_buy && (mfi > _MFI_upper_treshold) && (price > storage.last_buy)) || stoploss){
            storage.last_sell = price;
            storage.curr_avalable = storage.last_buy;
            storage.sells++;
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy - fee;
            storage.last_buy = 0;
        }

    },//mfi_sar
 
}//module