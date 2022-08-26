FROM node:16
WORKDIR /usr/src/app
COPY package.json package-lock.json lerna.json ./
COPY server/package*.json ./server/
RUN npx lerna bootstrap
COPY server/ ./server/
WORKDIR /usr/src/app/server
RUN npm run build
CMD npm run start:prod
