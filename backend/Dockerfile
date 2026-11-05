# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Strapi 5 production image, run on Lambda via the AWS Lambda Web Adapter.
#
# The adapter turns the Lambda invoke into a normal HTTP request against the
# server listening on $PORT, so Strapi itself stays unmodified and the same
# image runs locally with `docker run -p 1337:1337`.
#
# Build:  docker build --platform linux/amd64 -f backend/Dockerfile backend
# ---------------------------------------------------------------------------

FROM node:22-bookworm-slim AS build

# sharp (image thumbnails) needs these at install time on slim images.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 build-essential libvips-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# The admin bundle is compiled at build time so the container starts fast.
# NODE_ENV=production keeps the production config branch.
ENV NODE_ENV=production
RUN npm run build

# Drop dev dependencies from the tree that gets copied into the runtime image.
RUN npm prune --omit=dev


FROM node:22-bookworm-slim AS runtime

# The adapter runs as a Lambda extension. Outside Lambda it is simply unused.
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 \
     /lambda-adapter /opt/extensions/lambda-adapter

RUN apt-get update \
    && apt-get install -y --no-install-recommends libvips42 tini \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=1337 \
    AWS_LWA_READINESS_CHECK_PATH=/_health

WORKDIR /app

# Run unprivileged. The node image already ships a `node` user.
COPY --from=build --chown=node:node /app ./

USER node

EXPOSE 1337

# tini reaps zombies and forwards SIGTERM so the runtime shuts down cleanly.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["npm", "run", "start"]
