export default function wrapMiddleware(middleware) {
  if (middleware.length === 4) {
    return (error, req, res, next) => {
      // Not checking for `req.ws` here as error shouldn't be reached if
      //   no middleware is available to run first (and that would be
      //   handled below)
      req.wsHandled = true;
      try {
        /* Unpack the `.ws` property and call the actual handler. */
        middleware(error, req.ws, req, next);
      } catch (err) {
        /* If an error is thrown, let's send that on to any error handling */
        next(err);
      }
    };
  }
  return (req, res, next) => {
    if (req.ws !== null && req.ws !== undefined) {
      req.wsHandled = true;
      try {
        /* Unpack the `.ws` property and call the actual handler. */
        middleware(req.ws, req, next);
      } catch (err) {
        /* If an error is thrown, let's send that on to any error handling */
        next(err);
      }
    } else {
      /* This wasn't a WebSocket request, so skip this middleware. */
      next();
    }
  };
}
