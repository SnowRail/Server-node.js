#!/bin/bash
REPOSITORY=/home/ubuntu/build

cd $REPOSITORY

sudo npm
fuser -k 30303/tcp
pm2 start build/InGameServer/InGameServer.js --name InGameServer

# sudo pm2 start dist