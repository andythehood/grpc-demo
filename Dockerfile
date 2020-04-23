FROM node:10

WORKDIR /app
COPY package*.json ./

RUN npm install

COPY . .
ENTRYPOINT []

EXPOSE 50051
CMD ["npm", "start"]