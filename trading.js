const _MFI_lower_treshold = 20;
const _MFI_upper_treshold = 80;
const _RSI_lower_treshold = 30;
const _RSI_upper_treshold = 70;

module.exports = {
    storageIni: function  storageIni(storage){
        storage.last_buy = 0;
        storage.curr_avalable = 0;
        storage.pl = 0;
        storage.last_sell = 0;
        storage.buys = 0;
        storage.sells = 0;
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
    bb: function tradeBB(close, mfi, bbUpperBand, bbLowerBand, std,  storage) {
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
        let m = macd.outMACD.pop(0);
        let s = macd.outMACDSignal.pop(0);
        let h = macd.outMACDHist.pop(0);
        let prev_s = macd.outMACDSignal[macd.outMACDSignal.length-2];
        let prev_m = macd.outMACD[macd.outMACD.length-2];
        let MACDbuySig = false;
        let MACDsellSig = false;
        if ((h > 0) &&  (s <= m) && (prev_s > prev_m)){
            MACDbuySig = true;
        }
        if ((h < 0) && (s >= m) && (prev_s < prev_m)){
            MACDsellSig = true
        }
 
        if ((storage.buys === 0) && (storage.sells === 0)) { // first buy
            storage.curr_avalable = 100000;
            storage.last_sell = 1;
        }
//buy
        if (MACDbuySig && storage.last_sell)  {
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
    
}