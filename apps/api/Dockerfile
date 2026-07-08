# apps/api/Dockerfile
FROM node:22.12-alpine AS base
WORKDIR /repo

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run db:generate -w apps/api
RUN npm run build -w packages/shared
RUN npm run build -w apps/api

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/packages/shared/dist ./packages/shared/dist
COPY --from=build /repo/packages/shared/package.json ./packages/shared/package.json
COPY apps/api/docker-entrypoint.sh /repo/docker-entrypoint.sh
RUN chmod +x /repo/docker-entrypoint.sh

WORKDIR /repo/apps/api
ENV LOCAL_STORAGE_ROOT=/repo/apps/api/storage/uploads
EXPOSE 3000
ENTRYPOINT ["/repo/docker-entrypoint.sh"]
