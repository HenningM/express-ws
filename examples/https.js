const https = require('https');
const fs = require('fs');

const express = require('express');
const expressWs = require('..');

// Note: you will need the following two files in the examples/ folder for
// ===== this example to work. To generate locally-trusted TLS certificates,
//       you can use mkcert (https://github.com/FiloSottile/mkcert) and then
//       copy your certificates here (e.g., for localhost, copy localhost.pem
//       to ./cert.pem and localhost-key.pem to ./key.pem.)
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};
const app = express();
const server = https.createServer(options, app);
expressWs(app, server);

app.use((req, res, next) => {
  console.log('middleware'); // eslint-disable-line no-console
  req.testing = 'testing';
  return next();
});

app.get('/', (req, res) => {
  console.log('get route', req.testing); // eslint-disable-line no-console
  res.end();
});

app.ws('/', (ws, req) => {
  ws.on('message', (msg) => {
    console.log(msg); // eslint-disable-line no-console
  });
  console.log('socket', req.testing); // eslint-disable-line no-console
});

server.listen(3000);
