'use strict';

const Promise = require('bluebird');

var Docker = require('dockerode');
var docker = new Docker();
docker = Promise.promisifyAll(docker);

function getContainerBySessionId(sessionId) {

}

var stackToImageMap = {
    'nodejs': 'realskill/task-executor-nodejs'
};
var serviceToImageMap = {
    'rabbitmq': 'rabbitmq:3.5.0',
    'elasticsearch': 'elasticsearch'
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

/**
 * POST /execution-env/{sessionId?}
 * {stack:'nodejs',services:['rabbitmq','elasticsearch'],repository:'http://gitmaster.realskill.io/123',branch:'abc',backendTaskId:357}
 */
module.exports = {
    execute: function (stack, services, repository, branch, taskId, sessionId) {
        return Promise.props({
            executorImage: getImageByStack(stack),
            services: Promise.map(services, getServiceImage)
        }).then(function (images) {
            return docker.createContainerAsync({
                image: images.executorImage,
                Env: [
                    `REPOSITORY_URL=${repository}`,
                    `BRANCH=${branch}`,
                    `TASK_ID=${taskId}`
                ]
            }).then(function (container) {
                container = Promise.promisifyAll(container);
                return container.startAsync().then(function () {
                    console.log(arguments);
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
