const moment = require('moment');
module.exports = {    
    today:function formatTodayDate(){
        let today = new Date();
        let dt = moment(today).format('YYYY-MM-DD');
        dt = dt + ' 00:00';
    //	console.log('enddate =', dt)
        return dt;
    },

    prevdate:function formatPrevDate(enddate,interval,multiplier){
        if (enddate.indexOf(' 00:00') > -1) {
            enddate = enddate.replace(' 00:00','')
        }
        var momentObj = moment(enddate, 'YYYY-MM-DD');
        let tm = interval.match(/(\d{1,2})([minhd])/);
    //    console.log('time:', tm )
        let timeint = tm[1];
        let timeval = tm[2];
        let prev = moment(momentObj).subtract(multiplier * timeint, timeval);
        let pdt = moment(prev).format('YYYY-MM-DD HH:mm');
    //	pdt = pdt + ' 00:00';
    //    console.log('prev_date: ', pdt)
        return pdt
    },
    nextdate:function formatNextDate(prevdate,interval,multiplier){
        if (prevdate.indexOf(' 00:00') > -1) {
            prevdate = prevdate.replace(' 00:00','')
        }
        var momentObj = moment(prevdate, 'YYYY-MM-DD');
        let tm = interval.match(/(\d{1,2})([minhd])/);
    //    console.log('time:', tm )
        let timeint = tm[1];
        let timeval = tm[2];
        let next = moment(momentObj).add(multiplier * timeint, timeval);
        let ndt = moment(next).format('YYYY-MM-DD HH:mm');
    //	pdt = pdt + ' 00:00';
    //    console.log('prev_date: ', pdt)
        return ndt
    },
    ranges:function getRangesArr(periods, interval, multiplier){
        let ranges = []
        let lastday = this.today();
        let end = lastday;
        let start = '';
        let tm = interval.match(/(\d{1,2})([minhd])/);
    //    console.log('time:', tm )
        let timeint = tm[1];
        let timeval = tm[2];
        if (timeval == 'd'){ //to prevent very long data
            periods = 1;
        }
        else if ((timeval == 'h') && (timeint == 2)){
            periods = 1;
        }
        else if ((timeval == 'h') && (timeint == 1)){
            periods = 2;
        }
       else {
            periods = 3;
        }
        for (let i = 0; i < periods; i++) {
            start = this.prevdate(end,interval,multiplier)
            ranges[i] = {start:start,end:end};
            end = start;
        } 
        return ranges.reverse();
    }
}//exports