//require
const TIME = require('./time_functions.js');
const fs = require("fs");
const args = process.argv;
//console.log(args, args.length);
if (args.length < 5) {
    console.log('Wrong number of arguments! Exiting...');
    process.exit(1);
}
const platform = args[2].toString();
const instrument = args[3].toString();
const interval = args[4].toString();//
const filename = './data/' + instrument + '_' + TIME.today().replace(' 00:00','')+ '_' + interval + '.json';
console.log('args: ', platform, instrument, interval, filename);
let ins = {
    low:[],
    high:[],
    open:[],
    close:[],
    volume:[],
    at:[]
};
async function getData() {
    return new Promise((resolve, reject) => {
        const { spawn } = require('child_process');
        const child = spawn('node', ['getData.js', platform, instrument, interval]);
        child.stdout.on('data', (data) => {
            console.log(`${data}`);
        });
        child.stderr.on('data', (data) => {
            console.error(`child stderr:\n${data}`);
        });
        child.on('exit', function (code, signal) {
            console.log('child process exited with ' +
                        `code ${code} and signal ${signal}`);
        });
    }, function (err, result) {
        if (err) {
            reject(err);
        }
        else {
           resolve();            
        }
    });

}
(async() => {    
    let fileExists = false;
    if (fs.existsSync(filename)) {
        let rawdata = fs.readFileSync(filename, e => {console.log(e);});
        ins = JSON.parse(rawdata); 
    }
    else {
        ins = await getData();
        if (fs.existsSync(filename)) {
            let rawdata = fs.readFileSync(filename, e => {console.log(e);});
            ins = JSON.parse(rawdata); 
            console.log('ins len: ', ins.at.length)
        }
    }
   if (ins) {
        console.log('ins exists: ', ins.at.length);
    }
    else {
        console.log('async');
    }
})();