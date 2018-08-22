#/bin/sh
now=$(date +"%T")
date=$(date +'%m-%d')
echo "Starting processpairs.js $now"
/home/ec2-user/.nvm/versions/node/v8.11.2/bin/node /home/ec2-user/puppeteer/processpairs.js >> "./cron_$date.log"
now=$(date +"%T")
echo "End processpairs.js $now"
