# express-ws #
WebSocket endpoints for express applications. Gives WebSocket connections access to functionality from express middlewares.

## Installation ##
`npm install express-ws`

## Usage
Add this line to your express application:
```javascript
var expressWs = require('express-ws')(app); //app = express app
```

Now you will be able to add WebSocket routes (almost) the same way you add other routes. The following snippet sets up a simple echo server at `/echo`.
```javascript
app.ws('/echo', function(ws, req) {
  ws.on('message', function(msg) {
    ws.send(msg);
  });
});
```

## Example
```javascript
var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);

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

server.listen(3000);
```
