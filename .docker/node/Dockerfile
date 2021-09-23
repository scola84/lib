FROM node:14

ARG SOURCE
LABEL org.opencontainers.image.source $SOURCE

EXPOSE 80
WORKDIR /usr/src/app

COPY ./dist /usr/src/app/dist
COPY ./package.json /usr/src/app/package.json
COPY ./yarn.lock /usr/src/app/yarn.lock

RUN yarn install --frozen-lockfile --ignore-optional --production
CMD ["node", "./dist/server/index.js"]
