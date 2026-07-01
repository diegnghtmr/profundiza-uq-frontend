# Multi-stage build for the Profundiza UQ frontend.
# Stage 1 builds the static bundle; stage 2 serves it with Nginx, which also
# reverse-proxies /api to the backend so the session cookie stays same-origin
# (no CORS needed).
FROM node:22-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@11
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
