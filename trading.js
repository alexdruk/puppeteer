module.exports = {
    storageIni: function  storageIni(storage){
        storage.last_buy = 0;
        storage.curr_avalable = 0;
        storage.pl = 0;
        storage.last_sell = 0;
        storage.buys = 0;
        storage.sells = 0;
    }, 
/*
    function exercise  mfi trading strategy
    @params - instrument
    @return: none
*/
    mfi: function tradeMFI(close, mfi, storage) {
        const _MFI_lower_treshold = 20;
        const _MFI_upper_treshold = 80;
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

    }//trademfi
}