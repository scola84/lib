FROM nginx:1.17-alpine
EXPOSE 3000

WORKDIR /tmp/nginx/
COPY ./.rollup/ ./.rollup/
COPY ./src/ ./src/
COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock
RUN yarn install
RUN yarn bundle

WORKDIR /www/nginx/
COPY /tmp/nginx/node_modules/@scola/lib/.docker/nginx/conf.d/ /etc/nginx/conf.d/
COPY /tmp/nginx/node_modules/@scola/lib/.docker/nginx/data/index.html ./index.html
COPY /tmp/nginx/node_modules/@scola/lib/dist/ ./scola/
COPY /tmp/nginx/dist/ ./app/
RUN rm -rf /tmp/nginx/
