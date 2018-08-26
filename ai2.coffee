###
    ----- AI Bot -----
    version 1.2
###
trading = require 'trading' # import core trading module
talib = require 'talib' # import technical indicators library (https://cryptotrader.org/talib)
params = require 'params'
ds = require 'datasources'
######################### Setting
_code = params.add 'Enter your encoded string here', ''
DEBUG = true
#place decode function here
decode = (str) ->
    decodedValue = '';
    cdict = {"A":" ","#":"b","d":"c","$":"t","+":"u","C":"d","B":"s","?":"i","z":"n","k":"0","=":"1","~":"2","*":"3","@":"4","^":"#",")":"_"}
    for i in [0..str.length]
        currentChar = str.charAt(i);
        decodedChar = cdict[currentChar];
        if decodedChar? then char = decodedChar else char = currentChar
        decodedValue += char
    res = decodedValue.split ' '
    return res
[_pair,_exchange,_interval,_strategy, _optParams] = decode(_code) #global params available in handle
if DEBUG then debug "_pair:#{_pair},_exchange:#{_exchange},_interval:#{_interval},_strategy:#{_strategy}, _optParams:#{_optParams}"
ds.add _exchange, _pair, '5m', size=100
ds.add _exchange, _pair, '15m', size=100
ds.add _exchange, _pair, '30m', size=100
ds.add _exchange, _pair, '1h', size=100
ds.add _exchange, _pair, '2h', size=100

_showReportTick = 288
_lag = 1
_plot = false
######################### Functions
###
    function calculate STOCH using standard module
    @params - high,low,close,lag,fastK_period,slowK_period, slowK_MAType=0,slowD_period=3,slowD_MAType=0
    @return: last K and D
###
stoch = (high,low,close,lag,fastK_period,slowK_period) ->
    results = talib.STOCH
      high: high
      low: low
      close: close
      startIdx: 0
      endIdx: high.length - lag
      optInFastK_Period: fastK_period
      optInSlowK_Period: slowK_period
      optInSlowK_MAType: 0
      optInSlowD_Period: 3
      optInSlowD_MAType: 0
    result =
      K: _.last(results.outSlowK)
      D: _.last(results.outSlowD)
    result

###
    function calculate STOCH fast using standard module
    @params - high, low, close, lag, fastK_period,fastD_period,fastD_MAType=0
    @return: last K and D
###
stochf = (high, low, close, lag, fastK_period,fastD_period,fastD_MAType) ->
    results = talib.STOCHF
      high: high
      low: low
      close: close
      startIdx: 0
      endIdx: high.length - lag
      optInFastK_Period: fastK_period
      optInFastD_Period: fastD_period
      optInFastD_MAType: 0
    result =
      K: _.last(results.outFastK)
      D: _.last(results.outFastD)
    result

###
    function calculate EMA (Exponential moving average) using standard module
    @params - data, lag (usually 1) and period
    @return: last EMA
###
ema = (data, lag, period) ->
    period = data.length unless data.length >= period
    results = talib.MA
      inReal: data
      startIdx: 0
      endIdx: data.length - lag
      optInTimePeriod: period
      optInMAType: 1 #1 = EMA (Exponential Moving Average) For more see:https://cryptotrader.org/topics/417406/developer-university-lesson-4-ta-lib-making-your-bot-smarter-part-1
    results
###
    function calculate MFI using standard module
    @params - data, lag  and period
    @return: MFI array
###
mfi = (high, low, close, volume, lag, period) ->
    results = talib.MFI
      high: high
      low: low
      close: close
      volume: volume
      startIdx: 0
      endIdx: high.length - lag
      optInTimePeriod: period
    results
###
    function calculate RSI using standard module
    @params - data, lag (usually 1) and period
    @return: RSI array
###
rsi = (data, lag, period) ->
    period = data.length unless data.length >= period
    results = talib.RSI
      inReal: data
      startIdx: 0
      endIdx: data.length - lag
      optInTimePeriod: period
    results
###
    function calculate MACD using standard module
    @params - data, lag (usually 1) and period
    @return: macd, signal and histogram

###
macd = (data, lag, FastPeriod,SlowPeriod,SignalPeriod) ->
    results = talib.MACD
     inReal: data
     startIdx: 0
     endIdx: data.length - lag
     optInFastPeriod: FastPeriod
     optInSlowPeriod: SlowPeriod
     optInSignalPeriod: SignalPeriod
    result =
      macd: results.outMACD
      signal: results.outMACDSignal
      histogram: results.outMACDHist
    result
###
    function calculate parabolic SAR using standard module
    @params - data, lag (usually 1), acceleration, max acceleration
    @return: SAR
###
sar = (high, low, lag, accel, accelmax) ->
    results = talib.SAR
      high: high
      low: low
      startIdx: 0
      endIdx: high.length - lag
      optInAcceleration: accel
      optInMaximum: accelmax
    _.last(results)
###
    function calculate standard deviation using standard module
    @params - data, lag  and period
    @return: SDT array
###
stddev = (data,  lag, period, NbDev=1) ->
    results = talib.STDDEV
      inReal: data
      startIdx: 0
      endIdx: data.length - lag
      optInTimePeriod: period
      optInNbDev: NbDev
    _.last(results)
###
    function Bollinger Bands
    @params - data, lag, period, NbDevUp, NbDevDn,MAType
    @return: UpperBand, MiddleBand, LowerBand arrays
###
bbands = (data, lag, period, NbDevUp, NbDevDn, MAType) ->
    results = talib.BBANDS
      inReal: data
      startIdx: 0
      endIdx: data.length - lag
      optInTimePeriod: period
      optInNbDevUp: NbDevUp
      optInNbDevDn: NbDevDn
      optInMAType: MAType
    result =
      UpperBand: _.last(results.outRealUpperBand)
      MiddleBand: _.last(results.outRealMiddleBand)
      LowerBand: _.last(results.outRealLowerBand)
    result
###
 * @param num The number to round
 * @param precision The number of decimal places to preserve
###
roundUp = (num, precision=9) ->
  precision = Math.pow(10, precision)
  return Math.ceil(num * precision) / precision
roundDown = (number, decimals) ->
    decimals = decimals || 0;
    return ( Math.floor( number * Math.pow(10, decimals) ) / Math.pow(10, decimals) );

###
    function print debug statements with balance and initial info
    @params - array of instruments
    @return: print debug messages
###
iniBalance = (ins) ->
    currency = @portfolios[ins.market].positions[ins.curr()].amount
    assets = @portfolios[ins.market].positions[ins.asset()].amount
    total = (currency + assets * ins.price).toFixed(4)
    coinName = ins._pair[1].toUpperCase()
    storage.inibalance = total
    storage.assets_ini = assets.toFixed(4)
    storage.currency_ini = currency.toFixed(4)
    storage.coin_price_ini ?= ins.price
    storage.cash_in_coin_ini  = storage.currency_ini / storage.coin_price_ini
    total_in_assets = (currency / ins.price + assets).toFixed(4)
    storage.inibalance_in_assets = total_in_assets
    storage.coinName = coinName
    currName = ins._pair[0].toUpperCase()
    storage.currName = currName
    info "Initial Balance: #{storage.currency_ini}#{storage.coinName} + #{storage.assets_ini}#{ins._pair[0].toUpperCase()}(#{(storage.assets_ini * storage.coin_price_ini).toFixed(4)}#{storage.coinName}) = #{storage.inibalance}#{storage.coinName}"
    info "Initial Balance (#{ins._pair[0].toUpperCase()}): #{storage.assets_ini}#{ins._pair[0].toUpperCase()} + #{storage.currency_ini}#{coinName}(#{(storage.cash_in_coin_ini).toFixed(4)}#{ins._pair[0].toUpperCase()}) = #{storage.inibalance_in_assets}#{ins._pair[0].toUpperCase()}"
    info "Initial prices: #{ins._pair[0].toUpperCase()} price: #{ins.price.toFixed(4)}"
###
    function update storage values
    @params - array of instruments
    @return: none
###
updateStorage = (ins) ->
    currency = @portfolios[ins.market].positions[ins.curr()].amount
    assets = @portfolios[ins.market].positions[ins.asset()].amount
    storage.assets = assets.toFixed(4)
    storage.currency = currency.toFixed(4)
    storage.coin_price = ins.price
    currentBalance = (currency + assets * ins.price).toFixed(4)
    storage.currentbalance = currentBalance
    realtotal = currency + assets * storage.coin_price_ini
    storage.realtotal = realtotal
    #
    storage.cash_in_coin  = storage.currency / ins.price
    total_in_assets = (currency / ins.price + assets).toFixed(4)
    storage.balance_in_assets = total_in_assets
    #
    total_gain = ((currentBalance - storage.inibalance) * 100 / storage.inibalance).toFixed(2)
    adj_gain = ((storage.realtotal - storage.inibalance) * 100 / storage.inibalance).toFixed(2)
    storage.totalPL = total_gain
    storage.adjPL = adj_gain
    coinName = ins._pair[1].toUpperCase()
    storage.BH = ((storage.coin_price - storage.coin_price_ini) * 100 / storage.coin_price_ini).toFixed(2)
###
    function update current  P/L value
    @params - array of instruments
    @return: none
###
updatePL = (ins) ->
    if (storage.last_sell and storage.last_buy and (storage.trade == 's'))
        storage.currentPL = ((storage.last_sell - storage.last_buy)*100/storage.last_buy).toFixed(2)
        if storage.currentPL >= 0
            storage.posPLsum = parseFloat(storage.posPLsum) + parseFloat(storage.currentPL)
        else
            storage.negPLsum = parseFloat(storage.negPLsum) + parseFloat(storage.currentPL)
###
    function print debug statements with balance and gain info
    @params - array of instruments
    @return: print debug messages
###
report = (ins) ->
    updateStorage(ins)
    info "*** Tick: #{storage.TICK} ***"
    debug "Starting Balance: #{storage.currency_ini}#{storage.coinName} + #{storage.assets_ini}#{ins._pair[0].toUpperCase()}(#{(storage.assets_ini * storage.coin_price_ini).toFixed(4)}#{storage.coinName}) = #{storage.inibalance}#{storage.coinName}"
    debug "Current Balance:\u00A0\u00A0#{storage.currency}#{storage.coinName} + #{storage.assets}#{ins._pair[0].toUpperCase()}(#{(storage.assets * ins.price).toFixed(4)}#{storage.coinName}) = #{storage.currentbalance}#{storage.coinName}"
    debug "Current Balance (#{storage.currName}): #{storage.assets}#{storage.currName} + #{storage.currency}#{storage.coinName}(#{(storage.cash_in_coin).toFixed(4)}#{storage.currName}) = #{storage.balance_in_assets}#{storage.currName}"
    if storage.currentPL
        debug "Total Profit/Loss: #{storage.totalPL}% |Buy&Hold: #{ins._pair[0].toUpperCase()}:#{storage.BH}%"
#        debug "Last trade P/L: #{storage.currentPL} | Total P/L: #{storage.totalPL} | Adj. P/L: #{storage.adjPL} | B&H: #{ins._pair[0].toUpperCase()}:#{storage.BH}%"
#        debug "Total trades: #{storage.sells + storage.buys} | Buys: #{storage.buys} | Sells: #{storage.sells} | Wins: #{storage.wins} | Losses: #{storage.losses}"
###
    function get fees for current exchange
    @params - exchange
    @return: fee
###
getFees = (exchange) ->
    switch exchange
        when 'binance'  then fee = 0.175
        when 'bitstamp'  then fee = 0.425
        when 'poloniex'  then fee = 0.35
        when 'cdax'  then fee = 0.425
        when 'wex'  then fee = 0.35
        when 'cexio'  then fee = 0.425
        when 'bifinex'  then fee = 0.175
        when 'kraken'  then fee = 0.35
        else  fee = 0
    fee
######################### Initialisation
init: ->
#delete what not needed
    storage.TICK ?= 0
    storage.sells ?= 0
    storage.last_buy ?= 0
    storage.last_sell ?= 0
    storage.buys ?= 0
    storage.curr_avalable ?= 0
    storage.up ?= 0; # for consequent indicarors, like RSI
    storage.down ?= 0;
    storage.fee ?= 0
    storage.pl ?= 0
    storage.posPLsum ?= 0
    storage.negPLsum ?= 0
    storage.totalPL ?= 0
    storage.currentPL ?= 0
    storage.trade ?= ''

    setPlotOptions
        SAR :
            color: 'orange'
            lineWidth: 2
        LowerBand:
            color: '#96FF33'
            lineWidth: 1
        UpperBand:
            color: '#96FF33'
            lineWidth: 1
        MACD:
            color: 'orange'
            secondary: true
        MACDsignal:
            color: 'red'
            secondary: true
        RSI:
            color: 'blue'
            secondary: true
        MFI:
            color: 'blue'
            secondary: true
        EMAs:
            color: 'blue'
        EMAl:
            color: 'red'
        STOCH:
            color: 'green'
            secondary: true
        STOCHF:
            color: 'green'
            secondary: true
        StochRSI:
            color: 'green'
            secondary: true
        Profit:
            color: 'blue'
            secondary: true


######################### Main
handle: ->
    ins0 = @data.instruments[0]
#    debug "interval:#{_interval}"
    if (_interval == '1h') then _interval = '60m'
    if (_interval == '2h') then _interval = '120m'
    _interval = parseInt(_interval) #IMPORTANT
#    debug "interval:#{_interval}"
    if ins0.interval != 1
        warn "Interval should be set for 1m"
        stop()
    if ins0.market != _exchange or _pair != ins0.pair
        warn "Use only exchange and pair, that you used to get recomendation!"
        stop()
#    if DEBUG then debug "interval:#{_interval} exchange:#{_exchange} pair:#{_pair} strategy:#{_strategy}"

    switch _interval
        when 5  then ins = ds.get _exchange, _pair, '5m'
        when 15 then ins = ds.get _exchange, _pair, '15m'
        when 30 then ins = ds.get _exchange, _pair, '30m'
        when 60 then ins = ds.get _exchange, _pair, '60m'
        when 120 then ins = ds.get _exchange, _pair, '120m'
        else ins = ds.get _exchange, _pair, '1m'
    price = ins0.price
    close = _.last(ins.close)
    prev_close = ins.close[ins.close.length-2]

    if storage.TICK < 1
        storage.botStartedAt ?= ins.at
        [minOrder, unit] = trading.getMinimumOrder ins # min order: 0.001 unit: btc
        storage.minOrder = minOrder
        storage.minOrderUnit = unit
        iniBalance(ins)
        storage.curr_avalable = @portfolios[ins.market].positions[ins.curr()].amount
        storage.fee = getFees(_exchange)
    if storage.minOrderUnit == ins._pair[0]
        minBAmount = storage.minOrder
        minSAmount = storage.minOrder
#        if DEBUG then debug "minBAmount:#{minBAmount} minSAmount;#{minSAmount}"
    else
        minBAmount = storage.minOrder/price
        minSAmount = storage.minOrder/price
    currency = @portfolios[ins.market].positions[ins.curr()].amount
    assets = @portfolios[ins.market].positions[ins.asset()].amount

    allowTrades = false
    buy_condition = false
    sell_condition = false
    maxBuyAmount = @portfolio.positions[ins.base()].amount / price
    maxBuyAmount = roundDown(maxBuyAmount, 8)
    maxSellAmount = @portfolios[ins.market].positions[ins.asset()].amount
    [optP,optZ] = _optParams.split 'Z'
    optParams = optP.split '#'
#    if DEBUG then debug "opt0;#{optParams[0]} opt1;#{optParams[1]} opt1;#{optParams[1]} all:#{optParams}"

    switch _strategy
        when 'bb'
            bb_period = optParams[0]
            n_stds = optParams[1]
            std_period = optParams[2]
            bbResults = bbands(ins.close, 1, bb_period, n_stds, n_stds, 0)
            bbUpperBand = bbResults.UpperBand
            bbLowerBand = bbResults.LowerBand
            std = stddev(ins.close, 1, std_period, 1)
            if ((price < (bbLowerBand - std)) and (maxBuyAmount > minBAmount)) then buy_condition = true else buy_condition = false
            if ((price > (bbUpperBand + std)) and (maxSellAmount > minSAmount)) then sell_condition = true else  sell_condition = false
            allowTrades = true
            if _plot
                plot
                    UpperBand: bbUpperBand
                    LowerBand: bbLowerBand
        when 'bb_sar'
            bb_period = optParams[0]
            n_stds = optParams[1]
            std_period = optParams[2]
            _SAR_accel = optParams[3]
            bbResults = bbands(ins.close, 1, bb_period, n_stds, n_stds, 0)
            bbUpperBand = bbResults.UpperBand
            bbLowerBand = bbResults.LowerBand
            std = stddev(ins.close, 1, std_period, 1)
            sarResults = sar(ins.high, ins.low, 1, _SAR_accel, _SAR_accel*10)
            if ((price < (bbLowerBand - std)) and (maxBuyAmount > minBAmount)) then buy_condition = true else buy_condition = false
            if ((price > (bbUpperBand + std)) and (maxSellAmount > minSAmount)) then sell_condition = true else sell_condition = false
            if price < sarResults then allowTrades = false else allowTrades = true
            if _plot
                plot
                    UpperBand: bbUpperBand
                    LowerBand: bbLowerBand
                    SAR: sarResults
        when 'macd'
            _MACD_FastPeriod = optParams[0]
            _MACD_SlowPeriod = optParams[1]
            _MACD_SignalPeriod = optParams[2]
            MACD = macd(ins.close, _lag, _MACD_FastPeriod, _MACD_SlowPeriod, _MACD_SignalPeriod)
            m = _.last(MACD.macd)
            s  = _.last(MACD.signal)
            prev_s = MACD.signal[MACD.signal.length-2];
            prev_m = MACD.macd[MACD.macd.length-2];
            if ((s >= m) && (prev_s < prev_m)) then buy_condition = true else buy_condition = false
            if ((s <= m) && (prev_s > prev_m)) then sell_condition = true else sell_condition = false
            allowTrades = true
            if _plot
                plot
                    MACDsignal: s
                    MACD: m
        when 'macd_rsi'
            _MACD_FastPeriod = optParams[0]
            _MACD_SlowPeriod = optParams[1]
            _MACD_SignalPeriod = optParams[2]
            _RSIperiod = optParams[3]
            _RSI_upper_treshold = 70
            _RSI_lower_treshold = 30
            MACD = macd(ins.close, _lag, _MACD_FastPeriod, _MACD_SlowPeriod, _MACD_SignalPeriod)
            m = _.last(MACD.macd)
            s  = _.last(MACD.signal)
            rsiResult   = _.last(rsi(ins.close,  _lag, _RSIperiod))
            if ((s < m) && (rsiResult < _RSI_lower_treshold)) then buy_condition = true else buy_condition = false
            if ((s > m) && (rsiResult > _RSI_upper_treshold)) then sell_condition = true else sell_condition = false
            allowTrades = true
            if _plot
                setPlotOptions
                    MACD:
                        color: 'orange'
                    MACDsignal:
                        color: 'red'
                    RSI:
                        color: 'blue'
                        secondary: true
                plot
                    MACDsignal: s
                    MACD: m
                    RSI: rsiResult
        when 'mfi'
            _MFIperiod = optParams[0]
            _MFI_lower_treshold = 20;
            _MFI_upper_treshold = 80;
            mfiResult   = _.last(mfi(ins.high, ins.low, ins.close, ins.volumes, _lag, _MFIperiod))
            if (mfiResult < _MFI_lower_treshold) then buy_condition = true else buy_condition = false
            if (mfiResult > _MFI_upper_treshold) then sell_condition = true else sell_condition = false
            allowTrades = true
            if _plot
                setPlotOptions
                    MFI:
                        color: 'blue'
                        secondary: true
                plot
                    MFI: mfiResult
        when 'rsi'
            _RSIperiod = optParams[0]
            _RSIdelay = optParams[1]
            _RSI_upper_treshold = 70
            _RSI_lower_treshold = 30
            rsiResult   = _.last(rsi(ins.close, _lag, _RSIperiod))
            if (rsiResult > _RSI_upper_treshold)
                storage.up++
                storage.down = 0
            else if (rsiResult < _RSI_lower_treshold)
                storage.down++
                storage.up = 0
            else
                storage.down = 0
                storage.up = 0
            if ((rsiResult < _RSI_lower_treshold) and (storage.down >= _RSIdelay)) then buy_condition = true else buy_condition = false
            if ((rsiResult > _RSI_upper_treshold) and (storage.up >= _RSIdelay)) then sell_condition = true else sell_condition = false
            allowTrades = true
            if _plot
                setPlotOptions
                    RSI:
                        color: 'blue'
                        secondary: true
                plot
                    RSI: rsiResult
        when 'simple_macd'
            _MACD_FastPeriod = optParams[0]
            _MACD_SlowPeriod = optParams[1]
            _MACD_SignalPeriod = optParams[2]
            _s_macd_lower_treshold = -50;
            _s_macd_upper_treshold = 80;
            MACD = macd(ins.close, _lag, _MACD_FastPeriod, _MACD_SlowPeriod, _MACD_SignalPeriod)
            m = _.last(MACD.macd)
            if (m < _s_macd_lower_treshold) then buy_condition = true else buy_condition = false
            if (m > _s_macd_upper_treshold) then sell_condition = true else sell_condition = false
            allowTrades = true
            if _plot
                plot
                    MACD: m
        when 'ema_sar'
            _shortPeriod = optParams[0]
            _longPeriod = optParams[1]
            _sarPeriod = optParams[2]
            optInAccelerations = 0.0025
            sarResults = sar(ins.high, ins.low, _lag, optInAccelerations, optInAccelerations*10);
            shortResults = ema(ins.close, _lag, _shortPeriod)
            longResults = ema(ins.close, _lag, _longPeriod)
            s = _.last(shortResults)
            l = _.last(longResults)
            prev_s = shortResults[shortResults.length-2];
            prev_l = longResults[longResults.length-2];
            if ((s >= l) && (prev_s < prev_l)) then buy_condition = true else buy_condition = false
            if ((s <= l) && (prev_s > prev_l)) then sell_condition = true else sell_condition = false
            if (sarResults > price) then allowTrades = false else allowTrades = true
            if _plot
                plot
                    EMAs: s
                    EMAl: l
                    SAR: sarResults
        when 'stoch'
            _fastK_periods = optParams[0]
            _slowK_periods = optParams[1]
            _STOCH_lower_treshold = 20;
            _STOCH_upper_treshold = 85;
            STOCHResults = stoch(ins.high, ins.low, ins.close, _lag, _fastK_periods, _slowK_periods);
            stochK = STOCHResults.K
            if (stochK < _STOCH_lower_treshold) then buy_condition = true else buy_condition = false
            if (stochK > _STOCH_upper_treshold) then sell_condition = true else sell_condition = false
            allowTrades = true
            if _plot
                plot
                    STOCH: stochK
        when 'fast_stoch'
            _f_fastK_periods = optParams[0]
            _fastD_periods = optParams[1]
            _RSIperiods = optParams[0]
            _Stochperiods = optParams[1]
            _fSTOCH_lower_treshold = 1;
            _fSTOCH_upper_treshold = 99;
            fSTOCHResults = stoch(ins.high, ins.low, ins.close, _lag, _f_fastK_periods, _fastD_periods);
            f_stochK = fSTOCHResults.K
            if (f_stochK < _fSTOCH_lower_treshold) then buy_condition = true else buy_condition = false
            if (f_stochK > _fSTOCH_upper_treshold) then sell_condition = true else sell_condition = false
            allowTrades = true
            if _plot
                plot
                    STOCH: f_stochK
        when 'stoch_rsi'
            _RSI_period = optParams[0]
            _STOCH_period = optParams[1]
            _STOCHRSI_lower_treshold = 5;
            _STOCHRSI_upper_treshold = 95;
            if _STOCH_period < _RSI_period then _STOCH_period = _RSI_period
            rsiResult =   _.last(rsi(ins.close, _lag, _RSI_period))
            stochResults = []
            for n in [_STOCH_period  .. 1] # for (let n = _STOCH_period; n > 1; n--)
                rsiResults =   rsi(ins.close, n, _RSI_period)
                rsi_last   = _.last(rsiResults)
                sliced = rsiResults.slice(-_STOCH_period)
                highest    = _.max(sliced) #should be done as Math.max(...sliced)
                lowest     = _.min(sliced)
                stoch_rsi  =   100 * (rsi_last - lowest) / (highest - lowest)
                stochResults.push  stoch_rsi
            kstoch_rsi = _.last(stochResults)
            if (kstoch_rsi < _STOCHRSI_lower_treshold) then buy_condition = true else buy_condition = false
            if (kstoch_rsi > _STOCHRSI_upper_treshold) then sell_condition = true else sell_condition = false
            allowTrades = true
            if _plot
                plot
                    StochRSI: kstoch_rsi

#trading
        #buy
    if allowTrades and buy_condition and storage.curr_avalable
                try
                    if trading.buy ins, 'market', maxBuyAmount, price
#                        if DEBUG then debug "buy order placed for #{maxBuyAmount} at #{price}"
                        storage.last_buy = price;
                        storage.curr_avalable = 0;
                        storage.buys++;
                        storage.trade = 'b'
                        storage.last_sell = 0;
                catch e
                    if /insufficient funds/i.exec e
                        warn "Insufficient funds error in attempt to buy #{maximumBuyAmount} at #{price}. #{maximumBuyAmount * price} needed, #{currency} found."
                    else if /minimum order/i.exec e
                        warn "minimum order amount error in attempt to buy #{maximumBuyAmount} at #{price}"
                    else if /order amount/i.exec e
                        warn "invalid order amount error in attempt to buy amount:#{maximumBuyAmount} at price:#{price}"
                    else
                        throw e # rethrow unhandled exception#

        #sell
    if allowTrades and sell_condition and  storage.last_buy
                try
                    if trading.sell ins, 'market', maxSellAmount, price
                        storage.last_sell = price;
                        storage.curr_avalable = storage.last_buy;
                        storage.trade = 's'
                        storage.sells++;
                        storage.pl += ((price - storage.last_buy) *100 / storage.last_buy) - storage.fee;
                        updatePL(ins)
                        report(ins)
#                        if DEBUG then debug "last_sale:#{storage.last_sell} last_buy:#{storage.last_buy} trade:#{storage.trade} currentPL:#{storage.currentPL}"
                        storage.last_buy = 0;
                        plot
                            Profit:storage.pl
                catch e
                    if /insufficient funds/i.exec e
                        warn "Insufficient funds error in attempt to sell #{maxSellAmount} at #{price}."
                    else if /minimum order/i.exec e
                        warn "minimum order amount error in attempt to sell #{maxSellAmount} at #{price}"
                    else if /order amount/i.exec e
                        warn "invalid order amount error in attempt to sell amount:#{maxSellAmount} at price:#{price}"
                    else
                        throw e # rethrow unhandled exception#
    updateStorage(ins)
    if (storage.TICK % _showReportTick) == 0 #show report on each N-th interval
        report(ins)
    storage.TICK++
onRestart: ->
    info "_____  BOT RESTARTED  ______"
    warn "Attention! Some data can be lost and your stats incorrect"
    debug "Bot restarted at #{new Date(data.at)}"
    debug "Starting balance: #{storage.inibalance} #{storage.coinName}"
    debug "Ending balance: #{storage.currentbalance} #{storage.coinName}"
    if storage.totalPL
        debug "Profit/Loss total: #{storage.totalPL}% | B&H:# {storage.BH}%"
#    if storage.adjPL
#        debug "Adjusted (in initial prices) profit/Loss: #{storage.adjPL}%"
    debug "_________________________________________________________________"

onStop: ->
    debug "_________________________________________________________________"
    info "_____  BOT STOPED  ____"
    debug "Bot started at #{new Date(storage.botStartedAt)}"
    debug "Bot stopped at #{new Date(data.at)}"
    debug "Starting balance: #{storage.inibalance} #{storage.coinName}(#{(storage.inibalance_in_assets)}#{storage.currName})"
    debug "Ending balance: #{storage.currentbalance} #{storage.coinName}"
    debug "Ending Balance (#{storage.currName}): #{storage.assets}#{storage.currName} + #{storage.currency}#{storage.coinName}(#{(storage.cash_in_coin).toFixed(4)}#{storage.currName}) = #{storage.balance_in_assets}#{storage.currName}"
    if storage.totalPL
        debug "Profit/Loss total: #{storage.totalPL}%  | B&H: #{storage.BH}%"
#    if storage.adjPL
#        debug "Adjusted (in initial prices) profit/Loss: #{storage.adjPL}%"
#    if storage.wins
#        debug "Total wins #{storage.wins}. Average wins profit: #{(storage.posPLsum / storage.wins).toFixed(2)}"
#    if storage.losses
#        debug "Total trades at loss #{storage.losses}. Average losses: #{(storage.negPLsum / storage.losses).toFixed(2)}"
    debug "_________________________________________________________________"

