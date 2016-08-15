var $http = require('http-as-promised');

$http.get('http://unix:/var/run/docker.sock:/containers/json?all=1', {json: true}).spread(function (res, body) {
    var id = body[0].Id;

    var since = process.argv[2] || Math.floor(Date.now() / 1000);
    console.log(since);
    var http = $http.request(`http://unix:/var/run/docker.sock:/containers/${id}/logs?stdout=1&stderr=1&follow=1&since=${since}`);
    http.on('data', process.stdout.write.bind(process.stdout));
    $http.get(`http://unix:/var/run/docker.sock:/containers/${id}/changes`, {json: true}).spread(function (res, body) {
        console.log(body);
    });
});

//TODO create a container https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/create-a-container
//TODO attach to a container (websocket) https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/attach-to-a-container-websocket
//TODO wait a container https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/wait-a-container

/**
 * Container master:
 *   - manage container pool //actually we don't need any pool and actually we can't have it because what would that mean to start container without repo, and when we restart it we cannot change env
 *   - assign container to a session
 *   - remove container on demand
 *   - remove expired container
 *
 *
 */
//TODO there might be a problem with reusing service containers because their state might be changed by previous execution, i.e. default exchanges might be removed by solutions code, or oplog already triggered on a mongo

/**
 * Client asks to run for nodejs container linked to elasticSearch and rabbitmq containers:
 *   - check if we have such "container set" ready (based by session)
 *     - if not, create it
 *     - if yes, just restart
 */

/**
 * POST /execution-env/{sessionId?}
 * {stack:'nodejs',services:['rabbitmq','elasticsearch'],repository:'http://gitmaster.realskill.io/123',branch:'abc',backendTaskId:357}
 *
 * @param backendTaskId allows container to post build results back to the backend
 *
 * @returns sessionId
 *
 * If sessionId is passed then try to find existing container set. If containers are found then just restart main container. If containers are not found
 * create a new set, associate them with new unique sessionId and return that sessionId.
 *
 */

/**
 * GET /execution-env/{sessionId}/logs?since=
 *
 * Get logs from main container since some date
 */


//TODO in order to find expired containers we have to look for all containers that are not running and inspect every single one of them to see their "State.FinishedAt" date
