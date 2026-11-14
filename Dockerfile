FROM node:22.23.5-alpine3.24 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --quiet

COPY . .
RUN npm run build \
  && find dist -type f \( -name '*.js' -o -name '*.css' -o -name '*.svg' -o -name '*.html' -o -name '*.json' \) -exec gzip -9 -k {} \;

FROM nginx/nginx-unprivileged:1.30.6-alpine3.24 AS runtime

WORKDIR /usr/share/nginx/html

COPY deploy/pi/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist ./

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
