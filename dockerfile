FROM node:20-alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

ENV PORT 8000

ENV HOST 0.0.0.0

EXPOSE $PORT

CMD ["npm", "start"]
