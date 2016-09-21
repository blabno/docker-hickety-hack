FROM node:4-slim
WORKDIR /app
ENTRYPOINT ["npm", "start"]
EXPOSE 3000
ADD package.json ./
RUN npm install
ADD . ./
