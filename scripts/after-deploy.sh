#!/bin/bash
REPOSITORY=/home/ubuntu/build

cd $REPOSITORY

sudo npm
# sudo pm2 start dist
# node server.js > /dev/null 2> /dev/null < /dev/null &
node server.js > server.log 2>&1 &