FROM node:26-alpine AS build
WORKDIR /app

RUN npm install -g pnpm

ENV CI=true

COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./


RUN pnpm install
COPY . .

ARG REACT_APP_BACKEND_API_URL
ENV REACT_APP_BACKEND_API_URL=$REACT_APP_BACKEND_API_URL
ARG REACT_APP_WS_API_URL
ENV REACT_APP_WS_API_URL=$REACT_APP_WS_API_URL
RUN pnpm run build

FROM nginx AS runner

COPY docker/nginx.conf /etc/nginx/nginx.conf

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]