FROM node:13

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn install

COPY . .

RUN yarn build

EXPOSE 8080

ENTRYPOINT [ "docker-entrypoint.sh" ]

CMD [ "start" ]
