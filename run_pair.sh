#!/bin/sh
if [ $# -ne 2 ]
  then
    echo "No or wrong arguments supplied. Exiting..."
    exit 1
fi
now=$(date +"%T")
date=$(date +'%m-%d')
echo "Starting $2 5m : $now"
node index.js $1 $2 5m >> "./res/$1_$2_5m_$date.txt"
now=$(date +"%T")
echo "Starting $2 15m : $now"
node index.js $1 $2 15m >> "./res/$1_$2_15m_$date.txt"
now=$(date +"%T")
echo "Starting $2 30m : $now"
node index.js $1 $2 30m >> "./res/$1_$2_30m_$date.txt"
now=$(date +"%T")
echo "Starting $2 1h : $now"
node index.js $1 $2 1h >> "./res/$1_$2_1h_$date.txt"
now=$(date +"%T")
echo "Starting $2 2h : $now"
node index.js $1 $2 2h >> "./res/$1_$2_2h_$date.txt"
now=$(date +"%T")
echo "End of all : $now"
