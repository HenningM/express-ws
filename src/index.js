/* This module does a lot of monkeypatching, but unfortunately that appears to be the only way to
 * accomplish this kind of stuff in Express.
 *
 * Here be dragons. */

import http from 'http';
import express from 'express';
import ws from 'ws';

import websocketUrl from './websocket-url';
import addWsMethod from './add-ws-method';

export function expressWs(app, httpServer, options = {}) {
  let server = httpServer;

  if (server === null || server === undefined) {
    /* No HTTP server was explicitly provided, create one for our Express application. */
    server = http.createServer(app);

    app.listen = function serverListen() {
      server.listen.apply(server, arguments);
    };
  }

  /* Make our custom `.ws` method available directly on the Express application. You should
   * really be using Routers, though. */
  addWsMethod(app);

  /* Monkeypatch our custom `.ws` method into Express' Router prototype. This makes it possible,
   * when using the standard Express Router, to use the `.ws` method without any further calls
   * to `makeRouter`. When using a custom router, the use of `makeRouter` may still be necessary.
   *
   * This approach works, because Express does a strange mixin hack - the Router factory
   * function is simultaneously the prototype that gets assigned to the resulting Router
   * object. */
  if (!options.leaveRouterUntouched) {
    addWsMethod(express.Router);
  }

  const wsServer = new ws.Server({ server });

  wsServer.on('connection', (socket) => {
    const request = socket.upgradeReq;

    request.ws = socket;
    request.wsHandled = false;

    /* By setting this fake `.url` on the request, we ensure that it will end up in the fake
     * `.get` handler that we defined above - where the wrapper will then unpack the `.ws`
     * property, indicate that the WebSocket has been handled, and call the actual handler. */
    const originalUrl = request.url;
    request.url = websocketUrl(request.url);

    const dummyResponse = new http.ServerResponse(request);

    dummyResponse.writeHead = function writeHead(statusCode) {
      if (statusCode > 200) {
        /* Something in the middleware chain signalled an error. */
        socket.close();
      }
    };

    app.handle(request, dummyResponse, () => {
      if (!request.wsHandled) {
        /* There was no matching WebSocket-specific route for this request. We'll close
         * the connection, as no endpoint was able to handle the request anyway... */
        // socket.close(); // This will close the connection before listeners below catch it.
      }
    });

    /* We send GET requests on every events in order to let users use Express middleware
     * chains to handle these events */
    socket.on("error", function(error) {
      request.url = websocketUrl(originalUrl, "error");
      request.wsParams = { error };
      app.handle(request, dummyResponse);
    });
    socket.on("close", function(code, message) {
      request.url = websocketUrl(originalUrl, "close");
      request.wsParams = { code, message };
      app.handle(request, dummyResponse);
    });
    socket.on("message", function(data, flags) {
      request.url = websocketUrl(originalUrl, "message");
      request.wsParams = { data, flags };
      app.handle(request, dummyResponse);
    });
    socket.on("ping", function(data, flags) {
      request.url = websocketUrl(originalUrl, "ping");
      request.wsParams = { data, flags };
      app.handle(request, dummyResponse);
    });
    socket.on("pong", function(data, flags) {
      request.url = websocketUrl(originalUrl, "pong");
      request.wsParams = { data, flags };
      app.handle(request, dummyResponse);
    });
    socket.on("open", function() {
      request.url = websocketUrl(originalUrl, "open");
      request.wsParams = {};
      app.handle(request, dummyResponse);
    });
  });

  return {
    app,
    getWss: function getWss() {
      return wsServer;
    },
    applyTo: function applyTo(router) {
      addWsMethod(router);
    }
  };
}
