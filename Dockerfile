FROM readytalk/nodejs
WORKDIR /app
ENTRYPOINT ["/nodejs/bin/npm", "start"]
EXPOSE 8080
ADD package.json /app/
ADD index.js /app/
