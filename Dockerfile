# Canto ships as static files only: the build stage produces the bundle, the runtime
# stage is a plain unprivileged nginx. No application runtime reaches production.

FROM node:20-bookworm-slim AS build

# Baked into the health payload so a release check cannot be satisfied by the
# container it is supposed to replace.
ARG CANTO_VERSION=dev

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Each build input is named explicitly so an unrelated file cannot silently change
# the released artefact.
COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
COPY scripts ./scripts
COPY public ./public

# Generates the icons, typechecks, then bundles. A type error fails the image build.
RUN npm run build
RUN printf '{"status":"ok","version":"%s"}\n' "$CANTO_VERSION" > dist/health.json

# The runtime image runs unprivileged and its document root is read-only, so the
# health payload is produced in the build stage above.
FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:8080/health || exit 1
