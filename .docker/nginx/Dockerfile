FROM nginx:1-alpine

ARG SOURCE
LABEL org.opencontainers.image.source $SOURCE

EXPOSE 80

COPY ./dist/client.js* /usr/share/nginx/html/
COPY ./media /usr/share/nginx/html/media
COPY ./node_modules/@scola/lib/.docker/nginx/conf.d/http.conf /etc/nginx/conf.d/http.conf
COPY ./node_modules/@scola/lib/.docker/nginx/html/* /usr/share/nginx/html/
COPY ./node_modules/@scola/lib/.docker/nginx/snippets/gui.conf /etc/nginx/snippets/gui.conf
