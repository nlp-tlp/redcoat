# Build the react app into the /build folder
FROM node:16.0.0-alpine as builder

WORKDIR /client

RUN rm -rf /client/node_nodules

COPY client/package*.json ./

RUN npm install

COPY client/public ./public/
COPY client/src ./src/
COPY client/jsconfig.json ./

ARG SERVER_HOST
ENV REACT_APP_SERVER_HOST $SERVER_HOST

RUN npm run build


# Copy all the files from builder into the server's public folder,
# then run the server
FROM node:15 as runner

WORKDIR /app

# Copy the built React app into the public directory
COPY --from=builder /client/build ./public
COPY --from=builder /client/build/index.html ./public/app.html

WORKDIR /app

COPY server/package.json ./

RUN npm install

COPY server/app ./app/
COPY server/bin ./bin/
COPY server/config ./config/
COPY server/routes ./routes/
COPY server/public/files ./public/files
COPY server/public/javascripts ./public/javascripts
COPY server/main.js ./

CMD ["node", "./bin/www"]
