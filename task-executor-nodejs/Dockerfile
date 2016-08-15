FROM readytalk/nodejs
WORKDIR /app
ENTRYPOINT ["/nodejs/bin/npm", "start"]
ADD package.json ./
RUN npm install
ADD . ./
