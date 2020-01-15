FROM node:13-alpine

WORKDIR /www/nodejs/
COPY ./src/ ./src/
COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock
RUN yarn install --prod
CMD yarn start
