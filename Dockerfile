FROM debian:latest

RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 8023

CMD ["node", "server.js"]
