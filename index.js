const axios = require('axios');
const tts = require('tiktok-scraper');
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
function justTheURLs(pushes) {
    const videos = [];
    pushes.forEach((push) => {
        if ('url' in push && push.url.indexOf('tiktok') !== -1) {
            videos.push(push.url);
        }
    });
    return videos;
}
function storeURLs(URLs) {
    const store = require('data-store')({path: process.cwd() + '/data2.json'});
    URLs.forEach((URL) => {
        store.union('videos', URL);
    });
    return store;
}
function downloadVids(store) {}
async function init() {
    const response = await getPushes(0);
    const pushes = response.data.pushes;
    const lastModified = pushes.slice(-1)[0].modified;
    const videoURLs = justTheURLs(pushes);
    const store = storeURLs(videoURLs);
    const downloaded = downloadVids(store);

    console.log(lastModified);
    console.log(videoURLs);

    //const downloaded = downloadVids(videoURLs);
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
