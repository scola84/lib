FROM nginx:1-alpine

ARG SOURCE
LABEL org.opencontainers.image.source $SOURCE

EXPOSE 3000
WORKDIR /nginx

COPY ./node_modules/@scola/lib/.docker/nginx/conf.d /etc/nginx/conf.d
COPY ./node_modules/@scola/lib/.docker/nginx/snippets/gui.conf /etc/nginx/snippets/gui.conf
COPY ./node_modules/@scola/lib/.docker/nginx/www .
COPY ./dist/client dist/client
