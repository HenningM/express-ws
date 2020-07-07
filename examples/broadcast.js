const express = require('express');
let expressWs = require('..');

expressWs = expressWs(express());
const app = expressWs.app;

app.ws('/a', (/* ws, req */) => {
});
const aWss = expressWs.getWss('/a');

app.ws('/b', (/* ws, req */) => {
});

setInterval(() => {
  aWss.clients.forEach((client) => {
    client.send('hello');
  });
}, 5000);

app.listen(3000);
