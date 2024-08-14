FROM node:15

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY app ./app/
COPY bin ./bin/
COPY config ./config/
COPY routes ./routes/
COPY public ./public/
COPY main.js ./

CMD ["node", "./bin/www"]
