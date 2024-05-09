#!/bin/bash
REPOSITORY=/home/ubuntu/build

cd $REPOSITORY

sudo npm
pm2 stop AuthServer
pm2 start AuthServer
# sudo pm2 start dist