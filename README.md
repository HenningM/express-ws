# express-ws [![Dependency Status](https://www.versioneye.com/nodejs/express-ws/badge?style=flat)](https://www.versioneye.com/nodejs/express-ws)

[WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) endpoints for [Express](http://expressjs.com/) applications. Lets you define WebSocket endpoints like any other type of route, and applies regular Express middleware like for anything else.

Version 2.0 of this library contains a breaking change. Please make sure to read [CHANGELOG.md](CHANGELOG.md) before upgrading.

## Installation

`npm install --save express-ws`

## Usage

__Full documentation can be found in the API section below. This section only shows a brief example.__

Add this line to your Express application:

```javascript
var expressWs = require('express-ws')(app);
```

Now you will be able to add WebSocket routes (almost) the same way you add other routes. The following snippet sets up a simple echo server at `/echo`.

```javascript
app.ws('/echo', function(ws, req) {
  ws.on('message', function(msg) {
    ws.send(msg);
  });
});
```

It works with routers, too, this time at `/ws-stuff/echo`:

```javascript
var router = express.Router();

router.ws('/echo', function(ws, req) {
  ws.on('message', function(msg) {
    ws.send(msg);
  });
});

app.use("/ws-stuff", router);
```

We can also listen to the socket when receiving a message rather than when the connection establishes, using `wsMessage`, `wsOpen`, `wsClose`, `wsPing`, `wsPong`, `wsError` methods. This helps passing the message through middlewares. The original parameters of the callback function are stored in `req.wsParams`:

```javascript```
app.wsMessage("/", function(ws, req, next) {
    ws.send("1: "+req.wsParams.data); // this will be sent.
    next();
});

app.wsMessage("/", function(ws, req, next) {
    ws.send("2: "+req.wsParams.data); // this will be sent, too.
});

app.wsMessage("/", function(ws, req) {
    ws.send("3: "+req.wsParams.data); // this won't be sent.
});
```

## Full example

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

app.listen(3000);
```

## API

### expressWs(app, *server*, *options*)

Sets up `express-ws` on the specified `app`. This will modify the global Router prototype for Express as well - see the `leaveRouterUntouched` option for more information on disabling this.

* __app__: The Express application to set up `express-ws` on.
* __server__: *Optional.* When using a custom `http.Server`, you should pass it in here, so that `express-ws` can use it to set up the WebSocket upgrade handlers. If you don't specify a `server`, you will only be able to use it with the server that is created automatically when you call `app.listen`.
* __options__: *Optional.* An object containing further options.
  * __leaveRouterUntouched:__ Set this to `true` to keep `express-ws` from modifying the Router prototype. You will have to manually `applyTo` every Router that you wish to make `.ws` available on, when this is enabled.
  * __wsOptions:__ Options object passed to WebSocketServer constructor. Necessary for any ws specific features.

This function will return a new `express-ws` API object, which will be referred to as `wsInstance` in the rest of the documentation.

### wsInstance.app

This property contains the `app` that `express-ws` was set up on.

### wsInstance.getWss()

Returns the underlying WebSocket server/handler. You can use `wsInstance.getWss().clients` to obtain a list of all the connected WebSocket clients for this server.

Note that this list will include *all* clients, not just those for a specific route - this means that it's often *not* a good idea to use this for broadcasts, for example.

### wsInstance.applyTo(router)

Sets up `express-ws` on the given `router` (or other Router-like object). You will only need this in two scenarios:

1. You have enabled `options.leaveRouterUntouched`, or
2. You are using a custom router that is not based on the express.Router prototype.

In most cases, you won't need this at all.

### app.ws(path, ...middlewares)

Set middlewares to handle WebSocket request after connection establishes.

Signature of a middleware (same below): `function(ws, req)`, where `ws` is as in [ws](https://www.npmjs.com/package/ws) module.

### app.wsError(path, ...middlewares)

Set middlewares to handle WebSocket connection when an error event occurs.

It will set `req.wsParams.error` for error message as in callback parameter of `ws.onError`.

Things are similar below.

### app.wsClose(path, ...middlewares)

Will set `req.wsParams.code` and `req.wsParams.message`.

### app.wsMessage(path, ...middlewares)

Will set `req.wsParams.data` and `req.wsParams.flags`.

### app.wsPing(path, ...middlewares)

Will set `req.wsParams.data` and `req.wsParams.flags`.

### app.wsPong(path, ...middlewares)

Will set `req.wsParams.data` and `req.wsParams.flags`.

### app.wsOpen(path, ...middlewares)

Will set nothing extra.

All methods added to `app` will also be added to `Router` if `leaveRouterUntouched` is off.

## Development

This module is written in ES6, and uses Babel for compilation. What this means in practice:

* The source code lives in the `src/` directory.
* After changing this code, make sure to run `npm run build` to compile it.
