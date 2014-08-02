#!/usr/bin/env node

var express = require('express');

var expressWs = require('..')


var app = expressWs(express());

app.listen(3000)


app.use(function (req, res, next) {
  console.log('middleware');
  req.testing = 'testing';
  return next();
});


app.get('/', function(req, res, next){
  console.log('get route', req.testing);
  res.end();
});

app.ws('/', function(ws, req) {
  ws.on('message', function(msg) {
    console.log(msg);
  });
  console.log('socket', req.testing);
});
