# RT-Downloader

```
  ____ _____     ____                      _                 _
 |  _ \_   _|   |  _ \  _____      ___ __ | | ___   __ _  __| | ___ _ __
 | |_) || |_____| | | |/ _ \ \ /\ / / '_ \| |/ _ \ / _` |/ _` |/ _ \ '__|
 |  _ < | |_____| |_| | (_) \ V  V /| | | | | (_) | (_| | (_| |  __/ |
 |_| \_\|_|     |____/ \___/ \_/\_/ |_| |_|_|\___/ \__,_|\__,_|\___|_|

 Download some good music.

```

## Install

`npm install -g rt-downloader`

## Setup

Run `rt-downloader` first time. (it will prepare config file with default values at `$HOME/.rt-downloader/config.json`)

Copy your `x-session-key` from headers of `di.fm` after authentication (check image below)

![where is a key](./additional/key.png 'Get key')

You can setup it manually in a config: `$HOME/.rt-downloader/config.json`.
(You have to start script at least once to config appear).

To change download folder use option `downloadLocation`. For example
```json
"downloadLocation": "z:\\MUSIC\\Radio", 
```

## Clear cache

Clear cache with a command

```
rt-downloader -c
```
