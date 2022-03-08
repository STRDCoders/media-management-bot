#!/bin/bash

sudo docker build --tag media-namagement-bot .
sudo docker run --rm --network host --env-file /etc/media-management-bot/env media-namagement-bot
