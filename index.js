console.log('huh');
// create a config store ("foo.json") in the current working directory
const store = require('data-store')({path: process.cwd() + '/data.json'});

store.set('videos', ['a', 'b', 'c']);
console.log(store.data); //=> { one: 'two' }
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
