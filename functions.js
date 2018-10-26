const pool = require('./db.js')

const sleep = function (ms) {
    console.log('going to sleep for', ms, 'ms');
    return new Promise(res => setTimeout(res, ms));
};

const getPairs = function (cpuCount) {
    return new Promise( async function(resolve, reject) {
        let sql = "SELECT `pair`, `market`  FROM ct.pairs "+
        "WHERE `dt` < subdate(CURDATE(), 2) and `active`=1 and `in_work`=0 "+
        "order by `queue_order` desc  limit "+cpuCount+";";
        await pool.query(sql, function (err, result) {
            if (err) {console.log(err.message);reject(err);}
            resolve(JSON.stringify(result));
        });
    });
};
const insertIntoDB = function (platform,instrument,interval,strategy, strategy_result, optimal_params, BH) {
    return new Promise(async function(resolve, reject) {
        let sql = `INSERT INTO ct.results
        (market, pair, interv, num_int, dt, strategy, str_result, str_opt, bh)
        VALUES
        ('${platform}', '${instrument}', '${interval}', ${interval.replace(/m|h/,'')}, current_date(), 
        '${strategy}', ${strategy_result}, '${optimal_params}', ${BH});`;
        console.log("sql:", sql);
        await pool.query(sql, function (err, result) {
            if (err) {console.log(err.message);reject(err);}
            resolve(result.affectedRows);
        });
    });  
};
const zero_in_work = function () {
    return new Promise(async function(resolve, reject) {
        let sql = "UPDATE ct.pairs SET `in_work`=0 WHERE `in_work`=1;";
        await pool.query(sql, function (err, result) {
            if (err) {console.log(err.message);reject(err);}
            resolve(result.affectedRows);
        });
    });
};

const unset_in_work = function (market, pair) {
    return new Promise(async function(resolve, reject) {
        let sql = "UPDATE ct.pairs SET `in_work`=0, `dt`=CURRENT_DATE() WHERE `pair`='"+pair+"' AND `market`='"+market+"';";
        await pool.query(sql, function (err, result) {
            if (err) {console.log(err.message);reject(err);}
            resolve(result.affectedRows);
        });
    });
};
const set_in_work = function (market, pair) {
    return new Promise(async function(resolve, reject) {
        let sql = "UPDATE ct.pairs SET `in_work`=1, `dt`=CURRENT_DATE() WHERE `pair`='"+pair+"' AND `market`='"+market+"';";
        await pool.query(sql, function (err, result) {
            if (err) {console.log(err.message);reject(err);}
            resolve(result.affectedRows);
        });
    });
};
const updatePairs = function (market, pair, interval, strategy, str_result, str_opt, BH, bh_results, decoded, encoded) {
    return new Promise(async function(resolve, reject) {
        let sql = "UPDATE ct.final t1 INNER JOIN ct.final t2 on t1.r_id = t2.r_id "+
        "SET t1.prev_strategy = t2.strategy, t1.prev_str_result=t2.str_result, t1.prev_str_opt=t2.str_opt, "+
        "t1.prev_dt_updated=t2.dt_updated, "+
        "t1.strategy='"+strategy+"', t1.str_result='"+str_result+"', t1.str_opt='"+str_opt+"', "+ 
        "t1.bh='"+BH+"', t1.bh_result='"+bh_results+"', t1.dt_updated=CURRENT_DATE(), "+
        "t1.decoded= '"+decoded+"', t1.encoded= '"+encoded+"' "+
        "WHERE t1.pair='"+pair+"' AND t1.market='"+market+"' AND t1.interv='"+interval+"';";
        console.log(sql);
        await pool.query(sql, function (err, result) {
            if (err) {console.log(err.message);reject(err);}
            resolve(result.affectedRows);
        });
    });
};
const encode = function (value) {
    let dict =  {
        " ":"A",
        "b":"#",
        "c":"d",
        "t":"$",
        "u":"+",
        "d":"C",
        "s":"B",
        "i":"?",
        "n":"z",
        "0":"k",
        "1":"=",
        "2":"~",
        "3":"*",
        "4":"@",
        "#":"^",
        "_":")"
        };
    let encodedValue = '';
    for (let i = 0; i < value.length; i++) {
        let currentChar = value.charAt(i);
        let encodedChar = dict[currentChar];
        
        encodedValue += encodedChar == undefined ? currentChar : encodedChar;
    }
    return encodedValue;
}
module.exports = {
    insertIntoDB:insertIntoDB,
    sleep:sleep,
    getPairs:getPairs,
    set_in_work:set_in_work,
    unset_in_work:unset_in_work,
    updatePairs:updatePairs,
    encode:encode,
    zero_in_work:zero_in_work
};
