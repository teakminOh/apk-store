FROM node:24-bookworm AS web-build
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web ./
RUN npm run build

FROM node:24-bookworm AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server ./
RUN npm run build
RUN npm prune --omit=dev

FROM node:24-bookworm-slim
ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV PUBLIC_DIR=/app/public
ENV PORT=8080
WORKDIR /app
COPY --from=server-build /app/server/package*.json ./server/
COPY --from=server-build /app/server/node_modules ./server/node_modules
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=web-build /app/web/dist ./public
RUN mkdir -p /data/apks
EXPOSE 8080
CMD ["node", "server/dist/index.js"]
