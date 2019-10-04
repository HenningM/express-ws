const express = require('express');
const expressWs = require('..')(express());

const app = expressWs.app;

app.param('world', (req, res, next, world) => {
  req.world = world || 'world';
  return next();
});

app.get('/hello/:world', (req, res, next) => {
  console.log('hello', req.world); // eslint-disable-line no-console
  res.end();
  next();
});

app.ws('/hello/:world', (ws, req, next) => {
  ws.on('message', (msg) => {
    console.log(msg); // eslint-disable-line no-console
  });
  console.log('socket hello', req.world); // eslint-disable-line no-console
  next();
});

app.listen(3000);
