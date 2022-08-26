FROM node:16
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
COPY server/package*.json ./server
RUN npx lerna bootstrap
COPY server/. .
RUN npm run build
WORKDIR /usr/src/app/server
CMD npm run start:prod
