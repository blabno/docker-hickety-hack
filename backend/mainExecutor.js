'use strict';

const Promise = require('bluebird');
const _ = require('lodash');

var fs = require('fs');
var Docker = require('dockerode');
var ca = process.env.CA && fs.readFileSync(process.env.CA);
var cert = process.env.CERT && fs.readFileSync(process.env.CERT);
var certKey = process.env.CERT_KEY && fs.readFileSync(process.env.CERT_KEY);
var docker = new Docker({host: process.env.DOCKER_HOST, port: process.env.DOCKER_PORT, ca: ca, cert: cert, key: certKey});
docker = Promise.promisifyAll(docker);

var stackToImageMap = {
    'nodejs': 'realskill/task-executor-nodejs'
};
var serviceToImageMap = {
    'rabbitmq': 'realskill/fake-service',
    'elasticsearch': 'realskill/fake-service'
};

function getImageByStack(stack) {
    var image = stackToImageMap[stack];
    if (!image) {
        return Promise.reject(new Error('Unsupporte stack: ' + stack));
    }
    return Promise.resolve(image);
}

function getServiceImage(service) {
    var image = serviceToImageMap[service];
    if (!image) {
        return Promise.reject(new Error('Unsupporte service: ' + service));
    }
    return Promise.resolve(image);
}

function createAndStartServiceContainer(image) {
    return docker.createContainerAsync({
        image: image
    }).then(function (container) {
        return Promise.promisifyAll(container).startAsync().then(function () {
            return container.id;
        });
    });
}

module.exports = {
    execute: function (stack, services, repository, branch, taskId) {
        services = (services || []).reduce(function (acc, item) {
            acc[item] = item;
            return acc;
        }, {});
        return Promise.props({
            executorImage: getImageByStack(stack),
            services: _.mapValues(services, getServiceImage)
        }).then(function (images) {
            return Promise.props(images.services).then(function (services) {
                return _.mapValues(services, createAndStartServiceContainer)
            }).props().then(function (services) {
                var request = {
                    image: images.executorImage,
                    Env: [
                        `REPOSITORY_URL=${repository}`,
                        `BRANCH=${branch}`,
                        `TASK_ID=${taskId}`
                    ],
                    HostConfig: {
                        Links: _.map(services, function (container, service) {
                            return `${container}:${service}`
                        }),
                        NetworkMode: 'default'
                    }
                };
                return docker.createContainerAsync(request)
            }).then(function (container) {
                container = Promise.promisifyAll(container);
                return container.startAsync().then(function () {
                    return container.id;
                });
            });
        });
    },
    logs: function (containerId) {
        var container = Promise.promisifyAll(docker.getContainer(containerId));
        return container.logsAsync({stdout: 1, stderr: 1, follow: 1})
    }
};
