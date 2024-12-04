FROM node:20-alpine

RUN apk add --no-cache docker-cli docker-compose

WORKDIR /app

COPY package*.json ./

RUN npm ci --cache /tmp/npm-cache

COPY . .

RUN npm test

RUN npm run build

CMD ["npm", "start"]