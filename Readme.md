#Docker hickety hack

Demonstrate how to create and link containers together via Docker API.

    docker-compose up -d --build
    npm install
    npm start
    
##Test

This test shows how to start executor container and stream logs 
    
   node test.js       #same as the one below   
   node test.js 123   #have both services linked     
   node test.js 456   #has only elasticsearch service linked     
   node test.js a     #unsupported stack (no task executor container available)   
   node test.js b     #usupported dependency service (only elasticsearch and rabbitmq images are available for linking)   
   node test.js c     #no service linked   
   node test.js d     #task not found   
