#!/bin/bash
REPOSITORY=/home/ubuntu/build

cd $REPOSITORY

sudo npm
pm2 stop InGameServer
pm2 start InGameServer
# sudo pm2 start dist