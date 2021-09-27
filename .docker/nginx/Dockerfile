FROM nginx:1-alpine

ARG SOURCE
LABEL org.opencontainers.image.source $SOURCE

EXPOSE 80

COPY ./dist/client /usr/share/nginx/html
COPY ./node_modules/@scola/lib/.docker/nginx/conf.d/http.conf /etc/nginx/conf.d/http.conf
COPY ./node_modules/@scola/lib/.docker/nginx/snippets/gui.conf /etc/nginx/snippets/gui.conf
COPY ./node_modules/@scola/lib/.docker/nginx/nginx.conf /etc/nginx/nginx.conf
