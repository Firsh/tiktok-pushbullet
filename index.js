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
        .catch((e) => {
            console.log(e);
        });
}

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

function storeLinks(store, links) {
    links.forEach((link) => {
        store.union('videoLinks', link);
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
        console.log(`Download list created for ${links.length} videos.`);
    });
}
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
async function init() {
    const store = require('data-store')({path: process.cwd() + '/data.json'});
    let lastModified = store.get('lastModified') | 0;
    const response = await getPushes(lastModified);
    const pushes = response.data.pushes;
    lastModified = pushes.length !== 0 ? pushes[0].modified : lastModified;
    store.set('lastModified', lastModified);
    const newLinks = await newVideoLinks(pushes);
    if (newLinks.length > 0) {
        storeLinks(store, newLinks);
    }
    const videoLinks = store.get('videoLinks');
    if (videoLinks.length > 0) {
        createList(videoLinks);
        const downloaded = await downloadVids();
        purgeDownloadedFromStore(downloaded, store);
    }
}
init();
