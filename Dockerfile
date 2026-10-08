# ---------------- Build ----------------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# The app talks to the API on the same origin (/api is proxied by nginx).
# Override at build time if you need a different API base, e.g.
#   docker build --build-arg VITE_API_URL=https://yourhost.com/api
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---------------- Serve ----------------
FROM nginx:1.27-alpine AS serve
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80