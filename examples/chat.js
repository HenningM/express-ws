var express = require('express');
var expressWs = require('..');

var expressWs = expressWs(express());
var app = expressWs.app;

app.ws('/room1', function(client, request) {

  client.room = request.url.replace('/.websocket', '');

  client.on('message', message => {
    let count = 0;
    this.getWss().clients.forEach(c => {
      // Ensure that messages are only sent to clients connected to Room 1.
      if (c !== client && c.room === '/room1' && client.readyState === 1 /* WebSocket.OPEN */) {
        c.send(message);
        count++;
      }
    })
    console.log(`/room1 message broadcast to ${count} client${count === 1 ? '': 's'}.`);
  })
});

app.ws('/room2', function(client, request) {

  client.room = request.url.replace('/.websocket', '');

  client.on('message', message => {
    let count = 0;
    this.getWss().clients.forEach(c => {
      // Ensure that messages are only sent to clients connected to Room 2.
      if (c !== client && c.room === '/room2' && client.readyState === 1 /* WebSocket.OPEN */) {
        c.send(message);
        count++;
      }
    })
    console.log(`/room2 message broadcast to ${count} client${count === 1 ? '': 's'}.`);
  })
})

app.listen(3000, () => {
  console.log('\nChat server running on http://localhost:3000\n\nFor Room 1, connect to http://localhost:3000/room1\nFor Room 2, connect to http://localhost:3000/room2\n')
})
