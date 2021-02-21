const axios = require('axios');
const tts = require('tiktok-scraper');
const fs = require('fs');
require('dotenv').config();

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
        .catch(function (error) {
            // handle error
            console.log(error);
        });
}
async function justTheLinks(pushes) {
    const shortVideoURLs = [];
    pushes.forEach((push) => {
        if ('url' in push && push.url.indexOf('tiktok') !== -1) {
            shortVideoURLs.push(push.url);
        }
    });
    const results = await Promise.all(shortVideoURLs.map(getFromTikTok));
    const webVideoURLs = [];
    results.forEach((result) => {
        if (!result.success) {
            return;
        }
        const responseUrl = new URL(result.response.request.res.responseUrl);
        webVideoURLs.push(responseUrl.toString().replace(responseUrl.search, ''));
    });
    return webVideoURLs;
}

function getFromTikTok(URL) {
    return axios
        .get(URL, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.99 Safari/537.36',
            },
        })
        .then(function (response) {
            return {
                success: true,
                response: response,
            };
        })
        .catch(function (error) {
            return {success: false};
        });
}
function storeLinks(store, links) {
    links.forEach((link) => {
        store.union('videos', link);
    });
    return store;
}
async function downloadVids() {
    return await tts.fromfile('list.txt', {
        download: true,
        hdVideo: true,
        filepath: process.cwd() + '/downloads/',
    });
}
function createList(links) {
    const joined = links.join('\r\n');
    fs.writeFile('list.txt', joined, function (err) {
        if (err) return console.log(err);
        console.log('List written');
        console.log(joined);
    });
}
function purgeDownloadedFromStore(downloaded, store) {}
async function init() {
    const store = require('data-store')({path: process.cwd() + '/data.json'});
    let lastModified = store.get('lastModified') | 0;
    const response = await getPushes(lastModified);
    const pushes = response.data.pushes;
    lastModified = pushes.slice(-1)[0].modified;
    const videoLinks = await justTheLinks(pushes);
    storeLinks(store, videoLinks);
    store.set('lastModified', lastModified);
    createList(videoLinks);
    const downloaded = downloadVids();
    purgeDownloadedFromStore(downloaded, store);
    console.log(store.data);
}
init();
