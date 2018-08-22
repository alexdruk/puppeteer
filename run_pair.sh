#!/bin/sh
if [ $# -ne 2 ]
  then
    echo "No or wrong arguments supplied. Exiting..."
    exit 1
fi
declare -a arr=("5m" "15m" "30m" "1h" "2h")
date=$(date +'%m-%d')

for i in "${arr[@]}"
do
	now=$(date +"%T")
	echo "Starting $2 $i : $now"
	node index.js $1 $2 $i >> "/home/ec2-user/puppeteer/res/$1_$2_$i_$date.txt"
done
now=$(date +"%T")
echo "End of all $2: $now"
