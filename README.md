# TikTok downloader via Pushbullet

Download TikTok videos you push to yourself via Pushbullet.

As this is my first little practice project involving git, nodejs, npm, Axios, async/await, let/const, and stuff like that, please bear with me. Any contributions or suggestions are welcome. I primarily wrote this for my entertainment but decided to share. Perhaps somebody feels that it's useful.

## What it does

1. Contacts Pushbullet API for some recent pushes.
2. Finds TikTok short URLs and expands them to web video URLs.
3. Stores the URLs and the date of the last push in a JSON file.
4. Crafts a txt list of videos to download immediately.
5. Uses [tiktok-scraper](https://github.com/drawrowfly/tiktok-scraper)'s `from-file` mode to batch download these videos.

If you used the tool before, it only looks into pushes that happened since the last run. It keeps the download list clean. If downloads failed, they persist in the JSON until confirmed downloaded, so you don't miss any videos.

## Setup/Install

1. Clone the repo `git clone https://github.com/TheFirsh/tiktok-pushbullet.git`
2. Run `npm install` from inside the freshly created folder.
3. Get a Pushbullet [API Access Token](https://www.pushbullet.com/#settings/account).
4. Put it in a .env file containing `PUSHBULLET_ACCESS_TOKEN=12345`

## How to use

1. Push yourself some TikTok videos, for example, from phone to all devices.
2. Run with `node index.js` command.
3. Find your videos in the downloads folder.

You can move the finished downloads out to your regular storage place with sync tools. Videos won't be re-downloaded unless you push the same thing again.
