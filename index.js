var path = require('path');
var httpMocks = require('node-mocks-http');
var WebSocketServer = require('ws').Server;

module.exports = function (app, server) {
  var addSocketRoute = function (route, middleware, callback) {
    var args = [].splice.call(arguments, 0);
    if (args.length < 2) {
      return;
    } else if (args.length === 2) {
      middleware = [middleware];
    } else if (typeof middleware === 'object') {
      middleware.push(callback);
    } else {
      middleware = args.slice(1);
    }

    var wss = new WebSocketServer({
      server: server,
      path: path.join(app.mountpath, route)
    });
    wss.on('connection', function(ws) {
      var dummyRes = httpMocks.createResponse();
      dummyRes.writeHead = function (statusCode) {
        if (statusCode > 200) ws.close();
      };
      ws.upgradeReq.method = 'ws';

      app.handle(ws.upgradeReq, dummyRes, function(err) {
        var idx = 0;
        (function next (err) {
          if (err) return;
          var cur = middleware[idx++];
          if (!middleware[idx]) {
            cur(ws, ws.upgradeReq);
          } else {
            cur(ws.upgradeReq, dummyRes, next);
          }
        }());
      });
    });
  };

  app.ws = addSocketRoute;
};
