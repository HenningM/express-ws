var express = require('express');
var expressWs = require('..')

var expressWs = expressWs(express());
var app = expressWs.app;

app.ws('/chat', function(ws, req) {

  ws.on('message', message => {
    this.getWss('/chat').clients.forEach(client => {
      client.send(message)
    })
  })

});

app.listen(3000)
