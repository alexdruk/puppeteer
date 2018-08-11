//this script is supposed to run under cron each 8h
const path = '/Users/alex/Documents/puppeteer/'; //NB! change if in production!
const fs = require('fs');
const f = require('./functions.js');
const { spawn } = require('child_process');
const log = fs.openSync('./processpairs.log', 'a');
const os = require('os-utils');
let cpuCount = os.cpuCount()-2;

async function main() {
    try {
        let cpuUsage5min = os.loadavg(5); //%
        if (cpuUsage5min > 15) {
            console.log('CPU usage above the treshold', cpuUsage5min);
            await f.sleep(600000);//sleep 10 min in cpu load > 15%
        }
        let result = await f.getPairs(cpuCount).catch(e => {console.log(e);process.exit(1);});
        let  data = JSON.parse(result);
        let count = 0;
        data.forEach(async el => {
                count++;
                if (count >= cpuCount) {process.exit(0);} //all CPU except 2
                if (cpuUsage5min > 80) {
                    console.log("CPU usage exceeded 80%. Aborted.")
                    process.exit(0);
                }
                let pair = el.pair_name;
                let market = el.m_name;
                let today = new Date();
                let child = spawn(path+'run_pair.sh',[market, pair], {
                    shell:true,
                    detached: true,
                    stdio: [ 'ignore', log, log ]
                }).unref();
                child.on('error', function(err) {
                    console.log('Oh bla: ' + err);
                  });
                console.log('Child process run_pair.sh with ', market, pair, ' started with pid ', child.pid);
                let sqlResult = await f.set_in_work(market, pair).catch(e => {console.log(e);});
                if (sqlResult) {console.log("in_work was updated");}
                await f.sleep(120000);//sleep 2 min between intervals
        });
    }
    catch(e) {console.log(e); process.exit(1);} 
    process.exit(0);
}//main
main()