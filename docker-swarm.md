#Try creating swarm master without discovery backend

	docker-machine create -d virtualbox manager0

Docker machine node is separate virtualbox instance, but it exposes it's docker port, so we just need to tell our docker client to connect to that host.

	docker-machine env manager0
	eval (docker-machine env manager0)

	#following is not enough
	docker run -d -p 4000:4000 --name manager swarm manage -H :4000

Notice that above container exits immediately

	docker logs manager
	time="2016-08-20T22:08:33Z" level=fatal msg="discovery required to manage a cluster. See 'swarm manage --help'." 

*Conclusion* Swarm needs some discovery backend


#Create nodes with docker machine

We need:
* Consul for discovery
* Swarm master
* Swarm nodes

But it will be handy to use docker mirror

##Docker mirror

	docker-machine create -d virtualbox registry
	docker-machine ssh registry

	mkdir ~/.docker/registry
	docker run -d -p 5000:5000 --name registry -v ~/.docker/registry:/var/lib/registry registry
	docker exec -it registry cat /etc/docker/registry/config.yml > ~/.docker/registry/config.yml
	echo "proxy:" >> ~/.docker/registry/config.yml
	echo "  remoteurl: https://registry-1.docker.io" >> ~/.docker/registry/config.yml
	docker rm -f registry
	docker run -d -p 5000:5000 --name registry -v ~/.docker/registry:/var/lib/registry -v ~/.docker/registry:/etc/docker/registry registry

If you run

	docker logs registry

It should contain somethin like this;

	Registry configured as a proxy cache to...
	

##Consul
	docker-machine create -d virtualbox --engine-registry-mirror http://(docker-machine ip registry):5000 consul0
	eval (docker-machine env consul0)
	docker run -d -p 8500:8500 --name consul progrium/consul -server -bootstrap
	docker logs -f consul

##Swarm master
Open new terminal

	docker-machine create -d virtualbox --engine-registry-mirror http://(docker-machine ip registry):5000 manager0
	eval (docker-machine env manager0)
	docker run -d -p 4000:4000 --name manager -v /var/lib/boot2docker:/var/lib/boot2docker swarm manage --tlsverify --tlscacert=/var/lib/boot2docker/ca.pem --tlscert=/var/lib/boot2docker/server.pem --tlskey=/var/lib/boot2docker/server-key.pem -H :4000  --replication --advertise (docker-machine ip manager0):4000 consul://(docker-machine ip consul0):8500
	docker logs -f manager

##Swarm nodes
Open new terminal

	docker-machine create -d virtualbox --engine-registry-mirror http://(docker-machine ip registry):5000 agent0
	eval (docker-machine env agent0)
	docker run -d --name agent swarm join --advertise=(docker-machine url agent0 | cut -d/ -f3) consul://(docker-machine ip consul0):8500
	docker logs -f agent

Open new terminal

	docker-machine create -d virtualbox --engine-registry-mirror http://(docker-machine ip registry):5000 agent1
	eval (docker-machine env agent1)
	docker run -d --name agent swarm join --advertise=(docker-machine url agent1 | cut -d/ -f3) consul://(docker-machine ip consul0):8500
	docker logs -f agent

##Let's execute some real work
Got to terminal with manager or


	set -x DOCKER_HOST (docker-machine ip manager0):4000
	docker run busybox echo Hello World
	docker ps -a
	docker run busybox echo Hello World
	docker ps -a


#Provision docker machines in swarm mode

	docker-machine create -d virtualbox --virtualbox-memory 512 --engine-registry-mirror http://(docker-machine ip registry):5000 --swarm --swarm-master --swarm-discovery consul://(docker-machine ip consul0):8500 manager0
	docker-machine create -d virtualbox --virtualbox-memory 512 --engine-registry-mirror http://(docker-machine ip registry):5000 --swarm --swarm-discovery consul://(docker-machine ip consul0):8500 agent0
	docker-machine create -d virtualbox --virtualbox-memory 512 --engine-registry-mirror http://(docker-machine ip registry):5000 --swarm --swarm-discovery consul://(docker-machine ip consul0):8500 agent1


Notice the difference between those two invocations:

	docker-machine env manager0
	docker-machine env --swarm manager0

	Following allows you to connect to swarm without that DOCKER_HOST with strange 4000 port export
	eval (docker-machine env --swarm manager0)
	
#Trivia
When you restart docker machine, then docker containers will not start automatically. To change that execute:

    docker update --restart unless-stopped registry
    
or

    docker update --restart always registry
    
Unfortunately when docker machine starts it gets automatically assigned IP and it might be different between restarts, which may kill communication between
docker containers

#This will not work:
	docker-machine create -d virtualbox --swarm-master --swarm-discovery consul://(docker-machine ip consul0):8500 jogi

I wanted to create docker machine with just swarm master, without swarm node, but --swarm is required. I mean, above command works, but following won't work:
docker-machine env --swarm jogi


