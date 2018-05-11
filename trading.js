module.exports = {    
/*
    function exercise  mfi trading strategy
    @params - instrument
    @return: none
*/
    mfi: function tradeMFI(close, storage) {
        const _MFI_lower_treshold = 20;
        const _MFI_upper_treshold = 80;
        let price = close;
 //       console.log(price)
/*
        if storage.indObjS[1].last_buy == 0 and storage.indObjS[1].last_sell == 0 #for first iteration
            maxBAmount = currency / price
            maxSAmount = assets
#            debug " price:#{price} mfi:#{storage.indObjS[1].val} maxBAmount:#{maxBAmount} maxSAmount:#{maxSAmount}"
#            stop()
        else if storage.indObjS[1].last_buy
            maxSAmount = storage.last_buyAmount
            maxBAmount = 0
        else
            maxSAmount = 0
            maxBAmount = storage.last_sellAmount
#similate buy
        if ((storage.indObjS[1].val < _MFI_lower_treshold) and (maxBAmount > minBSAmount))
            storage.indObjS[1].last_buy = price
            storage.indObjS[1].last_sell = 0
            storage.last_buyAmount = maxBAmount
            storage.last_sellAmount = 0
            storage.indObjS[1].buys++
#similate sell
        else if ((storage.indObjS[1].val > _MFI_upper_treshold)  and (maxSAmount > minBSAmount))
            storage.indObjS[1].last_sell = price
            storage.last_buyAmount = 0
            storage.last_sellAmount = maxSAmount
            if storage.indObjS[1].last_buy > 0
                storage.indObjS[1].pl += (price - storage.indObjS[1].last_buy) *100 / storage.indObjS[1].last_buy
            storage.indObjS[1].last_buy = 0
            storage.indObjS[1].sells++
*/
        }//trademfi
}