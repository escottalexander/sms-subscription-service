#!/bin/bash
kill -9 `cat pid`
rm pid
echo "Stopped SMS Subscription Service"