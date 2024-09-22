const ws = require('ws');
const express = require('express');

const app = express();
app.use(express.static('web'));

const wss = new ws.Server({ port: 8080 });

const users = [];
const rateLimit = 100;
const rateLimitWindow = 1000;
const userRequests = {};

wss.on('connection', function connection(ws) {
  setUser((users.length || 0) + 1, ws, ws.url);
  wss.clients.forEach(function each(client) {
    if (client !== ws && client.readyState === ws.OPEN) {
      client.send(JSON.stringify({ type: "add", id: getUser(ws, ws.url) }));
    }
  });
  if (users[ws.url]) {
    for (const url in users) {
      for (const ws1 in users[url]) {
        const userId = users[url][ws1].id;
        if (users[url][ws1] && userId) {
          ws.send(JSON.stringify({ type: "add", id: userId }));
        }
      }
    }
  }
  ws.on('close', function close() {
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === ws.OPEN) {
        client.send(JSON.stringify({ type: "remove", id: getUser(ws, ws.url) }));
      }
    });
    removeUser(ws, ws.url);
  });
  ws.on('message', function incoming(m) {
    try {
      var message = JSON.parse(m);
      if (message.ping) {
        const pingTime = message.ping;
        ws.send(JSON.stringify({ pong: pingTime }));
        return;
      }
      if (!message.x || !message.y || !message.width || !message.height) return;
      const x = message.x;
      const y = message.y;
      const width = message.width;
      const height = message.height;
      const xPer = (x / width) * 100;
      const yPer = (y / height) * 100;

      // rate limiting
      const userId = getUser(ws, ws.url);
      const now = Date.now();
      const userKey = `${ws.url}:${userId}`;
      if (!userRequests[userKey]) userRequests[userKey] = { count: 0, lastReset: now };
      const userRequest = userRequests[userKey];
      if (userRequest.count >= rateLimit) {
        const timeSinceLastReset = now - userRequest.lastReset;
        if (timeSinceLastReset < rateLimitWindow) {
          ws.send(JSON.stringify({ type: "error", message: "Too many requests. Please wait a moment." }));
          return;
        } else {
          userRequest.count = 0;
          userRequest.lastReset = now;
        }
      }
      userRequest.count++;

      wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === ws.OPEN) {
          client.send(JSON.stringify({ type: "update", x: xPer, y: yPer, id: userId }));
        }
      });
    } catch (error) {}
  });
});

function setUser(id, ws, url) {
  if (!users[url]) users[url] = {};
  users[url][ws] = { id };
}

function removeUser(ws, url) {
  if (!users[url]) users[url] = {};
  delete users[url][ws];
}

function getUser(ws, url) {
  if (!users[url]) users[url] = {};
  if (!users[url][ws]) return null;
  return users[url][ws].id;
}

app.listen(3490, () => {
  console.log('Listening on port 8080 and 3490');
});