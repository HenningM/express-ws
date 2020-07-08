const express = require('express');
let expressWs = require('..');

expressWs = expressWs(express());
const { app } = expressWs;

app.ws('/a', (/* ws, req */) => {
});
const wss = expressWs.getWss();

app.ws('/b', (/* ws, req */) => {
});

setInterval(() => {
  wss.clients.forEach((client) => {
    client.send('hello');
  });
}, 5000);

app.listen(3000);
