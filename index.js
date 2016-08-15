var http = require('http');
var fs = require('fs');
http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello');
}).listen(8080);
console.info('listening on port 8080');

/**
 * Code below proves that container holds filesystem changes between restarts
 */

var i = 0;
var maxI = process.env.i || 5;

function doSomething() {
    console.log('Some logs...', i++);
    if (i < maxI) {
        setTimeout(doSomething, 500);
    }
}

console.log(JSON.stringify(process.env, null, '  '))

doSomething();

var data;
try {
    data = require('./data.json');
    console.log('found data.json', JSON.stringify(data, null, '  '));
} catch (e) {
    console.log('No data.json file found');
}

data = {timestamp: Date.now()};

fs.writeFileSync('data.json', JSON.stringify(data));
