FROM node:16.15.0-alpine

RUN apk add --no-cache \
  bash \
  curl \
  jq

# create workspace
RUN mkdir /app \
  && chown -R node:node /app

# allow global npm installs from user node (don't do this for a prod image)
RUN chown -R node:node \
  /usr/local/lib/node_modules/ \
  /usr/local/bin/ \
  /app/

USER node
WORKDIR /app

# copy deps spec
COPY --chown=node:node package.json pnpm-lock.yaml /app/

# install global version of pnpm through npm 
RUN PM=$(cat package.json | jq -r '.packageManager') && npm i -g "$PM" 

RUN pnpm fetch

COPY --chown=node:node . /app/

RUN pnpm install --prefer-offline

