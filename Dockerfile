FROM node:23-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --cache /tmp/npm-cache

COPY . .

CMD ["npm", "start"]