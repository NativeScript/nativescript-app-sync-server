#Dockerfile
FROM node:14.17 as base
WORKDIR /usr
COPY /package*.json ./
RUN npm install --no-optional && npm cache clean --force
RUN npm i -g sequelize sequelize-cli
COPY ./ ./

#dev we don't COPY in this stage because for dev you'll bind-mount anyway
FROM base as dev
ENV NODE_ENV=development
RUN npm install --only=development

FROM base as prod
WORKDIR /usr
RUN npm run build
RUN rm -rf src
ENV NODE_ENV=production

CMD [ "node", "dist/server.js" ]
