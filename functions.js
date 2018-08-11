const pool = require('./db.js')

const sleep = async function (ms) {
    console.log('going to sleep for', ms, 'ms');
    return new Promise(res => setTimeout(res, ms));
};

const getPairs = function (cpuCount) {
    return new Promise( async function(resolve, reject) {
        let sql = "SELECT `pair_name`, `m_name`  FROM ct.pairs "+
        "WHERE `dt` < subdate(CURDATE(), 2) and `active`=1 and `in_work`=0 "+
        "order by `queue_order` desc  limit "+cpuCount+";";
        await pool.query(sql, function (err, result) {
        if (err) {reject(err.message);}
        resolve(JSON.stringify(result));
        });
    });
};
const insertIntoDB = function (strategy, strategy_result, optimal_params) {
    return new Promise(async function(resolve, reject) {
        let sql = `INSERT INTO ct.results
        (market, pair, interv, num_int, dt, strategy, str_result, str_opt)
        VALUES
        ('${platform}', '${instrument}', '${interval}', ${interval.replace(/m|h/,'')}, current_date(), 
        '${strategy}', ${strategy_result}, '${optimal_params}');`;
        console.log("sql:", sql);
        await pool.query(sql, function (err, result) {
            if (err) {reject(err.message);}
            resolve(result.affectedRows);
        });
    });  
};

const unset_in_work = function (market, pair) {
    return new Promise(async function(resolve, reject) {
        let sql = "UPDATE `ct.pairs` SET `in_work`=0 WHERE `pair_name`='"+pair+"' AND `m_name`='"+market+"';";
        await pool.query(sql, function (err, result) {
        if (err) {reject(err.message);}
        resolve(result.affectedRows);
        });
    });
};
const set_in_work = function (market, pair) {
    return new Promise(async function(resolve, reject) {
        let sql = "UPDATE `ct.pairs` SET `in_work`=1 WHERE `pair_name`='"+pair+"' AND `m_name`='"+market+"';";
        await pool.query(sql, function (err, result) {
        if (err) {reject(err.message);}
        resolve(result.affectedRows);
        });
    });
};

module.exports = {
    insertIntoDB:insertIntoDB,
    sleep:sleep,
    getPairs:getPairs,
    set_in_work:set_in_work,
    unset_in_work:unset_in_work
};
