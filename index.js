const axios = require('axios');
const tts = require('tiktok-scraper');
const fs = require('fs');

require('dotenv').config();
/*
curl --header 'Access-Token: <your_access_token_here>' \
     --data-urlencode active="true" \
     --data-urlencode modified_after="1.4e+09" \
     --get \
     https://api.pushbullet.com/v2/pushes
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
function downloadVids(store) {}
function createList(links) {
    const joined = links.join('\r\n');
    fs.writeFile('list.txt', joined, function (err) {
        if (err) return console.log(err);
        console.log('List written');
        console.log(joined);
    });
}
async function init() {
    const store = require('data-store')({path: process.cwd() + '/data.json'});
    const response = await getPushes(0);
    const pushes = response.data.pushes;
    const lastModified = pushes.slice(-1)[0].modified;
    const videoLinks = await justTheLinks(pushes);

    storeLinks(store, videoLinks);

    createList(videoLinks);
    const download = await tts.fromfile('list.txt', {
        download: true,
        hdVideo: true,
        filepath: process.cwd() + '/downloads/',
    });
    console.log(download);
    store.set('lastModified', lastModified);

    //const finalVideoLinks = finalVideoLinks(store);
    //const downloaded = downloadVids(store);

    //console.log(lastModified);
    //console.log(videoLinks);

    //const downloaded = downloadVids(videoLinks);
}
init();
// create a config store ("foo.json") in the current working directory

//store.set('lastmod', 35165489491);
//let vids = store.get('videos');
//vids.pop();
//store.set('videos', vids);
//console.log(store.data); //=> { one: 'two' }
/*
store.set('x.y.z', 'boom!');
store.set({ c: 'd' });
 
console.log(store.get('e.f'));
//=> 'g'
 
console.log(store.get());
//=> { name: 'app', data: { a: 'b', c: 'd', e: { f: 'g' } } }
 
console.log(store.data);
*/
//=> { a: 'b', c: 'd', e: { f: 'g' } }
