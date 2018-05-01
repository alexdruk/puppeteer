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
        if (timeval == 'h') {
            timeval = 'hours';
        }
        else if (timeval == 'd'){
            timeval = 'days';
        }
        else {
            timeval = 'minutes';
        }
        let prev = moment(momentObj).subtract(multiplier * timeint, timeval);
        let pdt = moment(prev).format('YYYY-MM-DD HH:mm');
    //	pdt = pdt + ' 00:00';
        console.log('prev_date: ', pdt)
        return pdt
    }
}//exports