const express = require('express');
const expressWs = require('..')(express());

const app = expressWs.app;

app.ws('/broadcast');
const wss = expressWs.getWss();

setInterval(() => {
  // Note that these messages will be sent to all clients.
  wss.clients.forEach((client) => {
    client.send('hello');
  });
}, 5000);

app.listen(3000);
