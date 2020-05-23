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

## Usage

- Run `rt-downloader` after install.

- Copy your `x-session-key` from headers of `di.fm` after authentication (check image below)

![where is a key](./additional/key.png 'Get key')

Or setup it manually in a config: `$HOME/.rt-downloader/config.json`.
(You have to start script at least once to config appear)

- Follow the on-screen instructions.

## Clear cache

Clear cache with a command

```
rt-downloader -c
```
