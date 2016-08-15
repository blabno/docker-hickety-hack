'use strict';

const Hapi = require('hapi');
const Joi = require('joi');
const Boom = require('boom');
const Promise = require('bluebird');
const mainExecutor = require('./mainExecutor');

var tasks = {
    123: {
        id: 123,
        stack: 'nodejs',
        services: ['rabbitmq', 'elasticsearch'],
        repository: 'http://gitmaster.realskill.io/123',
        branch: 'task1'
    }
};
function commitChanges() {
    return Promise.resolve();
    //return Promise.reject(new Error('Siall'));
}
function getTask(id) {
    var task = tasks[id];
    if (!task) {
        return Promise.reject('Task not found: ' + id);
    }
    return Promise.resolve(task);
}

const server = new Hapi.Server();
server.connection({port: 3000});

server.route({
    method: 'POST',
    path: '/task/{taskId}/solution',
    config: {
        validate: {
            payload: {
                paths: Joi.object().pattern(/.*/, Joi.string())
            }
        }
    },
    handler: function (request, reply) {
        console.log(JSON.stringify(request.payload, null, '  '));
        commitChanges(request.payload.paths).then(function () {
            return getTask(request.params.taskId);
        }).then(function (task) {
            return mainExecutor.execute(task.stack, task.services, task.repository, task.branch, task.id);
        }).then(function (sessionId) {
            reply({sessionId: sessionId});
        }).catch(function (err) {
            console.error(err && err.stack || err);
            reply(Boom.wrap(err));
        });
    }
});
server.route({
    method: 'GET',
    path: '/build/{id}/logs',
    config: {
        validate: {
            params: {
                id: Joi.string().required()
            }
        }
    },
    handler: function (request, reply) {
        return mainExecutor.logs(request.params.id).then(function (result) {
            reply(result)
        }).catch(function (err) {
            console.error(err && err.stack || err);
            reply(Boom.wrap(err));
        });
    }
});


server.start((err) => {

    if (err) {
        throw err;
    }
    console.info('Server running at:', server.info.uri);
});
