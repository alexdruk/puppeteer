const _MFI_lower_treshold = 20;
const _MFI_upper_treshold = 80;
const _RSI_lower_treshold = 30;
const _RSI_upper_treshold = 70;
const _STOCHRSI_lower_treshold = 5;
const _STOCHRSI_upper_treshold = 95;

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
    mfi: function tradeMFI(close, mfi, storage) {
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
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy;
            storage.last_buy = 0;
        }

    },//trademfi

    bb: function tradeBB(close, bbUpperBand, bbLowerBand, std, storage) {
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
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy;
            storage.last_buy = 0;
        }

    },//tradebb
    bb_sar: function tradeBB_SAR(close, bbUpperBand, bbLowerBand, std, sar, storage) {
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
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy;
            storage.last_buy = 0;
        }

    },//tradebb

    bb_plus_mfi: function bb_plus_mfi(close, mfi, bbUpperBand, bbLowerBand, std,  storage) {
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
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy;
            storage.last_buy = 0;
        }

    },//bb_plus_mfi
    macd: function macd(close, macd,  storage) {
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
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy;
            storage.last_buy = 0;
        }

    },//macd
    rsi: function tradeRSI(close, rsi, delay, storage) {
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
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy;
            storage.last_buy = 0;
        }

    },//tradersi
    stoch_rsi: function tradeSTOCHRSI(close, stoch_rsi, storage) {
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
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy;
            storage.last_buy = 0;
        }

    },//stoch_rsi
    macd_rsi: function trade_macd_rsi(close, macd,  rsi, storage) {
        let price = close;
        let m = macd.outMACD.pop();
        let s = macd.outMACDSignal.pop();
        let MACDbuySig = false;
        let MACDsellSig = false;
/*        if ((s > m) && (rsi < _RSI_lower_treshold)){
            MACDbuySig = true;
        }
        if ((s < m) && (rsi > _RSI_upper_treshold)){
            MACDsellSig = true
        }
*/
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
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy;
            storage.last_buy = 0;
        }

    },//macd_rsi
    ema_sar: function tradeEMA_SAR(close, short, long, sar, storage) {
        let price = close;
        let s = short.pop();
        let l = long.pop()
        let prev_s = short[short.length-2];
        let prev_l = long[long.length-2];
        if ((storage.buys === 0) && (storage.sells === 0)) { // first buy
            storage.curr_avalable = 100000;
        }
        let do_trade = true
//        if (sar > price) {do_trade = false;}
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
            storage.pl += (price - storage.last_buy) *100 / storage.last_buy;
            storage.last_buy = 0;
        }

    },//tradebb
    
}