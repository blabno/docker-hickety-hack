#Build docker image for my/app that simulates rabbitmq and elasticsearch:

    docker build -t my/app:latest .

#Build docker image for task-executor-nodejs:
 
    cd task-executor-nodejs
    docker build -t realskill/task-executor-nodejs:latest .

#Run backend

    nodemon backend.js
    
#Test

This test shows how to start executor container and stream logs 
    
   node test.js        
   node test.js 123        
   node test.js 456        
   node test.js a        
   node test.js b        
   node test.js c        
   node test.js d        
    
