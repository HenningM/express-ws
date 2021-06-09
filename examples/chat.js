const express = require('express');
const expressWs = require('..')(express());

const app = expressWs.app;

function roomHandler(client, request) {
  client.room = this.setRoom(request);
  console.log(`New client connected to ${client.room}`); // eslint-disable-line no-console

  client.on('message', (message) => {
    const numberOfRecipients = this.broadcast(client, message);
    console.log(`${client.room} message broadcast to ${numberOfRecipients} recipient${numberOfRecipients === 1 ? '' : 's'}.`); // eslint-disable-line no-console, max-len
  });
}

app.ws('/room1', roomHandler);
app.ws('/room2', roomHandler);

app.listen(3000, () => {
  console.log('\nChat server running on http://localhost:3000\n\nFor Room 1, connect to http://localhost:3000/room1\nFor Room 2, connect to http://localhost:3000/room2\n'); // eslint-disable-line no-console
});
