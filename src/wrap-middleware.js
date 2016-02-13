export default function wrapMiddleware(middleware) {
  return (req, res, next) => {
    if (req.ws !== null && req.ws !== undefined) {
      req.wsHandled = true;
      /* Unpack the `.ws` property and call the actual handler. */
      middleware(req.ws, req, next);
    } else {
      /* This wasn't a WebSocket request, so skip this middleware. */
      next();
    }
  };
}
