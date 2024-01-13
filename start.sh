#!/bin/bash
# create the log directory if it doesn't exist
mkdir -p ~/sms-subscription-service
nohup node ./build/src/index.js 3000 > /dev/null 2>~/sms-subscription-service/log &
echo $! > pid
echo "Started SMS Subscription Service"

