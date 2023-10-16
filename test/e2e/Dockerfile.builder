FROM ehyland/node-auto:debian-12 as base

# install node
COPY --chown=app:app .nvmrc ./
RUN /docker/setup-env.sh

# install deps
COPY --chown=app:app . .
RUN --mount=type=cache,uid=1000,gid=1000,id=pnpm,target=/home/app/.pnpm \
  pnpm install --prefer-offline
