'use strict';

var Promise = require('bluebird');

function rubishSimulation() {
    console.log(require('fs').readFileSync('/etc/hosts').toString());

    require('http').get({
        hostname: 'elasticsearch',
        port: 8080,
        path: '/',
        agent: false  // create a new agent just for this one request
    }, function (res) {
        res.on('data', function (data) {
            console.log('data from elasticsearch:', data.toString());
        })
    }).on('error', function (e) {
        console.log('cannot hit elasticsearch', e);
    });
    require('http').get({
        hostname: 'rabbitmq',
        port: 8080,
        path: '/',
        agent: false  // create a new agent just for this one request
    }, function (res) {
        res.on('data', function (data) {
            console.log('data from rabbitmq:', data.toString());
        })
    }).on('error', function (e) {
        console.log('cannot hit rabbitmq', e);
    });
}

function checkIfSourceCodeAlreadyCloned() {
    console.log('Check if source code already cloned...');
    return Promise.resolve(Math.random() > .5);
}

function resetToRemoteBranch() {
    console.log('Reseting to remote branch...', process.env.REPOSITORY_URL, process.env.BRANCH);
    return Promise.resolve();
}

function cloneOrigin() {
    console.info('Cloning origin...', process.env.REPOSITORY_URL, process.env.BRANCH);
    return Promise.resolve();
}

function runTests() {
    console.info('Run tests...');
    rubishSimulation();
    return Promise.delay(5000 * Math.random());
}

function runStaticAnalysis() {
    console.info('Run static analysis...');
    return Promise.delay(5000 * Math.random());
}

function runMutationTests() {
    console.info('Run mutation tests...');
    return Promise.resolve();
}

function gatherReportsAndPostToTheBackend() {
    console.info('Gathering reports and posting to backend...', process.env.TASK_ID);
    return Promise.resolve();
}

checkIfSourceCodeAlreadyCloned().then(function (sourceCodeAlreadyCloned) {
    if (sourceCodeAlreadyCloned) {
        return resetToRemoteBranch();
    } else {
        return cloneOrigin();
    }
}).then(function () {
    return Promise.all([
        runTests(),
        runStaticAnalysis(),
        runMutationTests()
    ]);
}).then(gatherReportsAndPostToTheBackend);
