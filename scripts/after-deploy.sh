#!/bin/bash
REPOSITORY=/home/ubuntu/build

cd $REPOSITORY

sudo npm
fuser -k 30303/tcp
node server.js > server.log 2>&1 &
# sudo pm2 start dist