FROM node:20
LABEL authors="jared.scott@variable.team"

COPY ./ /src/

WORKDIR /src/

RUN npm install
