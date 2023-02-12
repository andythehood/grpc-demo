FROM node:16-alpine

WORKDIR /app
COPY package*.json ./

RUN npm install

COPY . .
ENTRYPOINT []

EXPOSE 50051
CMD ["npm", "start"]