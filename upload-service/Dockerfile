FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

# Install git
RUN apt-get update && apt-get install -y git && apt-get clean

COPY . .
RUN npm run build

EXPOSE 80

CMD ["node", "dist/index.js"]