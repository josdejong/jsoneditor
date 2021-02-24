FROM node:current-alpine AS builder
WORKDIR /opt
COPY package*.json /opt/
RUN apk add python make g++ && \
    npm install
COPY . /opt/
RUN npm run build

FROM nginx:alpine
COPY --from=builder /opt/misc/index.html /opt/dist/jsoneditor.min.js /opt/dist/jsoneditor.min.css /opt/dist/img/jsoneditor-icons.svg /usr/share/nginx/html/
EXPOSE 80
