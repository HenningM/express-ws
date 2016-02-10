/* This module does a lot of monkeypatching, but unfortunately that appears to be the only way to
 * accomplish this kind of stuff in Express.
 *
 * Here be dragons. */

import http from 'http';
import express from 'express';
import ws from 'ws';

import trailingSlash from './trailing-slash';

/* The following fixes HenningM/express-ws#17, correctly. */
function websocketUrl(url) {
  if (url.indexOf('?') !== -1) {
    const [baseUrl, query] = url.split('?');

    return `${trailingSlash(baseUrl)}.websocket?${query}`;
  }
  return `${trailingSlash(url)}.websocket`;
}

export function expressWs(app, httpServer, options = {}) {
  let server = httpServer;

  if (!server) {
    /* No HTTP server was explicitly provided, create one for our Express application. */
    server = http.createServer(app);

    app.listen = function serverListen() {
      server.listen.apply(server, arguments);
    };
  }

  function wrapMiddleware(middleware) {
    return (req, res, next) => {
      if (req.ws !== null) {
        req.wsHandled = true;
        /* Unpack the `.ws` property and call the actual handler. */
        middleware(req.ws, req, next);
      } else {
        /* This wasn't a WebSocket request, so skip this middleware. */
        next();
      }
    };
  }

  function addWsMethod(target) {
    if (!target.ws) { /* This prevents conflict with other things setting `.ws`. */
      target.ws = function addWsRoute(route) {
        const middlewares = Array.prototype.slice.call(arguments, 1); // deopt!
        const wrappedMiddlewares = middlewares.map(wrapMiddleware);

        /* We append `/.websocket` to the route path here. Why? To prevent conflicts when
         * a non-WebSocket request is made to the same GET route - after all, we are only
         * interested in handling WebSocket requests.
         *
         * Whereas the original `express-ws` prefixed this path segment, we suffix it -
         * this makes it possible to let requests propagate through Routers like normal,
         * which allows us to specify WebSocket routes on Routers as well \o/! */
        const wsRoute = websocketUrl(route);

        /* Here we configure our new GET route. It will never get called by a client
         * directly, it's just to let our request propagate internally, so that we can
         * leave the regular middleware execution and error handling to Express. */
        target.get.apply(target, [wsRoute].concat(wrappedMiddlewares));
      };
    }
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
    request.url = websocketUrl(request.url);

    const dummyResponse = new http.ServerResponse(request);

    dummyResponse.writeHead = (statusCode) => {
      if (statusCode > 200) {
        /* Something in the middleware chain signalled an error. */
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

  return {
    app,
    getWss: () => wsServer,
    applyTo: (router) => addWsMethod(router)
  };
}
