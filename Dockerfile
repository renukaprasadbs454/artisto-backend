# backend/Dockerfile
# Multi-stage Dockerfile for building and running the Node/TypeScript backend

FROM node:20-alpine AS build
WORKDIR /app

# copy package and build config
COPY package*.json tsconfig.json prisma ./

# copy source and prisma schema
COPY src ./src
COPY prisma ./prisma

RUN npm ci --production=false
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS prod
WORKDIR /app

# copy built artifacts and node_modules
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/server.js"]
