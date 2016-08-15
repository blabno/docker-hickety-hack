'use strict';

var $http = require('http-as-promised');

var payload = {
    paths: {
        '/src/index.js': 'console.log(123)'
    }
};
$http.post('http://localhost:3000/task/123/solution', {json: payload}).spread(function (res, body) {
    console.log(JSON.stringify(body, null, '  '))
    var request = $http.request(`http://localhost:3000/build/${body.sessionId}/logs`);
    request.on('data', function (body) {
        process.stdout.write(body);
    });
});
