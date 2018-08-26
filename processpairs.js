//this script is supposed to run under cron each 8h
const path = '/home/ec2-user/puppeteer/'; //NB! change if in production!
const fs = require('fs');
const f = require('./functions.js');
const { spawn } = require('child_process');
const moment = require('moment');
let dt = moment(new Date()).format('MM-DD');
const logfile = path+"res/pairs"+dt+'.log';
const log = fs.openSync(logfile, 'a');
const os = require('os-utils');
let cpuCount = os.cpuCount()-1;

async function main() {
    try {
        console.log('cpuCount=', cpuCount);
        // set in_work to 0 is some are left from previous jobs
        let zeroed = await f.zero_in_work;
        if (zeroed) {console.log(zeroed, 'in-work records were set to zero')}
        let result = await f.getPairs(cpuCount).catch(e => {console.log(e);process.exit(1);});
        let  data = JSON.parse(result);
        if (data.length > 0) {
            console.log(data.length+" pairs will be updated.");
        }
        else {
            console.log('No pairs selected. Exiting...');
            process.exit(1);
        }
        let count = 0;
        for (let index = 0; index < data.length; index++) {
            const el = data[index];
            count++;
            if (count > cpuCount) {process.exit(0);} //all CPU except 2
            let pair = el.pair_name;
            let market = el.m_name;
            let child = spawn(path+'run_pair.sh',[market, pair], {
                shell:true,
                detached: true,
                stdio: [ 'ignore', log, log ]
            });
            let pid = child.pid;
            child.unref();
            console.log('Child process run_pair.sh with ', market, pair, 'with pid', pid);
            await f.sleep(300000);//sleep 5 min between intervals

        }
    }
    catch(e) {console.log(e); process.exit(1);} 
    process.exit(0);
}//main
main()