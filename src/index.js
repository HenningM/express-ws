/* This module does a lot of monkeypatching, but unfortunately that appears to be the only way to
 * accomplish this kind of stuff in Express.
 *
 * Here be dragons. */

import http from 'http';
import express from 'express';
import ws from 'ws';

import websocketUrl from './websocket-url';
import addWsMethod from './add-ws-method';

export default function expressWs(app, httpServer, options = {}) {
  let server = httpServer;

  if (server === null || server === undefined) {
    /* No HTTP server was explicitly provided, create one for our Express application. */
    server = http.createServer(app);

    app.listen = function serverListen(...args) {
      return server.listen(...args);
    };
  }

  // allow caller to pass in options to WebSocketServer constructor
  const wsOptions = options.wsOptions || {};
  wsOptions.server = server;
  const wsServer = new ws.Server(wsOptions);

  /* Create the Express Web Socket object (we do this here so we can bind any routes to it
     so that they can easily access the WebSocket Server clients to broadcast to them) */
  const me = {
    app,
    getWss: function getWss() {
      return wsServer;
    },
    applyTo: function applyTo(router) {
      addWsMethod(router, this);
    },
    setRoom: function setRoom(request) {
      return request.url.replace('/.websocket', '');
    },
    broadcast: function broadcast(
      currentClient,
      message,
      options = { skipSelf: true, allClients: false } // eslint-disable-line no-shadow
    ) {
      let recipients = 0;

      wsServer.clients.forEach((client) => {
        // Ensure that messages are only sent to clients connected to this route (/chat).
        let shouldBroadcastToThisClient = true;

        if (options.skipSelf) {
          shouldBroadcastToThisClient = shouldBroadcastToThisClient && client !== currentClient;
        }

        if (currentClient.room !== undefined && !options.allClients) {
          shouldBroadcastToThisClient = shouldBroadcastToThisClient
            && client.room === currentClient.room;
        }

        const theSocketIsOpen = currentClient.readyState === 1; /* WebSocket.OPEN */

        if (shouldBroadcastToThisClient && theSocketIsOpen) {
          client.send(message);
          recipients += 1;
        }
      });
      return recipients;
    }
  };

  /* Make our custom `.ws` method available directly on the Express application. You should
   * really be using Routers, though. */
  addWsMethod(app, me);

  /* Monkeypatch our custom `.ws` method into Express' Router prototype. This makes it possible,
   * when using the standard Express Router, to use the `.ws` method without any further calls
   * to `makeRouter`. When using a custom router, the use of `makeRouter` may still be necessary.
   *
   * This approach works, because Express does a strange mixin hack - the Router factory
   * function is simultaneously the prototype that gets assigned to the resulting Router
   * object. */
  if (!options.leaveRouterUntouched) {
    addWsMethod(express.Router, me);
  }

  wsServer.on('connection', (socket, request) => {
    if ('upgradeReq' in socket) {
      request = socket.upgradeReq;
    }

    request.ws = socket;
    request.wsHandled = false;

    /* By setting this fake `.url` on the request, we ensure that it will end up in the fake
     * `.get` handler that we defined above - where the wrapper will then unpack the `.ws`
     * property, indicate that the WebSocket has been handled, and call the actual handler. */
    request.url = websocketUrl(request.url);

    const dummyResponse = new http.ServerResponse(request);

    dummyResponse.writeHead = function writeHead(statusCode) {
      if (statusCode > 200) {
        /* Something in the middleware chain signalled an error. */
        dummyResponse._header = ''; // eslint-disable-line no-underscore-dangle
        socket.close();
      }
    };

    app.handle(request, dummyResponse, () => {
      if (!request.wsHandled) {
        /* There was no matching WebSocket-specific route for this request. We'll close
         * the connection, as no endpoint was able to handle the request anyway... */
        socket.close();
      }
    });
  });

  return me;
}
