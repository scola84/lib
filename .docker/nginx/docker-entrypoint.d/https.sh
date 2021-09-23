#!/bin/sh

ip=$(grep -oE "https://[^;]+" /usr/share/nginx/html/index.html | sed -E 's/https:\/\///g') || '127.0.0.1'

echo "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:${ip:-localhost}\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth" > config

openssl req -x509 -out /etc/ssl/certs/localhost.crt -keyout /etc/ssl/private/localhost.key -newkey rsa:2048 -nodes -sha256 -subj "/CN=localhost" -extensions EXT -config config

rm config
