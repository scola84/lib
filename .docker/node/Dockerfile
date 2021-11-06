FROM node:14

ARG SOURCE
LABEL org.opencontainers.image.source $SOURCE

EXPOSE 80
WORKDIR /usr/src/app

COPY ./dist /usr/src/app/dist
COPY ./package.json /usr/src/app/package.json
COPY ./package-lock.json /usr/src/app/package-lock.json

RUN npm ci
CMD ["node", "./dist/server/index.js"]
