FROM node:4-slim
WORKDIR /app
ENTRYPOINT ["npm", "start"]
ADD package.json ./
RUN npm install
ADD . ./
