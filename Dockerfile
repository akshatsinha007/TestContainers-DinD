FROM node:23-alpine

RUN apk add --no-cache docker-cli docker-compose

WORKDIR /app

COPY package*.json ./

RUN npm ci --cache /tmp/npm-cache

COPY . .

RUN dockerd &

RUN sleep 20

VOLUME /var/run/docker.sock

RUN npm test

RUN npm run build

CMD ["npm", "start"]