# media-management-bot
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=STRDCoders_media-management-bot&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=STRDCoders_media-management-bot)
[![CI](https://github.com/STRDCoders/media-management-bot/actions/workflows/pull-request.yml/badge.svg)](https://github.com/STRDCoders/media-management-bot/actions/workflows/pull-request.yml)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=STRDCoders_media-management-bot&metric=coverage)](https://sonarcloud.io/summary/new_code?id=STRDCoders_media-management-bot)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=STRDCoders_media-management-bot&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=STRDCoders_media-management-bot)

## build & run docker:
1. Create the following file: /etc/media-management-bot/env and add all the enviorment properties as described below
2. Install docker if not installed already
3. Run ./build.sh on root dir
4. Have fun :) 

## Enviorment variables
The software requires some properties to be configured before running it:
* `ALLOWED_USERS` - A string of chat ids that are allowed to comunicate with the bot(can be obtained by running the software without this property and see in the logs the id of the unauthnticated user. Each user id should be separated by a comma. Ex. 11131,1234
* `BOT_TOKEN` - The token of the bot.
<br>To generate a new bot contact [BotFather](https://core.telegram.org/bots#6-botfather).
* `RADARR_HOST` - The host address.
<br>If you are running the bot on the same machine as "radarr", it will probably be something like: `http://127.0.0.1:7878/radarr`
* `RADARR_API_KEY` - The api of your "radarr" service.
* `SONARR_HOST` - The host address.
<br>If you are running the bot on the same machine as "sonarr", it will probably be something like: `http://127.0.0.1:8989/sonarr`
* `SONARR_API_KEY` - The api of your "sonarr" service.
### Optional
* `RADARR_QUEUE_SIZE` - The number of items returned from the queue request. Default of 100.
* `SONARR_QUEUE_SIZE` - The number of items returned from the queue request. Default of 100.
