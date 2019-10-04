var express = require('express');
var expressWs = require('..');

var expressWs = expressWs(express());
var app = expressWs.app;

app.ws('/broadcast', function(ws, req) {
});
var wss = expressWs.getWss();

setInterval(function () {
  // Note that these messages will be sent to all clients.
  wss.clients.forEach(function (client) {
    client.send('hello');
  });
}, 5000);

app.listen(3000);
