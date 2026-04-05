FROM node:22-slim AS base
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production=false

COPY . .

EXPOSE 3847
ENV PORT=3847

CMD ["npx", "tsx", "src/index.ts"]
