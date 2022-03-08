FROM node:12-buster

WORKDIR /usr/src/media-management-bot

COPY ["package.json", "package-lock.json*", "./"]

RUN npm ci
RUN npm dedupe

COPY . .

CMD ["npm", "start"]
