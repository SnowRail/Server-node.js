#!/bin/bash
REPOSITORY=/home/ubuntu/build

cd $REPOSITORY

sudo npm
fuser -k 30303/tcp
node InGameServer/InGameServer.js > InGameServer.log 2>&1 &
# sudo pm2 start dist