FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --verbose

COPY . .

RUN npm run build

EXPOSE 8080

CMD [ "node", "dist/index.js" ]
