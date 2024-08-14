# Build the react app
FROM node:16.0.0-alpine as builder

WORKDIR /app

RUN rm -rf /app/node_nodules

COPY package*.json .

RUN npm install

COPY public ./public/
COPY src ./src/
COPY jsconfig.json .

RUN npm run build


# Host the client
FROM nginx:1.19.0

WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

COPY --from=builder /app/build .

EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]