FROM node:24
LABEL authors="jared.scott@variable.team"

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /src/

WORKDIR /src/

RUN pnpm install --frozen-lockfile

COPY ./ /src/
