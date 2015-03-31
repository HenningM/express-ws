var url = require('url');
var urlJoin = require('url-join');
var http = require('http');
var ServerResponse = http.ServerResponse;
var WebSocketServer = require('ws').Server;

var wsServers = {};

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

  function addSocketRoute(route, middleware, callback) {
    var args = [].splice.call(arguments, 0);
    var wsPath = urlJoin(app.mountpath, route);

    if (args.length < 2)
      throw new SyntaxError('Invalid number of arguments');

    if (args.length === 2) {
      middleware = [middleware];
    } else if (typeof middleware === 'object') {
      middleware.push(callback);
    } else {
      middleware = args.slice(1);
    }

    var wss = new WebSocketServer({
      server: server,
      path: wsPath
    });

    wsServers[wsPath] = wss;

    wss.on('connection', function(ws) {
      var response = new ServerResponse(ws.upgradeReq);
      response.writeHead = function (statusCode) {
        if (statusCode > 200) ws.close();
      };
      ws.upgradeReq.method = 'ws';

      app.handle(ws.upgradeReq, response, function(err) {
        var idx = 0;
        (function next (err) {
          if (err) return;
          var cur = middleware[idx++];
          if (!middleware[idx]) {
            cur(ws, ws.upgradeReq);
          } else {
            cur(ws.upgradeReq, response, next);
          }
        }(err));
      });
    });

    return app;
  };

  app.ws = addSocketRoute;

  return {
    app: app,
    getWss: function (route) {
      return wsServers[route];
    }
  };
};
