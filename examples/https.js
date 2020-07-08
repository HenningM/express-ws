const https = require('https');
const fs = require('fs');

const express = require('express');
const expressWs = require('..');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};
const app = express();
const server = https.createServer(options, app);
expressWs(app, server);

app.use((req, res, next) => {
  console.log('middleware');
  req.testing = 'testing';
  return next();
});

app.get('/', (req, res /* , next */) => {
  console.log('get route', req.testing);
  res.end();
});

app.ws('/', (ws, req) => {
  ws.on('message', (msg) => {
    console.log(msg);
  });
  console.log('socket', req.testing);
});

server.listen(3000);
