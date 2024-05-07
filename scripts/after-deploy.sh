#!/bin/bash
REPOSITORY=/home/ubuntu/build

cd $REPOSITORY

sudo npm
fuser -k 30303/tcp
pm2 start build/InGameServer/InGameServer.js --name InGameServer
pm2 logs InGameServer
# sudo pm2 start dist