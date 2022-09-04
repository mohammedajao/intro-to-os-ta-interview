FROM node:17-alpine

RUN npm install -g nodemon

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN cd /app \
    && yarn install --pure-lockfile

COPY . .

EXPOSE 8000

CMD ["npm", "run", "start"]