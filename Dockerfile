FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

COPY src ./src

RUN npm run build

EXPOSE 8080

CMD [ "node", "dist/index.js" ]
