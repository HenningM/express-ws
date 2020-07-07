const express = require('express');
let expressWs = require('..');

expressWs = expressWs(express());
const app = expressWs.app;

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

app.listen(3000);
