#!/bin/sh
find /var/log/cron*  -type f -mtime +5 -exec rm {} +
find /var/log/messages*  -type f -mtime +5 -exec rm {} +
find /var/log/httpd/access_log*  -type f -mtime +5 -exec rm {} +
find /var/log/httpd/error_log*  -type f -mtime +10 -exec rm {} +
find /home/ec2-user/puppeteer/data/*  -type f -mtime +4 -exec rm {} +
find /home/ec2-user/puppeteer/res/*  -type f -mtime +4 -exec rm {} +
