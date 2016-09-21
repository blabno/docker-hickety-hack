'use strict';

var $http = require('http-as-promised');
const Promise = require('bluebird');
var _ = require('lodash');
var fs = require('fs');

var Docker = require('dockerode');
var ca = process.env.CA && fs.readFileSync(process.env.CA);
var cert = process.env.CERT && fs.readFileSync(process.env.CERT);
var certKey = process.env.CERT_KEY && fs.readFileSync(process.env.CERT_KEY);
var docker = new Docker({host: process.env.DOCKER_MANAGER_HOST, port: process.env.DOCKER_MANAGER_PORT, ca: ca, cert: cert, key: certKey});
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

docker.listContainersAsync({all: 1}).then(function (containers) {
    _.remove(containers, function (container) {
        var isBasedONTaskExecutorImage = 'realskill/task-executor-nodejs' === container.Image;
        var isBasedONFakeServiceImage = 'realskill/fake-service' === container.Image;
        return !(isBasedONTaskExecutorImage || isBasedONFakeServiceImage);
    });
    return Promise.map(containers, function (container) {
        return Promise.promisifyAll(docker.getContainer(container.Id)).removeAsync({force: 1});
    })
}).then(hitBackend, function (err) {
    console.error(err & err.stack || err);
});
