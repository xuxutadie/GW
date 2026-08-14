FROM python:3.12-alpine AS build

WORKDIR /app

COPY scripts ./scripts
COPY src ./src

RUN python scripts/build.py

FROM caddy:2-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /usr/share/caddy

EXPOSE 8080
