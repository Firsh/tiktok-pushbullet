# TikTok downloader via Pushbullet

Download TikTok videos you push to yourself via Pushbullet.

Please bear with me, as this is my first little practice project involving git, nodejs, npm, Axios, async/await, let/const, and stuff like that.

## What it does

1. Contacts Pushbullet API for some recent pushes.
2. Finds TikTok short URLs and expands them to web video URLs.
3. Stores these and the date of tha latest push in a JSON file.
4. Crafts a txt list of videos to download immeadiately.
5. Uses [tiktok-scraper](https://github.com/drawrowfly/tiktok-scraper)'s `from-file` mode to batch download these videos.

If you used the tool before then it only looks into pushes that happened since the last run. It keeps the download list clean. If downloads failed, they persist in the JSON until confirmed downloaded, so you don't miss any videos.

## Setup

1. Clone the repo.
2. Get a Pushbullet API access token.
3. Put it in a .env file containing `PUSHBULLET_ACCESS_TOKEN=12345`

## How to use

1. Push yourself some TikTok videos, for example, from phone to all devices.
2. Run with `node index.js` command.
3. Find your videos in the downloads folder.

You can move the finished downloads out to your regular storage place with sync tools, videos won't be re-downloaded unless you push the same thing again.
