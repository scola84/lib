FROM node:14

ARG SOURCE
LABEL org.opencontainers.image.source $SOURCE

EXPOSE 3000
WORKDIR /node

COPY ./dist/server dist/server
COPY ./package.json .
COPY ./yarn.lock .

RUN yarn install --frozen-lockfile --production
CMD ["node", "dist/server/cjs.js"]
