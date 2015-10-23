var express = require('express');
var expressWs = require('..')

var expressWs = expressWs(express());
var app = expressWs.app;

app.get('/', function (req, res) {
  res.send(String(function () {
    /*
<!DOCTYPE html>
<html>
<head>
  <mate charset="utf-8">
</head>
<body>
  <div id="msgs"></div>
</body>
<script>
var msgs = [];
var host = location.href.slice(location.protocol.length + 2);
console.log(host);
var ws = new WebSocket('ws://' + host + 'a');
ws.onopen = function (e) {
  ws.send(Math.random().toString(36));
};
ws.onmessage = function (e) {
  console.log(e);
  msgs.push(e.data);
  while (msgs.length > 30) {
    msgs.shift();
  }
  document.querySelector('#msgs').innerHTML = msgs.join('<br>')
};
</script>
</html>
     */
  }).match(/\/\*([^]*)\*\//)[1]);
});

app.ws('/a', function (client, req) {
  client.on('message', function (message) {
    client._lastMessage = message;
    client.send('welcome.' + message);
  });
});

var aWss = expressWs.getWss('/a');

app.ws('/b', function (client, req) {});

setInterval(function () {
  aWss.clients.forEach(function (client) {
    client.send('hello ' + client._lastMessage);
  });
}, 5000);

app.listen(3000);