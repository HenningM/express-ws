# 
Only difference from express-ws [![Dependency Status](https://snyk.io/test/github/henningm/express-ws/badge.svg)](https://snyk.io/test/github/henningm/express-ws)
is the method getWssClients(url) that fetchs clients of a given URL

```javascript
app.ws('/a', function(ws, req) {
});

app.ws('/b', function(ws, req) {
});

//Fetch clients subscribed to route /a
const clientsA = expressWs.getWssClients("/a")
clientsA.forEach(client =>  {client.send("Hello clients from route /a")})
  
//Fetch clients subscribed to route /b
const clientsB = expressWs.getWssClients("/b") 
clientsB.forEach(client =>  {client.send("Hello clients from route /b")})
```
