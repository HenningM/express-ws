import http from 'http';
import express from 'express';
import WebSocket from 'ws';
// eslint-disable-next-line import/no-extraneous-dependencies
import got from 'got';
import expressWs from '../src';

describe('Simple usage', () => {
  it('Sets up Web Sockets server', (done) => {
    const expressWsInstance = expressWs(express());
    const { app } = expressWsInstance;

    const messages = [];

    app.use((req, res, next) => {
      messages.push('middleware');
      req.testing = 'testing';
      return next();
    });

    app.get('/', (req, res /* , next */) => {
      messages.push(`get route ${req.testing}`);
      res.end();
    });

    app.ws('/', (ws, req) => {
      ws.on('message', (msg) => {
        messages.push(msg);
        ws.send('server response');
      });
      messages.push('socket', req.testing);
    });

    const server = app.listen(3000);

    const ws = new WebSocket('ws://localhost:3000/');

    ws.on('open', () => {
      ws.send('something');
    });

    ws.on('message', async (data) => {
      messages.push(data);
      expect(messages).to.deep.equal([
        'middleware',
        'socket',
        'testing',
        'something',
        'server response'
      ]);
      await got('http://localhost:3000/');
      expect(messages.pop()).to.equal('get route testing');
      ws.terminate(); // Close WS client
      server.close(); // Close HTTP server underlying WS server
      expressWsInstance.getWss().close(); // Close WS server
      done();
    });
  });

  it('Sets up Web Sockets server (supplying own HTTP server)', (done) => {
    const app = express();
    const server = http.createServer(app).listen(3000);
    const expressWsInstance = expressWs(app, server);

    const messages = [];

    app.use((req, res, next) => {
      messages.push('middleware');
      req.testing = 'testing';
      return next();
    });

    app.get('/', (req, res /* , next */) => {
      messages.push(`get route ${req.testing}`);
      res.end();
    });

    app.ws('/', (ws, req) => {
      ws.on('message', (msg) => {
        messages.push(msg);
        ws.send('server response');
      });
      messages.push('socket', req.testing);
    });

    const ws = new WebSocket('ws://localhost:3000/');

    ws.on('open', () => {
      ws.send('something');
    });

    ws.on('message', async (data) => {
      messages.push(data);
      expect(messages).to.deep.equal([
        'middleware',
        'socket',
        'testing',
        'something',
        'server response'
      ]);
      await got('http://localhost:3000/');
      expect(messages.pop()).to.equal('get route testing');
      ws.terminate(); // Close WS client
      server.close(); // Close HTTP server underlying WS server
      expressWsInstance.getWss().close(); // Close WS server
      done();
    });
  });

  it('Passes on query string', (done) => {
    const expressWsInstance = expressWs(express());
    const { app } = expressWsInstance;

    const messages = [];

    app.get('/', (req, res /* , next */) => {
      messages.push(`get route ${req.url}`);
      res.end();
    });

    app.ws('/', (ws, req) => {
      ws.on('message', (msg) => {
        messages.push(msg);
        ws.send('server response');
      });
      messages.push('socket', req.url);
    });

    const server = app.listen(3000);

    const ws = new WebSocket('ws://localhost:3000/?abc=1');

    ws.on('open', () => {
      ws.send('something');
    });

    ws.on('message', async (data) => {
      messages.push(data);
      expect(messages).to.deep.equal([
        'socket',
        '/.websocket?abc=1',
        'something',
        'server response'
      ]);
      await got('http://localhost:3000/?abc=2');
      expect(messages.pop()).to.equal('get route /?abc=2');
      ws.terminate(); // Close WS client
      server.close(); // Close HTTP server underlying WS server
      expressWsInstance.getWss().close(); // Close WS server
      done();
    });
  });
});

describe('Router', () => {
  it('Silently recovers with HTTP requests passed through the underlying app', (done) => {
    const expressWsInstance = expressWs(express(), null, {
      leaveRouterUntouched: true
    });
    const { app, applyTo } = expressWsInstance;

    const messages = [];

    const router = express.Router();

    applyTo(router);

    app.get('/ws-stuff/echo', (req, res /* , next */) => {
      messages.push(`get route ${req.url}`);
      res.end();
    });

    router.ws('/echo', (ws, req) => {
      ws.on('message', (msg) => {
        messages.push(msg);
        ws.send('server response');
      });
      messages.push('socket', req.url);
    });

    app.use('/ws-stuff', router);

    const server = app.listen(3000);

    const ws = new WebSocket('ws://localhost:3000/ws-stuff/echo');

    ws.on('open', () => {
      ws.send('something');
    });

    ws.on('message', async (data) => {
      messages.push(data);

      expect(messages).to.deep.equal([
        'socket',
        '/echo/.websocket',
        'something',
        'server response'
      ]);
      await got('http://localhost:3000/ws-stuff/echo');
      expect(messages.pop()).to.equal('get route /ws-stuff/echo');

      ws.terminate(); // Close WS client
      server.close(); // Close HTTP server underlying WS server
      expressWsInstance.getWss().close(); // Close WS server
      done();
    });
  });
});

describe('expressWsInstance `applyTo`', () => {
  it('`applyTo` adds to router', () => {
    const { Router: { ws } } = express;
    delete express.Router.ws;
    const expressWsInstance = expressWs(express(), null, {
      leaveRouterUntouched: true
    });

    // eslint-disable-next-line no-unused-expressions
    expect(express.Router.ws).to.be.undefined;
    const { applyTo } = expressWsInstance;

    applyTo(express.Router);
    expect(express.Router.ws).to.be.a('function');

    express.Router.ws = ws;
  });
});

describe('Error handling', () => {
  it('Silently ignores failing middleware', (done) => {
    const expressWsInstance = expressWs(express());
    const { app } = expressWsInstance;

    const messages = [];

    app.get('/', (req, res /* , next */) => {
      messages.push('get route');
      res.end();
    });

    app.ws('/', (ws) => {
      ws.on('message', (msg) => {
        messages.push(msg);
        ws.send('server response');
      });
      messages.push('socket');

      throw new Error('Erring middleware!');
    }, (err, req, res, next) => { // eslint-disable-line no-unused-vars
      messages.push('error middleware 1');
      throw new Error('another oops');
    }, (err, req, res, next) => { // eslint-disable-line no-unused-vars
      messages.push('error middleware 2');
    });

    const server = app.listen(3000);

    const ws = new WebSocket('ws://localhost:3000/');

    ws.on('open', () => {
      ws.send('something');
    });

    ws.on('message', async (data) => {
      messages.push(data);
      expect(messages).to.deep.equal([
        'socket',
        'error middleware 1',
        'error middleware 2',
        'something',
        'server response'
      ]);
      await got('http://localhost:3000/');
      expect(messages.pop()).to.equal('get route');
      ws.terminate(); // Close WS client
      server.close(); // Close HTTP server underlying WS server
      expressWsInstance.getWss().close(); // Close WS server
      done();
    });
  });

  it('Closes socket upon middleware setting erring `writeHead` status code', (done) => {
    const expressWsInstance = expressWs(express());
    const { app } = expressWsInstance;

    const messages = [];

    app.use((req, res, next) => {
      messages.push('middleware 1');
      res.writeHead(200);
      return next();
    }, (req, res, next) => {
      messages.push('middleware 2');
      res.writeHead(500);
      return next();
    });

    app.get('/', (req, res /* , next */) => {
      messages.push('get route');
      res.end();
    });

    let server;
    app.ws('/', (ws) => {
      ws.on('message', (msg) => {
        messages.push(msg);
        try {
          ws.send('server response');
        } catch (err) {
          expect(messages).to.deep.equal([
            'middleware 1',
            'middleware 2',
            'socket',
            'something',
          ]);
          expect(err.toString()).to.include('WebSocket is not open');
          ws.terminate(); // Close WS client
          server.close(); // Close HTTP server underlying WS server
          expressWsInstance.getWss().close(); // Close WS server
          done();
        }
      });
      messages.push('socket');
    });

    server = app.listen(3000);

    const ws = new WebSocket('ws://localhost:3000/');

    ws.on('open', () => {
      ws.send('something');
    });

    ws.on('message', () => {
    });
  });

  it('Silently recovers with HTTP requests passed through the underlying app', async () => {
    const expressWsInstance = expressWs(express());
    const { app } = expressWsInstance;

    const messages = [];

    app.ws('/', (ws, req) => {
      messages.push('socket', req.url);
    });

    // Use this to avoid an error
    app.get('/.websocket', (req, res /* , next */) => {
      messages.push(`get route ${req.url}`);
      res.end();
    });

    const server = app.listen(3000);

    await got('http://localhost:3000/.websocket');

    expect(messages).to.deep.equal([
      'get route /.websocket'
    ]);
    server.close(); // Close HTTP server underlying WS server
    expressWsInstance.getWss().close(); // Close WS server
  });

  it('Closes socket on request without matching WebSocket router', (done) => {
    const expressWsInstance = expressWs(express());
    const { app } = expressWsInstance;

    const messages = [];

    const server = app.listen(3000);

    const ws = new WebSocket('ws://localhost:3000/');

    ws.on('open', () => {
      messages.push('opened 1');
    });
    ws.on('close', () => {
      expect(messages).to.deep.equal([
        'opened 1'
      ]);
      ws.terminate(); // Close WS client
      server.close(); // Close HTTP server underlying WS server
      done();
    });
  });
});

describe('params', () => {
  it('Sets up routes with params', (done) => {
    const expressWsInstance = expressWs(express());
    const { app } = expressWsInstance;

    const messages = [];

    app.param('world', (req, res, next, world) => {
      req.world = world || 'world';
      return next();
    });

    app.get('/hello/:world', (req, res, next) => {
      messages.push('hello', req.world);
      res.end();
      next();
    });

    app.ws('/hello/:world', (ws, req, next) => {
      ws.on('message', (msg) => {
        messages.push(msg);
        ws.send('server response');
      });
      messages.push('socket hello', req.world);
      next();
    });

    const server = app.listen(3000);

    const ws = new WebSocket('ws://localhost:3000/hello/earth');

    ws.on('open', () => {
      ws.send('something');
    });

    ws.on('message', (data) => {
      messages.push(data);
      expect(messages).to.deep.equal([
        'socket hello',
        'earth',
        'something',
        'server response'
      ]);
      ws.terminate(); // Close WS client
      server.close(); // Close HTTP server underlying WS server
      expressWsInstance.getWss().close(); // Close WS server
      done();
    });
  });
});

describe('broadcast', () => {
  it('Broadcasts to clients', (done) => {
    const expressWsInstance = expressWs(express());
    const { app } = expressWsInstance;

    const messagesA = [];
    const messagesB = [];
    const wss = expressWsInstance.getWss();
    app.ws('/a', (ws /* , req */) => {
      ws.on('message', (msg) => {
        messagesA.push(msg);
        ws.send('server response');
        wss.clients.forEach((client) => {
          client.send('hello');
        });
      });
      messagesA.push('a message');
    });

    app.ws('/b', (/* ws, req */) => {
      messagesB.push('b message');
    });

    const server = app.listen(3000);
    const expectedMessagesA = [
      'a message',
      'something',
      'server response',
      'hello',
    ];
    const expectedMessagesB = [
      'b message',
      'hello'
    ];

    let wsA;
    let wsB;
    let ready = false;
    function finish() {
      if (ready) {
        wsA.terminate(); // Close WS client
        wsB.terminate(); // Close WS client
        server.close(); // Close HTTP server underlying WS server
        expressWsInstance.getWss().close(); // Close WS server
        done();
      }
      ready = true;
    }

    wsA = new WebSocket('ws://localhost:3000/a');

    wsA.on('open', () => {
      wsA.send('something');
    });

    wsA.on('message', (data) => {
      messagesA.push(data);
      if (messagesA.length < expectedMessagesA.length) {
        return;
      }
      expect(messagesA).to.deep.equal(expectedMessagesA);
      finish();
    });

    wsB = new WebSocket('ws://localhost:3000/b');

    wsB.on('open', () => {
      wsB.send('something');
    });

    wsB.on('message', (data) => {
      messagesB.push(data);
      if (messagesB.length < expectedMessagesB.length) {
        return;
      }
      expect(messagesB).to.deep.equal(expectedMessagesB);
      finish();
    });
  });
});

describe('Options', () => {
  describe('`leaveRouterUntouched`', () => {
    it('`leaveRouterUntouched` avoids adding to Router prototype', () => {
      const { Router: { ws } } = express;
      delete express.Router.ws;
      expressWs(express(), null, {
        leaveRouterUntouched: true
      });

      // eslint-disable-next-line no-unused-expressions
      expect(express.Router.ws).to.be.undefined;

      express.Router.ws = ws;
    });
  });
});
