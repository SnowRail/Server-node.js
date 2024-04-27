#!/bin/bash
REPOSITORY=/home/ubuntu/build

cd $REPOSITORY
touch before-deploy-log
echo before-deploy.sh run >> before-deploy-log
cat before-deploy-log