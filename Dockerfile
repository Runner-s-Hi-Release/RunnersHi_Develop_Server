FROM node

WORKDIR /src
COPY ./runnershi /src

RUN cd /src && npm install

RUN npm install -g pm2

EXPOSE 3000

CMD ["pm2", "start", "./bin/www"]