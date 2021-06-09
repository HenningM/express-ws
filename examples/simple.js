const express = require('express');
const expressWs = require('..')(express());

const app = expressWs.app;

app.use((req, res, next) => {
  console.log('middleware'); // eslint-disable-line no-console
  req.testing = 'testing';
  return next();
});

app.get('/', (req, res) => {
  console.log('get route', req.testing); // eslint-disable-line no-console
  res.end();
});

app.ws('/', (ws, req) => {
  ws.on('message', (msg) => {
    console.log(msg); // eslint-disable-line no-console
  });
  console.log('socket', req.testing); // eslint-disable-line no-console
});

app.listen(3000);
