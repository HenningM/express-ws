import wrapMiddleware from './wrap-middleware';
import websocketUrl from './websocket-url';

export default function addWsMethod(target) {
  /* We add methods to recieve other events, too. */
  const urlSuffix = {
    ws: '', // Compatible with the old suffix
    wsError: 'error',
    wsClose: 'close',
    wsMessage: 'message',
    wsPing: 'ping',
    wsPong: 'pong',
    wsOpen: 'open'
  };

  for (const method in urlSuffix) {
    /* This prevents conflict with other things setting the same method names. */
    if (target[method] === null || target[method] === undefined) {
      target[method] = function addWsRoute(route, ...middlewares) {
        const wrappedMiddlewares = middlewares.map(wrapMiddleware);

        /* We append `/.websocket` to the route path here. Why? To prevent conflicts when
         * a non-WebSocket request is made to the same GET route - after all, we are only
         * interested in handling WebSocket requests.
         *
         * Whereas the original `express-ws` prefixed this path segment, we suffix it -
         * this makes it possible to let requests propagate through Routers like normal,
         * which allows us to specify WebSocket routes on Routers as well \o/! */
        const wsRoute = websocketUrl(route, urlSuffix[method]);

        /* Here we configure our new GET route. It will never get called by a client
         * directly, it's just to let our request propagate internally, so that we can
         * leave the regular middleware execution and error handling to Express. */
        this.get.apply(this, [wsRoute].concat(wrappedMiddlewares));

        /* Prevent the socket from being closed automatically */
        if (method != 'ws')
          this.ws(route, (ws, req, next) => { next(); });

        /*
         * Return `this` to allow for chaining:
         */
        return this;
      };
    }
  }
}
