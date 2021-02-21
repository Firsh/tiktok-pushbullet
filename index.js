const axios = require('axios');
const tts = require('tiktok-scraper');
const fs = require('fs');
require('dotenv').config();
/**
 * Get the latest pushes from Pushbullet, after a certain time.
 * @param {*} modifiedAfter A timestamp of the most recent push, or 0 if it's the first run.
 * @returns {Object} axios response
 */
async function getPushes(modifiedAfter) {
    return await axios
        .get('https://api.pushbullet.com/v2/pushes', {
            params: {
                active: true,
                modified_after: modifiedAfter,
            },
            headers: {
                'Access-Token': process.env.PUSHBULLET_ACCESS_TOKEN,
            },
        })
        .catch((e) => {
            console.log(e);
        });
}
/**
 * Get the "real" TikTok URL that expands upon the short URL, by following the redirect.
 * @param {*} URL A short ("share-style") TikTok URL, such as https://vm.tiktok.com/whatever/
 * @returns {Object} axios response
 */
async function getFromTikTok(URL) {
    return axios
        .get(URL, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.99 Safari/537.36',
            },
        })
        .then((response) => {
            return {
                success: true,
                response: response,
            };
        })
        .catch((e) => {
            return {success: false};
        });
}
/**
 * Create a list of full TikTok video URLs, if any are found in the current batch of pushes.
 * @param {Object} pushes The pushes object from the PushBullet API response.
 * @returns {Array} List of TikTok web video URLs found in the current batch.
 */
async function newVideoLinks(pushes) {
    const shortVideoURLs = [];
    pushes.forEach((push) => {
        if ('url' in push && push.url.indexOf('tiktok') !== -1) {
            shortVideoURLs.push(push.url);
        }
    });
    const results = await Promise.all(shortVideoURLs.map(getFromTikTok));
    const webVideoURLs = [];
    results.forEach((result) => {
        if (result.success) {
            const responseUrl = new URL(result.response.request.res.responseUrl);
            webVideoURLs.push(responseUrl.toString().replace(responseUrl.search, ''));
        }
    });
    if (webVideoURLs.length > 0) {
        console.log('New video URLs:');
        console.log(webVideoURLs);
    } else {
        console.log('No new video URLs.');
    }
    return webVideoURLs;
}
/**
 * Puts the list of videos into the JSON data-store.
 * @param {Object} store The data-store.
 * @param {Array} links List of TikTok web video URLs.
 * @returns {Object} Maybe modified data-store.
 */
function storeLinks(store, links) {
    links.forEach((link) => {
        store.union('videoLinks', link);
    });
    return store;
}
/**
 * Creates a simple txt file that is a list of videos, for tiktok-scraper.
 * @param {Array} links Links to videos to download.
 */
function createList(links) {
    const joined = links.join('\r\n');
    fs.writeFile('list.txt', joined, function (err) {
        if (err) return console.log(err);
        console.log(`Download list created for ${links.length} videos.`);
    });
}
/**
 * Empties the txt file that is used by tiktok-scraper.
 */
function purgeList() {
    fs.writeFile('list.txt', '', function (err) {
        if (err) return console.log(err);
    });
}
/**
 * Calls tiktok-scraper's fromfile mode, and gives it the txt list.
 * @returns {Object} A table containing the successfully downloaded videos.
 */
async function downloadVids() {
    return await tts.fromfile('list.txt', {
        download: true,
        hdVideo: true,
        filepath: process.cwd() + '/downloads/',
    });
}
/**
 * Matches downloaded video URLs to those in the JSON data-store, and removes those that were successfully downloaded.
 * @param {Object} downloaded The object tiktok-scraper created after the downloading, with a table of downloaded videos.
 * @param {Object} store The data-store.
 */
function purgeDownloadedFromStore(downloaded, store) {
    const videoLinks = store.get('videoLinks');
    downloaded.table.forEach((video) => {
        const index = videoLinks.indexOf(video.input);
        if (video.completed && index !== -1) {
            videoLinks.splice(index, 1);
        }
    });
    store.set('videoLinks', videoLinks);
}
/**
 * Main function to control the script.
 */
async function init() {
    const store = require('data-store')({path: process.cwd() + '/data.json'});
    let lastModified = store.get('lastModified') | 0;
    //  Start by getting the pushes
    const response = await getPushes(lastModified);
    const pushes = response.data.pushes;
    lastModified = pushes.length !== 0 ? pushes[0].modified : lastModified;
    store.set('lastModified', lastModified);
    // Find the new videos (it DOES need the await)
    const newLinks = await newVideoLinks(pushes);
    if (newLinks.length > 0) {
        storeLinks(store, newLinks);
    }
    // Make use of all existing video links to download
    const videoLinks = store.get('videoLinks');
    if (videoLinks.length > 0) {
        createList(videoLinks);
        const downloaded = await downloadVids();
        purgeDownloadedFromStore(downloaded, store);
        purgeList();
    }
}
init();
