FROM nginx:1-alpine

ARG SOURCE
LABEL org.opencontainers.image.source $SOURCE

EXPOSE 80

COPY ./dist/client /usr/share/nginx/html
COPY ./node_modules/@scola/lib/.docker/nginx/etc/nginx/nginx.conf /etc/nginx/nginx.conf
