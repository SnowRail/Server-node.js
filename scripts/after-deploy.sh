#!/bin/bash
REPOSITORY=/home/ubuntu/build

cd $REPOSITORY

sudo npm
pm2 stop InGameServer
pm2 start build/InGameServer/InGameServer.js --name InGameServer
pm2 logs InGameServer
# sudo pm2 start dist