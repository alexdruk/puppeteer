now=$(date +"%T")
date=$(date +'%m-%d')
echo "Starting btc_usd 1m : $now"
node index.js bitstamp btc_usd 1m >> "./res/btc_usd_1m_$date.txt"

now=$(date +"%T")
echo "Starting btc_usd 5m : $now"
node index.js bitstamp btc_usd 5m >> "./res/btc_usd_5m_$date.txt"

now=$(date +"%T")
echo "Starting btc_usd 15m : $now"
node index.js bitstamp btc_usd 15m >> "./res/btc_usd_15m_$date.txt"

now=$(date +"%T")
echo "Starting btc_usd 30m : $now"
node index.js bitstamp btc_usd 30m >> "./res/btc_usd_30m_$date.txt"

now=$(date +"%T")
date=$(date +'%m-%d')
echo "Starting eth_btc 1m : $now"
node index.js bitstamp eth_btc 1m >> "./res/eth_btc_1m_$date.txt"

now=$(date +"%T")
echo "Starting eth_btc 5m : $now"
node index.js bitstamp eth_btc 5m >> "./res/eth_btc_5m_$date.txt"

now=$(date +"%T")
echo "Starting eth_btc 15m : $now"
node index.js bitstamp eth_btc 15m >> "./res/eth_btc_15m_$date.txt"

now=$(date +"%T")
echo "Starting eth_btc 30m : $now"
node index.js bitstamp eth_btc 30m >> "./res/eth_btc_30m_$date.txt"

now=$(date +"%T")
date=$(date +'%m-%d')
echo "Starting xrp_btc 1m : $now"
node index.js bitstamp xrp_btc 1m >> "./res/xrp_btc_1m_$date.txt"

now=$(date +"%T")
echo "Starting xrp_btc 5m : $now"
node index.js bitstamp xrp_btc 5m >> "./res/xrp_btc_5m_$date.txt"

now=$(date +"%T")
echo "Starting xrp_btc 15m : $now"
node index.js bitstamp xrp_btc 15m >> "./res/xrp_btc_15m_$date.txt"

now=$(date +"%T")
echo "Starting xrp_btc 30m : $now"
node index.js bitstamp xrp_btc 30m >> "./res/xrp_btc_30m_$date.txt"

now=$(date +"%T")
date=$(date +'%m-%d')
echo "Starting bcc_usdt 1m : $now"
node index.js binance bcc_usdt 1m >> "./res/bcc_usdt_1m_$date.txt"

now=$(date +"%T")
date=$(date +'%m-%d')
echo "Starting bcc_usdt 5m : $now"
node index.js binance bcc_usdt 5m >> "./res/bcc_usdt_5m_$date.txt"

now=$(date +"%T")
date=$(date +'%m-%d')
echo "Starting bcc_usdt 15m : $now"
node index.js binance bcc_usdt 15m >> "./res/bcc_usdt_15m_$date.txt"

now=$(date +"%T")
echo "Starting bcc_usdt 30m : $now"
node index.js binance bcc_usdt 30m >> "./res/bcc_usdt_30m_$date.txt"

now=$(date +"%T")
date=$(date +'%m-%d')
echo "Starting bnb_usdt 1m : $now"
node index.js binance bnb_usdt 1m >> "./res/bnb_usdt_1m_$date.txt"

now=$(date +"%T")
date=$(date +'%m-%d')
echo "Starting bnb_usdt 5m : $now"
node index.js binance bnb_usdt 5m >> "./res/bnb_usdt_5m_$date.txt"

now=$(date +"%T")
date=$(date +'%m-%d')
echo "Starting bnb_usdt 15m : $now"
node index.js binance bnb_usdt 15m >> "./res/bnb_usdt_15m_$date.txt"

now=$(date +"%T")
echo "Starting bnb_usdt 30m : $now"
node index.js binance bnb_usdt 30m >> "./res/bnb_usdt_30m_$date.txt"

now=$(date +"%T")
echo "End of all : $now"
