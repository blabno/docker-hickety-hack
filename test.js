'use strict';

var $http = require('http-as-promised');
const Promise = require('bluebird');
var _ = require('lodash');

var Docker = require('dockerode');
var docker = new Docker();
docker = Promise.promisifyAll(docker);


var taskId = process.argv[2] || 123;

function hitBackend() {
    var payload = {
        paths: {
            '/src/index.js': 'console.log(123)'
        }
    };
    $http.post(`http://localhost:3000/task/${taskId}/solution`, {json: payload}).spread(function (res, body) {
        console.log(JSON.stringify(body, null, '  '));
        var request = $http.request(`http://localhost:3000/build/${body.sessionId}/logs`);
        request.on('data', function (body) {
            process.stdout.write(body);
        });
    });
}

docker.listContainersAsync({all: 1}).then(function (result) {
    //TODO also remove all container based on tas-executor-nodejs image
    _.remove(result, function (item) {
        return !_.some(['elasticsearch', 'rabbitmq'], function (serviceName) {
            return -1 < item.Names.indexOf('/' + serviceName);
        });
    });
    return Promise.map(result, function (container) {
        return Promise.promisifyAll(docker.getContainer(container.Id)).removeAsync({force: 1});
    })
}).then(hitBackend, function (err) {
    console.error(err & err.stack || err);
});
