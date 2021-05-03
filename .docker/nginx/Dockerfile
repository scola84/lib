FROM nginx:1-alpine

ARG SOURCE
LABEL org.opencontainers.image.source $SOURCE

EXPOSE 3000

COPY ./node_modules/@scola/lib/.docker/nginx/conf.d /etc/nginx/conf.d
COPY ./node_modules/@scola/lib/.docker/nginx/snippets/gui.conf /etc/nginx/snippets/gui.conf
COPY ./node_modules/@scola/lib/.docker/nginx/html/index.html /usr/share/nginx/html/index.html
COPY ./dist/client /usr/share/nginx/html/dist/client
