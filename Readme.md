#Docker hickety hack

Demonstrate how to create and link containers together via Docker API.

I assume you have `getip` script:

     #!/bin/bash
     
     if [ -z "$1" ]; then
             echo "Usage: getip wlan0" >&2
             exit 1;
     fi
     ifconfig $1 | grep 'inet ' | sed -e 's/.*inet \([0-9]\+.[0-9]\+.[0-9]\+.[0-9]\+\).*/\1/'

Make sure your docker runs with following flags:

    --registry-mirror=http://192.168.99.1:5000 --insecure-registry 192.168.99.1:5000

Substitute `192.168.99.1` with value of `getip vboxnet0`. Without it you won't be able to push images to your private registry.

First please export following env:

    export NODE_TLS_REJECT_UNAUTHORIZED=0 
    export DOCKER_MANAGER_HOST=172.18.0.1
    export DOCKER_MANAGER_PORT=4000 
    export CERTS_DIR=/home/bernard/.docker/machine/certs
    export CA=$CERTS_DIR/ca.pem 
    export CERT=$CERTS_DIR/cert.pem 
    export CERT_KEY=$CERTS_DIR/key.pem
    docker-compose up -d --build backend
    npm install

Start docker registry so that Swarm agent can pull `realskill/fake-service` image:
 
    docker run -d -p 5000:5000 --restart=always --name registry registry:2
    
Start Consul locally:

    docker run -d -p 8500:8500 --name consul progrium/consul -server -bootstrap
    
Start Swarm manager locally:
    
    docker run -d -p 4000:4000 --name manager -v $CERTS_DIR:/certs swarm manage -H :4000  --replication --advertise (getip vboxnet0):4000 --tlscacert=/certs/ca.pem --tlscert=/certs/cert.pem --tlskey=/certs/key.pem --tls consul://(getip vboxnet0):8500

Create Swarm agent node:

    docker-machine create -d virtualbox --virtualbox-memory 512 --engine-registry-mirror http://(getip vboxnet0):5000 worker

Start Swarm agent inside docker machine:

    eval (docker-machine env worker)
    docker run -d --name agent swarm join --advertise (docker-machine url worker | cut -d/ -f3) consul://(getip vboxnet0):8500

Push `fake service` and `task-executor-nodejs` image to repository

    docker-compose build
    docker tag realskill/fake-service (getip vboxnet0):5000/realskill/fake-service
    docker tag realskill/task-executor-nodejs (getip vboxnet0):5000/realskill/task-executor-nodejs
    docker push (getip vboxnet0):5000/realskill/fake-service
    docker push (getip vboxnet0):5000/realskill/task-executor-nodejs

Now you are ready do run tests

##Test

This test shows how to start executor container and stream logs 
    
   node test.js       #same as the one below   
   node test.js 123   #have both services linked     
   node test.js 456   #has only elasticsearch service linked     
   node test.js a     #unsupported stack (no task executor container available)   
   node test.js b     #usupported dependency service (only elasticsearch and rabbitmq images are available for linking)   
   node test.js c     #no service linked   
   node test.js d     #task not found   
