var express = require('express');
var expressWs = require('..')

var expressWs = expressWs(express());
var app = expressWs.app;

app.ws('/a', function(ws, req) {
});

app.ws('/b', function(ws, req) {
});

setInterval(function () {
  const clientsA = expressWs.getWssClients("/a")
  const clientsB = expressWs.getWssClients("/b")

  clientsA.forEach(client =>  {client.send("Hello clients from route /a")})
  clientsB.forEach(client =>  {client.send("Hello clients from route /b")})
}, 5000);

app.listen(3100)
