var url = require('url');
var http = require('http');
var ServerResponse = http.ServerResponse;
var WebSocketServer = require('ws').Server;

var wsServer;

var wrapWsHandler = function(handler) {
    return function(req, res, next) {
      if (req.ws) {
        req.wsHandled = true;
        handler(req.ws, req, next);
      } else {
        next();
      }
    };
};

/**
 * @param {express.Application} app
 * @param {http.Server} [server]
 */
module.exports = function (app, server) {
  if(!server) {
    server = http.createServer(app);

    app.listen = function()
    {
      return server.listen.apply(server, arguments)
    }
  }

  wsServer = new WebSocketServer({ server: server });

  wsServer.on('connection', function(ws) {
    var response = new ServerResponse(ws.upgradeReq);
    response.writeHead = function (statusCode) {
      if (statusCode > 200) ws.close();
    };
    ws.upgradeReq.ws = ws;
    ws.upgradeReq.url = '/.websocket/' + ws.upgradeReq.url;

    app.handle(ws.upgradeReq, response, function() {
      if (!ws.upgradeReq.wsHandled) {
        ws.close();
      }
    });
  });

  function addSocketRoute(route, middleware) {
    var args = [].splice.call(arguments, 0);
    route = '/.websocket/' + route;

    var middlewares = args.slice(1).map(wrapWsHandler);
    var routeArgs = [route].concat(middlewares);
    app.get.apply(app, routeArgs);

    return app;
  };

  app.ws = addSocketRoute;

  return {
    app: app,
    getWss: function (route) {
      return wsServer;
    }
  };
};
