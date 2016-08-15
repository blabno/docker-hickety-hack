FROM readytalk/nodejs
WORKDIR /app
ENTRYPOINT ["/nodejs/bin/npm", "start"]
#RUN npm install
ADD package.json /app/
#CMD []
ADD index.js /app/
