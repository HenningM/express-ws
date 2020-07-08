const express = require('express');
let expressWs = require('..');

expressWs = expressWs(express());
const { app } = expressWs;

app.param('world', (req, res, next, world) => {
  req.world = world || 'world';
  return next();
});

app.get('/hello/:world', (req, res, next) => {
  console.log('hello', req.world);
  res.end();
  next();
});

app.ws('/hello/:world', (ws, req, next) => {
  ws.on('message', (msg) => {
    console.log(msg);
  });
  console.log('socket hello', req.world);
  next();
});

app.listen(3000);
